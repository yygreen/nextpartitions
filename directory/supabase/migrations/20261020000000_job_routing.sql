-- Job routing: who gets invited to price a job, when the price window closes, the fallback when
-- nobody prices, price checks, contact details hidden in messages, and an outbox for emails and the CRM.
-- Rules: docs/job-routing.md. Runs after 20261019000000_installer_directory.sql.

-- ---------- new columns ----------
alter table dir_installers
  add column max_open_jobs integer not null default 6 check (max_open_jobs >= 0),
  add column away_from date,
  add column away_to date;

alter table dir_jobs
  add column lat double precision,                       -- job site, ZIP centroid until the address is known
  add column lng double precision,
  add column po_accepted_at timestamptz,                 -- purchase order accepted: counts as paid for release
  add column preferred_installer_id uuid references dir_installers (id), -- customer came from this profile
  add column others_ok boolean not null default false,   -- with a chosen installer: also ask others (off by default)
  add column rush boolean not null default false,        -- close the window as soon as 2 prices are in
  add column requires_background_check boolean not null default false, -- school and public jobs
  add column needed_by date,
  add column search_round smallint not null default 0,   -- 0 not routed, 1 normal, 2 widened
  add column price_due_at timestamptz,
  add column window_closed_at timestamptz,
  add column needs_attention boolean not null default false,
  add column attention_reason text;

alter table dir_job_invites
  add column round smallint not null default 1,
  add column invited_by text not null default 'auto' check (invited_by in ('auto', 'preferred', 'widened', 'manual')),
  add column due_at timestamptz,
  add column reminded_at timestamptz,
  add column estimate_cents integer,                     -- what the installer's own rates give for this job
  add column earliest_install_date date,
  add column assumptions text,                           -- site conditions the firm price is based on
  add column declined_reason text,
  add column late boolean not null default false,
  add column price_flag text check (price_flag in ('above_rates', 'above_area'));

alter table dir_job_messages add column redacted boolean not null default false;

create index on dir_jobs (status) where window_closed_at is null;
create index on dir_jobs (needs_attention) where needs_attention;

-- ---------- helpers ----------
-- Road miles, estimated from a straight line (factor 1.2) until drive times come from Google Routes.
create function dir_miles(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 1.2 * 3958.8 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

create function dir_add_business_days(t timestamptz, n integer) returns timestamptz
language plpgsql immutable as $$
declare d timestamptz := t; left_ integer := n;
begin
  while left_ > 0 loop
    d := d + interval '1 day';
    if extract(isodow from d) < 6 then left_ := left_ - 1; end if;
  end loop;
  return d;
end $$;

-- True when a site visitor or logged-in user is calling (through the API), false for the owner,
-- migrations, cron and the service role. Inside a security definer function current_user is the
-- owner, but the session's role setting still names the caller.
create function dir_called_by_app_user() returns boolean language sql stable as $$
  select coalesce(current_setting('role', true), 'none') in ('anon', 'authenticated');
$$;

-- Approved, with insurance and a business or city registration passed and in date.
create function dir_installer_eligible(i uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from dir_installers where id = i and status = 'approved')
     and exists (select 1 from dir_installer_checks c where c.installer_id = i and c.check_type = 'insurance'
                 and c.status = 'passed' and (c.expires_at is null or c.expires_at >= current_date))
     and exists (select 1 from dir_installer_checks c where c.installer_id = i
                 and c.check_type in ('business_registration', 'city_registration')
                 and c.status = 'passed' and (c.expires_at is null or c.expires_at >= current_date));
$$;

-- Jobs waiting on the installer's price, plus jobs they've won and not finished.
create function dir_open_jobs(i uuid) returns integer
language sql stable security definer set search_path = public as $$
  select (select count(*) from dir_job_invites v join dir_jobs j on j.id = v.job_id
          where v.installer_id = i and v.responded_at is null and j.window_closed_at is null
            and j.status in ('routed', 'quoting'))::integer
       + (select count(*) from dir_jobs j where j.chosen_installer_id = i
          and j.status in ('installer_chosen', 'released', 'scheduled'))::integer;
$$;

-- Quality score for the two quality slots: rating, completed installs, reply speed, late replies.
create function dir_installer_score(i uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select avg(rating) from dir_reviews where installer_id = i and published_at is not null), 4.5) * 20
       + least((select count(*) from dir_jobs where chosen_installer_id = i and status = 'signed_off'), 30)
       - least(coalesce((select extract(epoch from percentile_cont(0.5) within group (order by responded_at - sent_at)) / 3600
                         from dir_job_invites where installer_id = i and responded_at is not null), 12), 48) / 2
       - 3 * (select count(*) from dir_job_invites where installer_id = i and late and sent_at > now() - interval '90 days');
$$;

-- What an installer's own rates give for a job. Scope keys: material, mounting, stalls, ada,
-- urinal_screens, remove_stalls. Rate-card extras: ada_stall_cents, urinal_screen_cents,
-- demo_per_stall_cents, free_miles (default: service radius), per_mile_cents.
create function dir_estimate_cents(p_installer uuid, p_job uuid) returns integer
language plpgsql stable security definer set search_path = public as $$
declare j dir_jobs; i dir_installers; r dir_rate_cards; t numeric; miles double precision; free_ integer;
begin
  select * into j from dir_jobs where id = p_job;
  select * into i from dir_installers where id = p_installer;
  select * into r from dir_rate_cards where installer_id = p_installer
    and material = j.scope->>'material' and mounting = j.scope->>'mounting';
  if r.id is null then return null; end if;
  t := coalesce((j.scope->>'stalls')::integer, 0) * (r.per_stall_low_cents + r.per_stall_high_cents) / 2.0
     + case when coalesce((j.scope->>'ada')::boolean, false) then coalesce((r.extras->>'ada_stall_cents')::integer, 0) else 0 end
     + coalesce((j.scope->>'urinal_screens')::integer, 0) * coalesce((r.extras->>'urinal_screen_cents')::integer, 0)
     + coalesce((j.scope->>'remove_stalls')::integer, 0) * coalesce((r.extras->>'demo_per_stall_cents')::integer, 0);
  if j.lat is not null and i.lat is not null then
    miles := dir_miles(i.lat, i.lng, j.lat, j.lng);
    free_ := coalesce((r.extras->>'free_miles')::integer, i.service_radius_mi);
    if miles > free_ then
      t := t + ceil(miles - free_) * coalesce((r.extras->>'per_mile_cents')::integer, 0);
    end if;
  end if;
  return round(greatest(t, r.minimum_cents))::integer;
end $$;

-- Typical installation price per stall by area and material, from firm prices in the last year.
-- Used for the "above the area's typical price" check and "typical for your area" once n >= 5.
create view dir_area_price_benchmarks as
select j.area_slug, j.scope->>'material' as material, count(*) as n,
       round(percentile_cont(0.25) within group (order by v.price_cents::numeric / (j.scope->>'stalls')::integer)) as p25_per_stall_cents,
       round(percentile_cont(0.5) within group (order by v.price_cents::numeric / (j.scope->>'stalls')::integer)) as median_per_stall_cents,
       round(percentile_cont(0.75) within group (order by v.price_cents::numeric / (j.scope->>'stalls')::integer)) as p75_per_stall_cents
from dir_job_invites v join dir_jobs j on j.id = v.job_id
where v.price_cents is not null and not v.declined and coalesce((j.scope->>'stalls')::integer, 0) > 0
  and v.responded_at > now() - interval '365 days'
group by 1, 2;
revoke all on dir_area_price_benchmarks from anon, authenticated;

-- The area's typical price per stall, when there are enough prices to mean something (n >= 5).
create function dir_area_median_per_stall(p_area text, p_material text) returns numeric
language sql stable security definer set search_path = public as $$
  select median_per_stall_cents from dir_area_price_benchmarks where area_slug = p_area and material = p_material and n >= 5;
$$;

-- ---------- outbox ----------
-- Every event that should send an email or update the CRM. A worker claims rows, sends, marks them done.
create table dir_outbox (
  id bigserial primary key,
  kind text not null,              -- job_invite, invite_reminder, invite_answered, prices_ready, search_widened,
                                   -- no_prices, installer_chosen, job_released, job_status, review_request
  job_id uuid references dir_jobs (id) on delete cascade,
  installer_id uuid references dir_installers (id) on delete cascade,
  payload jsonb not null default '{}',
  deliver_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 0,
  last_error text
);
create index on dir_outbox (deliver_after) where sent_at is null;
alter table dir_outbox enable row level security;
create policy admin_read on dir_outbox for select using (dir_is_admin());

create function dir_enqueue(p_kind text, p_job uuid, p_installer uuid, p_payload jsonb default '{}', p_after timestamptz default now())
returns void language sql security definer set search_path = public as $$
  insert into dir_outbox (kind, job_id, installer_id, payload, deliver_after)
  values (p_kind, p_job, p_installer, coalesce(p_payload, '{}'), p_after);
$$;

-- For the email/CRM worker (service role): claim due rows, then mark each done or failed.
create function dir_outbox_claim(p_limit integer default 20) returns setof dir_outbox
language sql security definer set search_path = public as $$
  update dir_outbox o set attempts = o.attempts + 1
  where o.id in (select id from dir_outbox where sent_at is null and deliver_after <= now() and attempts < 5
                 order by id for update skip locked limit p_limit)
  returning o.*;
$$;

create function dir_outbox_done(p_id bigint, p_error text default null) returns void
language sql security definer set search_path = public as $$
  update dir_outbox set sent_at = case when p_error is null then now() end, last_error = p_error where id = p_id;
$$;

-- ---------- routing ----------
-- Invites up to p_max installers. Round 1: hard filters, then either the installer the customer picked
-- (only them, unless others_ok) or 2 quality slots + 1 rotation slot, with a 50% share ceiling.
-- Round 2 (widened, also when a picked installer declines or misses the deadline): up to 75 mi.
create function dir_route_job(p_job uuid, p_round smallint default 1, p_max integer default 3) returns integer
language plpgsql security definer set search_path = public as $$
declare
  j dir_jobs; picked uuid[] := '{}'; how text[] := '{}'; c record; due timestamptz; n integer; k integer;
begin
  if dir_called_by_app_user() and not dir_is_admin() then
    raise exception 'only Next Partitions can route jobs' using errcode = 'insufficient_privilege';
  end if;
  select * into j from dir_jobs where id = p_job for update;
  if j.lat is null then
    update dir_jobs set needs_attention = true, attention_reason = 'Job location missing' where id = p_job;
    return 0;
  end if;

  create temp table if not exists dir_route_candidates (id uuid, miles double precision, score numeric,
    recent integer, capped boolean, approved_at timestamptz, preferred boolean) on commit drop;
  truncate dir_route_candidates;
  insert into dir_route_candidates
  select i.id, dir_miles(i.lat, i.lng, j.lat, j.lng), dir_installer_score(i.id),
         (select count(*) from dir_job_invites v where v.installer_id = i.id and v.sent_at > now() - interval '30 days')::integer,
         coalesce((select count(*) filter (where v.installer_id = i.id)::numeric / nullif(count(*), 0) > 0.5 and count(*) >= 6
                   from dir_job_invites v join dir_jobs x on x.id = v.job_id
                   where x.area_slug = j.area_slug and v.sent_at > now() - interval '60 days'), false),
         i.approved_at, i.id = j.preferred_installer_id
  from dir_installers i
  where i.lat is not null
    and dir_installer_eligible(i.id)
    and (j.scope->>'material') = any (i.materials)
    and (j.scope->>'mounting') = any (i.mountings)
    and dir_miles(i.lat, i.lng, j.lat, j.lng) <= case when p_round >= 2 then greatest(i.service_radius_mi, 75) else i.service_radius_mi end
    and dir_open_jobs(i.id) < i.max_open_jobs
    and not (i.away_from is not null and j.delivery_window is not null
             and daterange(i.away_from, coalesce(i.away_to, i.away_from), '[]') && j.delivery_window)
    and (not j.requires_background_check or exists (select 1 from dir_installer_checks b where b.installer_id = i.id
         and b.check_type = 'background_check' and b.status = 'passed' and (b.expires_at is null or b.expires_at >= current_date)))
    and not exists (select 1 from dir_job_invites v where v.job_id = j.id and v.installer_id = i.id);

  if p_round = 1 then
    for c in select id from dir_route_candidates where preferred loop
      picked := picked || c.id; how := how || 'preferred'::text;
    end loop;
    if cardinality(picked) > 0 and not j.others_ok then p_max := cardinality(picked); end if;
    -- quality slots, keeping one slot for rotation
    k := p_max - cardinality(picked) - 1;
    for c in select id from dir_route_candidates where not capped and not (id = any (picked))
             order by score desc, miles limit greatest(k, 0) loop
      picked := picked || c.id; how := how || 'auto'::text;
    end loop;
  end if;
  -- rotation slot (round 1), then fill any remaining slots by score
  for c in select id from dir_route_candidates where not (id = any (picked))
           order by case when p_round = 1 then recent end asc nulls last, approved_at desc nulls first, score desc, miles
           limit greatest(p_max - cardinality(picked), 0) loop
    picked := picked || c.id; how := how || (case when p_round >= 2 then 'widened' else 'auto' end);
  end loop;

  due := dir_add_business_days(now(), case when p_round >= 2 then 1 else 2 end);
  n := coalesce(cardinality(picked), 0);
  for k in 1 .. n loop
    insert into dir_job_invites (job_id, installer_id, round, invited_by, due_at, estimate_cents)
    values (p_job, picked[k], p_round, how[k], due, dir_estimate_cents(picked[k], p_job));
  end loop;

  update dir_jobs set
    search_round = p_round,
    price_due_at = case when n > 0 then due else price_due_at end,
    status = case when status in ('new', 'routed') then 'quoting' else status end,
    needs_attention = (n = 0),
    attention_reason = case when n = 0 then case when p_round >= 2 then 'No installer within 75 mi' else 'No installer covers this job' end end
  where id = p_job;
  return n;
end $$;

-- The job coordinator invites an approved installer by hand (e.g. one they know is free).
create function dir_invite_installer(p_job uuid, p_installer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j dir_jobs;
begin
  if dir_called_by_app_user() and not dir_is_admin() then
    raise exception 'only Next Partitions can invite installers' using errcode = 'insufficient_privilege';
  end if;
  if not dir_installer_eligible(p_installer) then
    raise exception 'installer is not approved or their insurance or registration has expired';
  end if;
  select * into j from dir_jobs where id = p_job;
  insert into dir_job_invites (job_id, installer_id, round, invited_by, due_at, estimate_cents)
  values (p_job, p_installer, greatest(j.search_round, 1), 'manual',
          greatest(coalesce(j.price_due_at, now()), dir_add_business_days(now(), 1)), dir_estimate_cents(p_installer, p_job));
  update dir_jobs set status = case when status in ('new', 'routed') then 'quoting' else status end,
    search_round = greatest(search_round, 1), window_closed_at = null,
    price_due_at = greatest(coalesce(price_due_at, now()), dir_add_business_days(now(), 1))
  where id = p_job;
end $$;

-- Run every 15 minutes (pg_cron, see the end of this file). Closes price windows, widens the search
-- once when nobody priced, flags jobs for the job coordinator and sends 20-hour reminders.
create function dir_sweep_jobs() returns jsonb
language plpgsql security definer set search_path = public as $$
declare j record; priced integer; pending integer; flagged integer; n integer;
        closed integer := 0; widened integer := 0; reminders integer := 0;
begin
  if dir_called_by_app_user() and not dir_is_admin() then
    raise exception 'only Next Partitions can run the sweep' using errcode = 'insufficient_privilege';
  end if;

  with r as (
    update dir_job_invites v set reminded_at = now()
    from dir_jobs x
    where x.id = v.job_id and x.status = 'quoting' and x.window_closed_at is null
      and v.responded_at is null and v.reminded_at is null and v.sent_at <= now() - interval '20 hours'
    returning v.job_id, v.installer_id, v.due_at)
  select count(*) into reminders from (select dir_enqueue('invite_reminder', job_id, installer_id, jsonb_build_object('due_at', due_at)) from r) s;

  for j in select * from dir_jobs where status = 'quoting' and window_closed_at is null for update skip locked loop
    select count(*) filter (where price_cents is not null and not declined),
           count(*) filter (where responded_at is null),
           count(*) filter (where price_flag is not null)
      into priced, pending, flagged
      from dir_job_invites where job_id = j.id;
    continue when not (pending = 0 or (j.rush and priced >= 2) or now() >= coalesce(j.price_due_at, 'infinity'));

    if priced > 0 then
      update dir_jobs set window_closed_at = now(), needs_attention = flagged > 0,
        attention_reason = case when flagged > 0 then 'Price check: a price is well above the installer''s rates or the area''s typical price' end
      where id = j.id;
      perform dir_enqueue('prices_ready', j.id, null, jsonb_build_object('prices', priced, 'flagged', flagged));
      closed := closed + 1;
    elsif j.search_round < 2 then
      n := dir_route_job(j.id, 2::smallint);
      perform dir_enqueue('search_widened', j.id, null, jsonb_build_object('invited', n));
      if n = 0 then
        update dir_jobs set window_closed_at = now() where id = j.id;
        perform dir_enqueue('no_prices', j.id, null, jsonb_build_object('reason', 'No installer within 75 mi'));
      end if;
      widened := widened + 1;
    else
      update dir_jobs set window_closed_at = now(), needs_attention = true,
        attention_reason = 'No prices after the wider search: offer partitions only or the customer''s own installer'
      where id = j.id;
      perform dir_enqueue('no_prices', j.id, null, jsonb_build_object('reason', 'No prices after the wider search'));
      closed := closed + 1;
    end if;
  end loop;
  return jsonb_build_object('closed', closed, 'widened', widened, 'reminders', reminders);
end $$;

-- ---------- release rule: a purchase order counts as paid ----------
-- Schools and public buyers pay by PO, often after delivery. Releasing on PO acceptance lets the
-- installer schedule in time; reversing payment and PO hides the details again.
create or replace function dir_jobs_release() returns trigger
language plpgsql as $$
begin
  if new.chosen_installer_id is not null and (new.partitions_paid_at is not null or new.po_accepted_at is not null) then
    if new.released_at is null then
      new.released_at := now();
      if new.status in ('new', 'routed', 'quoting', 'presented', 'installer_chosen') then
        new.status := 'released';
      end if;
    end if;
  else
    new.released_at := null;
  end if;
  return new;
end $$;

-- Installers may change only install_date and status on jobs released to them (every other column,
-- including ones added later, is compared).
create or replace function dir_jobs_installer_guard() returns trigger
language plpgsql as $$
begin
  if dir_is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if (to_jsonb(new) - 'install_date' - 'status') is distinct from (to_jsonb(old) - 'install_date' - 'status') then
    raise exception 'installers may only update install_date and status';
  end if;
  if new.status not in ('scheduled', 'installed') or old.status not in ('released', 'scheduled', 'installed') then
    raise exception 'installers may move a released job to scheduled or installed only';
  end if;
  return new;
end $$;

-- ---------- invite answers ----------
-- Installers may set their price, decline (with a reason), notes, earliest install date and the
-- assumptions behind the price. Everything else is kept. Stamps the reply time, marks late replies
-- and flags prices more than 15% above their own rates or the area's typical price.
create or replace function dir_invites_answer() returns trigger
language plpgsql as $$
declare j dir_jobs; median numeric;
begin
  if not dir_is_admin() and current_user in ('authenticated', 'anon') then
    new.sent_at := old.sent_at; new.job_id := old.job_id; new.installer_id := old.installer_id;
    new.round := old.round; new.invited_by := old.invited_by; new.due_at := old.due_at;
    new.reminded_at := old.reminded_at; new.estimate_cents := old.estimate_cents;
    new.responded_at := old.responded_at; new.late := old.late; new.price_flag := old.price_flag;
    select * into j from dir_jobs where id = new.job_id;
    if j.chosen_installer_id is not null and (new.price_cents, new.declined) is distinct from (old.price_cents, old.declined) then
      raise exception 'the customer has already chosen an installer for this job';
    end if;
  end if;
  if new.responded_at is null and (new.price_cents is not null or new.declined) then
    new.responded_at := now();
    new.late := new.due_at is not null and now() > new.due_at;
  end if;
  if new.price_cents is distinct from old.price_cents then
    new.price_flag := null;
    if new.price_cents is not null then
      if new.estimate_cents is not null and new.price_cents > new.estimate_cents * 1.15 then
        new.price_flag := 'above_rates';
      else
        select * into j from dir_jobs where id = new.job_id;
        median := dir_area_median_per_stall(j.area_slug, j.scope->>'material');
        if median is not null and new.price_cents > median * coalesce((j.scope->>'stalls')::integer, 0) * 1.15 then
          new.price_flag := 'above_area';
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;

-- ---------- contact details hidden in messages before release ----------
create function dir_job_released_to(p_job uuid, p_installer uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from dir_jobs where id = p_job and chosen_installer_id = p_installer and released_at is not null);
$$;

create function dir_messages_redact() returns trigger
language plpgsql as $$
declare b text := new.body;
begin
  if not dir_job_released_to(new.job_id, new.installer_id) then
    b := regexp_replace(b, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[hidden until the job is released]', 'g');
    b := regexp_replace(b, '(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', '[hidden until the job is released]', 'g');
    new.redacted := b is distinct from new.body;
    new.body := b;
  end if;
  return new;
end $$;

create trigger dir_messages_redact before insert on dir_job_messages
for each row execute function dir_messages_redact();

-- ---------- outbox triggers ----------
create function dir_invites_outbox() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform dir_enqueue('job_invite', new.job_id, new.installer_id,
      jsonb_build_object('round', new.round, 'invited_by', new.invited_by, 'due_at', new.due_at, 'estimate_cents', new.estimate_cents));
  elsif old.responded_at is null and new.responded_at is not null then
    perform dir_enqueue('invite_answered', new.job_id, new.installer_id,
      jsonb_build_object('price_cents', new.price_cents, 'declined', new.declined, 'late', new.late, 'price_flag', new.price_flag));
  end if;
  return null;
end $$;

create trigger dir_invites_outbox after insert or update on dir_job_invites
for each row execute function dir_invites_outbox();

create function dir_jobs_outbox() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.chosen_installer_id is not null and new.chosen_installer_id is distinct from old.chosen_installer_id then
    perform dir_enqueue('installer_chosen', new.id, new.chosen_installer_id);
  end if;
  if old.released_at is null and new.released_at is not null then
    perform dir_enqueue('job_released', new.id, new.chosen_installer_id,
      jsonb_build_object('by', case when new.partitions_paid_at is not null then 'payment' else 'purchase_order' end));
  end if;
  if new.status is distinct from old.status then
    perform dir_enqueue('job_status', new.id, new.chosen_installer_id, jsonb_build_object('from', old.status, 'to', new.status));
    if new.status = 'installed' then
      perform dir_enqueue('review_request', new.id, new.chosen_installer_id, '{}', now() + interval '1 day');
    end if;
  end if;
  return null;
end $$;

create trigger dir_jobs_outbox after update on dir_jobs
for each row execute function dir_jobs_outbox();

-- ---------- who may call what ----------
-- Postgres lets everyone execute new functions by default; lock the internal ones down.
revoke execute on function dir_enqueue(text, uuid, uuid, jsonb, timestamptz), dir_outbox_claim(integer),
  dir_outbox_done(bigint, text), dir_estimate_cents(uuid, uuid), dir_installer_score(uuid), dir_open_jobs(uuid),
  dir_installer_eligible(uuid)
  from public, anon, authenticated;
grant execute on function dir_outbox_claim(integer), dir_outbox_done(bigint, text) to service_role;
-- Route, invite and sweep check for an admin inside; anon has no business calling them.
revoke execute on function dir_route_job(uuid, smallint, integer), dir_invite_installer(uuid, uuid), dir_sweep_jobs()
  from public, anon;
grant execute on function dir_route_job(uuid, smallint, integer), dir_invite_installer(uuid, uuid), dir_sweep_jobs()
  to authenticated, service_role;
revoke all on dir_outbox from anon, authenticated;
grant select on dir_outbox to authenticated; -- still limited to admins by row level security

-- ---------- schedule ----------
-- On Supabase, enable pg_cron and run the sweep every 15 minutes.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('dir-sweep-jobs', '*/15 * * * *', 'select dir_sweep_jobs()');
  end if;
end $$;
