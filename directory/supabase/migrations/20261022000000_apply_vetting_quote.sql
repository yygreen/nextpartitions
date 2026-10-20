-- Installer applications, vetting (references, test job, approval rule), the public listing gate,
-- and the customer's quote page. Runs after 20261021000100_zip_centroids_data.sql.

-- ---------- application details ----------
-- Private: none of these columns are in the public views.
alter table dir_installers
  add column contact_name text,
  add column contact_email text,
  add column contact_phone text,
  add column years_in_business integer check (years_in_business between 0 and 150),
  add column crew_size text check (crew_size in ('1-2', '3-5', '6-10', '10+')),
  add column extras text[] not null default '{}',          -- remove_old, ada, urinal_screens
  add column brands text,
  add column registration_number text,
  add column agreement_name text,                          -- typed name: agrees to sign if approved
  add column agreement_accepted_at timestamptz,
  add column applied_at timestamptz,
  add column decision_note text;                           -- set by Next Partitions: why rejected, or what info was asked for

create index on dir_installers (lower(contact_email), applied_at);

-- References the applicant gives us, and what they said when we called.
create table dir_installer_references (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid not null references dir_installers (id) on delete cascade,
  name text not null,
  company text,
  phone text,
  email text,
  job_note text,                            -- what the applicant installed for them
  called_at timestamptz,
  outcome text check (outcome in ('good', 'mixed', 'bad', 'no_answer')),
  note text,
  created_at timestamptz not null default now()
);
create index on dir_installer_references (installer_id);
alter table dir_installer_references enable row level security;
create policy admin_all on dir_installer_references for all using (dir_is_admin()) with check (dir_is_admin());

-- ---------- test jobs ----------
-- A test job request we send an applicant to time their reply and firm price. It is never routed to
-- anyone else, never quoted to a customer and never counted in area prices.
alter table dir_jobs add column is_test boolean not null default false;

create or replace view dir_area_price_benchmarks as
select j.area_slug, j.scope->>'material' as material, count(*) as n,
       round(percentile_cont(0.25) within group (order by v.price_cents::numeric / (j.scope->>'stalls')::integer)) as p25_per_stall_cents,
       round(percentile_cont(0.5) within group (order by v.price_cents::numeric / (j.scope->>'stalls')::integer)) as median_per_stall_cents,
       round(percentile_cont(0.75) within group (order by v.price_cents::numeric / (j.scope->>'stalls')::integer)) as p75_per_stall_cents
from dir_job_invites v join dir_jobs j on j.id = v.job_id
where v.price_cents is not null and not v.declined and coalesce((j.scope->>'stalls')::integer, 0) > 0
  and v.responded_at > now() - interval '365 days' and not j.is_test
group by 1, 2;
revoke all on dir_area_price_benchmarks from anon, authenticated;

-- Status 'routed' (not 'quoting') keeps the 15-minute sweep away from it: no reminders, no wider search.
create function dir_send_test_job(p_installer uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare i dir_installers; j uuid; due timestamptz := dir_add_business_days(now(), 2);
begin
  if dir_called_by_app_user() and not dir_is_admin() then
    raise exception 'only Next Partitions can send test jobs' using errcode = 'insufficient_privilege';
  end if;
  select * into i from dir_installers where id = p_installer;
  if i.id is null or i.status not in ('applied', 'vetting', 'approved') then
    raise exception 'Test jobs go to applicants and approved installers only';
  end if;
  insert into dir_jobs (area_slug, city, zip, scope, delivery_window, status, is_test, search_round, price_due_at)
  values (
    coalesce((select area_slug from dir_service_areas where installer_id = i.id order by area_slug limit 1), 'dallas'),
    i.base_city, i.base_zip,
    jsonb_build_object('material', coalesce(i.materials[1], 'hdpe'), 'mounting', coalesce(i.mountings[1], 'overhead_braced'),
      'stalls', 4, 'ada', true, 'building', 'Office',
      'notes', 'Test job request from Next Partitions: price it as you would a real job. We time your reply and your firm price.'),
    daterange(current_date + 14, current_date + 19), 'routed', true, 1, due)
  returning id into j;
  insert into dir_job_invites (job_id, installer_id, round, invited_by, due_at, estimate_cents)
  values (j, i.id, 1, 'manual', due, dir_estimate_cents(i.id, j));
  return j;
end $$;

-- ---------- approval rule ----------
-- Approved means the installer gets job requests. It needs these passed checks; the job coordinator
-- can't skip them from the portal. approved_at is stamped on the first approval.
create function dir_installers_approval() returns trigger
language plpgsql as $$
declare missing text[] := '{}';
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    if dir_called_by_app_user() then
      if not exists (select 1 from dir_installer_checks where installer_id = new.id and check_type = 'insurance' and status = 'passed') then
        missing := missing || 'insurance'::text; end if;
      if not exists (select 1 from dir_installer_checks where installer_id = new.id
                     and check_type in ('business_registration', 'city_registration') and status = 'passed') then
        missing := missing || 'business or city registration'::text; end if;
      if not exists (select 1 from dir_installer_checks where installer_id = new.id and check_type = 'references' and status = 'passed') then
        missing := missing || 'references'::text; end if;
      if not exists (select 1 from dir_installer_checks where installer_id = new.id and check_type = 'response_test' and status = 'passed') then
        missing := missing || 'response test'::text; end if;
      if not exists (select 1 from dir_installer_checks where installer_id = new.id and check_type = 'listing_agreement' and status = 'passed') then
        missing := missing || 'listing agreement'::text; end if;
      if cardinality(missing) > 0 then
        raise exception 'Before approving, these checks must pass: %', array_to_string(missing, ', ');
      end if;
    end if;
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end $$;

-- Named to run after dir_installers_a_location and dir_installers_guard (before-triggers run in name order),
-- so an installer trying to approve themselves gets the guard's refusal.
create trigger dir_installers_z_approval before update on dir_installers
for each row execute function dir_installers_approval();

-- The vetting screen's decisions: ask for more information, reject (the listing is closed: 'delisted'),
-- or tell the installer they're approved. Each one queues an email to the applicant.
create function dir_vetting_notice(p_installer uuid, p_kind text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare i dir_installers; note_ text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if dir_called_by_app_user() and not dir_is_admin() then
    raise exception 'only Next Partitions can send vetting decisions' using errcode = 'insufficient_privilege';
  end if;
  if p_kind not in ('info_request', 'rejected', 'approved') then raise exception 'Unknown decision'; end if;
  select * into i from dir_installers where id = p_installer;
  if i.id is null then raise exception 'Installer not found'; end if;
  if p_kind in ('info_request', 'rejected') then
    update dir_installers set decision_note = note_,
      status = case when p_kind = 'rejected' then 'delisted'::dir_installer_status else status end
    where id = p_installer;
  end if;
  perform dir_enqueue('application_' || p_kind, null, p_installer, jsonb_build_object('note', note_, 'email', i.contact_email));
end $$;

-- ---------- public listing after the first completed job ----------
-- Approved installers get job requests at once; their public profile appears once they've completed a
-- job for a Next Partitions customer (the 'completed_job' check, passed automatically on sign-off).
create or replace view dir_public_installers with (security_invoker = false) as
select
  i.slug, i.display_name, i.base_city, i.base_state, i.lat, i.lng, i.service_radius_mi,
  i.materials, i.mountings, i.about, i.photo_url, i.tracked_phone, i.approved_at,
  coalesce(array_agg(distinct a.area_slug) filter (where a.area_slug is not null), '{}') as areas,
  (select count(*) from dir_jobs j where j.chosen_installer_id = i.id and j.status = 'signed_off') as installs,
  (select round(avg(r.rating)::numeric, 1) from dir_reviews r where r.installer_id = i.id and r.published_at is not null) as rating,
  (select count(*) from dir_reviews r where r.installer_id = i.id and r.published_at is not null) as review_count,
  (select round((extract(epoch from percentile_cont(0.5) within group (order by v.responded_at - v.sent_at)) / 3600)::numeric, 1)
     from dir_job_invites v where v.installer_id = i.id and v.responded_at is not null) as median_reply_hours,
  (select jsonb_agg(jsonb_build_object('label', c.public_label, 'verified', c.verified_at) order by c.check_type)
     from dir_installer_checks c where c.installer_id = i.id and c.status = 'passed' and c.public_label is not null) as checks
from dir_installers i
left join dir_service_areas a on a.installer_id = i.id
where i.status = 'approved'
  and exists (select 1 from dir_installer_checks c where c.installer_id = i.id and c.check_type = 'completed_job' and c.status = 'passed')
group by i.id;

create or replace view dir_public_rate_cards with (security_invoker = false) as
select i.slug, r.material, r.mounting, r.per_stall_low_cents, r.per_stall_high_cents, r.minimum_cents, r.extras
from dir_rate_cards r join dir_installers i on i.id = r.installer_id
where i.status = 'approved'
  and exists (select 1 from dir_installer_checks c where c.installer_id = i.id and c.check_type = 'completed_job' and c.status = 'passed');

create or replace view dir_public_reviews with (security_invoker = false) as
select i.slug, r.rating, r.body, r.reviewer_display, r.published_at
from dir_reviews r join dir_installers i on i.id = r.installer_id
where r.published_at is not null and i.status = 'approved'
  and exists (select 1 from dir_installer_checks c where c.installer_id = i.id and c.check_type = 'completed_job' and c.status = 'passed');

grant select on dir_public_installers, dir_public_rate_cards, dir_public_reviews to anon, authenticated;

create function dir_jobs_completed_check() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'signed_off' and old.status is distinct from 'signed_off' and not new.is_test
     and new.chosen_installer_id is not null then
    insert into dir_installer_checks (installer_id, check_type, status, verified_at, public_label)
    values (new.chosen_installer_id, 'completed_job', 'passed', current_date, 'Completed a job for a Next Partitions customer')
    on conflict (installer_id, check_type) do update
      set status = 'passed', verified_at = current_date, public_label = excluded.public_label
      where dir_installer_checks.status <> 'passed';
  end if;
  return null;
end $$;

create trigger dir_jobs_completed_check after update on dir_jobs
for each row execute function dir_jobs_completed_check();

-- ---------- the customer's quote ----------
-- One per real job. The token is the customer's secret link (/quote/<token>); installers can't read this
-- table, so they never see the token or the partitions prices.
create table dir_job_quotes (
  job_id uuid primary key references dir_jobs (id) on delete cascade,
  token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  quote_ref text,
  partitions_cents integer check (partitions_cents >= 0),
  freight_cents integer check (freight_cents >= 0),
  tax_note text,                            -- e.g. 'Tax-exempt (school): send your certificate'
  valid_until date,
  drawings_approved_at timestamptz,
  change_request text,
  customer_choice text check (customer_choice in ('wait', 'partitions_only', 'own_installer')),
  payment_method text check (payment_method in ('po', 'card', 'ach')),
  po_number text,
  updated_at timestamptz not null default now()
);
alter table dir_job_quotes enable row level security;
create policy admin_all on dir_job_quotes for all using (dir_is_admin()) with check (dir_is_admin());

create function dir_jobs_quote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not new.is_test then
    insert into dir_job_quotes (job_id, quote_ref) values (new.id, new.quote_request_ref) on conflict do nothing;
  end if;
  return null;
end $$;

create trigger dir_jobs_quote after insert on dir_jobs
for each row execute function dir_jobs_quote();

insert into dir_job_quotes (job_id, quote_ref)
select id, quote_request_ref from dir_jobs where not is_test
on conflict do nothing;

-- The job behind a quote link, or an error. Test jobs have no quote, so their links don't exist.
create function dir_quote_job_id(p_token text) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare j uuid;
begin
  select q.job_id into j from dir_job_quotes q join dir_jobs x on x.id = q.job_id
  where q.token = p_token and not x.is_test;
  if j is null then raise exception 'Quote not found'; end if;
  return j;
end $$;

-- Prices the customer may see: firm, not declined, and not waiting on a price check.
create function dir_quote_price_visible(v dir_job_invites) returns boolean
language sql immutable as $$
  select v.price_cents is not null and not v.declined and v.price_flag is null;
$$;

create function dir_customer_quote(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare q dir_job_quotes; j dir_jobs; c dir_job_contacts; prices jsonb := '[]';
begin
  select * into q from dir_job_quotes where token = p_token;
  if q.job_id is null then return null; end if;
  select * into j from dir_jobs where id = q.job_id;
  if j.is_test then return null; end if;
  select * into c from dir_job_contacts where job_id = j.id;
  if j.status in ('presented', 'installer_chosen', 'released', 'scheduled', 'installed', 'signed_off') then
    select coalesce(jsonb_agg(jsonb_build_object(
             'installer_id', i.id, 'slug', i.slug, 'display_name', i.display_name, 'base_city', i.base_city,
             'listed', p.slug is not null, 'rating', p.rating, 'review_count', coalesce(p.review_count, 0),
             'installs', coalesce(p.installs, 0), 'price_cents', v.price_cents,
             'earliest_install_date', v.earliest_install_date, 'assumptions', v.assumptions)
             order by v.price_cents), '[]')
      into prices
      from dir_job_invites v join dir_installers i on i.id = v.installer_id
      left join dir_public_installers p on p.slug = i.slug
      where v.job_id = j.id and dir_quote_price_visible(v);
  end if;
  return jsonb_build_object(
    'ref', j.ref, 'quote_ref', q.quote_ref, 'city', j.city, 'zip', j.zip, 'scope', j.scope,
    'delivery_from', lower(j.delivery_window)::text, 'delivery_to', (upper(j.delivery_window) - 1)::text,
    'status', j.status, 'has_drawings', j.drawings_path is not null, 'drawings_approved_at', q.drawings_approved_at,
    'partitions_cents', q.partitions_cents, 'freight_cents', q.freight_cents, 'tax_note', q.tax_note, 'valid_until', q.valid_until,
    'customer_name', c.customer_name, 'company', c.company, 'email', c.email,
    'change_request', q.change_request, 'customer_choice', q.customer_choice,
    'payment_method', q.payment_method, 'po_number', q.po_number,
    'paid', j.partitions_paid_at is not null or j.po_accepted_at is not null,
    'released_at', j.released_at, 'install_date', j.install_date,
    'window_closed', j.window_closed_at is not null, 'search_round', j.search_round,
    'chosen_installer_id', j.chosen_installer_id, 'prices', prices);
end $$;

create function dir_customer_approve_drawings(p_token text) returns void
language plpgsql security definer set search_path = public as $$
declare j dir_jobs;
begin
  select * into j from dir_jobs where id = dir_quote_job_id(p_token);
  if j.drawings_path is null then raise exception 'Your shop drawings aren''t ready yet'; end if;
  update dir_job_quotes set drawings_approved_at = coalesce(drawings_approved_at, now()), updated_at = now()
  where job_id = j.id;
end $$;

create function dir_customer_request_change(p_token text, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare j dir_jobs; t text := btrim(coalesce(p_text, ''));
begin
  select * into j from dir_jobs where id = dir_quote_job_id(p_token);
  if length(t) < 1 or length(t) > 2000 then raise exception 'Describe the change in up to 2,000 characters'; end if;
  if j.partitions_paid_at is not null or j.po_accepted_at is not null then
    raise exception 'Your partitions are ordered. Call 1-833-997-7489 to change the drawings.';
  end if;
  update dir_job_quotes set change_request = t, drawings_approved_at = null, updated_at = now() where job_id = j.id;
  update dir_jobs set needs_attention = true, attention_reason = 'Customer asked for a drawing change' where id = j.id;
  perform dir_enqueue('customer_change_request', j.id, null, jsonb_build_object('text', t));
end $$;

create function dir_customer_choose(p_token text, p_installer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j dir_jobs; q dir_job_quotes;
begin
  select * into j from dir_jobs where id = dir_quote_job_id(p_token) for update;
  select * into q from dir_job_quotes where job_id = j.id;
  if q.drawings_approved_at is null then raise exception 'Approve your shop drawings first'; end if;
  if j.chosen_installer_id is not null then raise exception 'You''ve already chosen an installer. Call 1-833-997-7489 to change.'; end if;
  if j.status <> 'presented' then raise exception 'Installer prices aren''t ready yet'; end if;
  if not exists (select 1 from dir_job_invites v where v.job_id = j.id and v.installer_id = p_installer and dir_quote_price_visible(v)) then
    raise exception 'That installer has no price on this quote';
  end if;
  update dir_jobs set chosen_installer_id = p_installer, status = 'installer_chosen' where id = j.id;
  update dir_job_quotes set customer_choice = null, updated_at = now() where job_id = j.id;
end $$;

create function dir_customer_fallback(p_token text, p_choice text) returns void
language plpgsql security definer set search_path = public as $$
declare j dir_jobs;
begin
  select * into j from dir_jobs where id = dir_quote_job_id(p_token);
  if p_choice not in ('wait', 'partitions_only', 'own_installer') then raise exception 'Unknown choice'; end if;
  if j.chosen_installer_id is not null then raise exception 'You''ve already chosen an installer. Call 1-833-997-7489 to change.'; end if;
  update dir_job_quotes set customer_choice = p_choice, updated_at = now() where job_id = j.id;
  update dir_jobs set needs_attention = true, attention_reason = case p_choice
    when 'wait' then 'Customer chose: wait for installer prices'
    when 'partitions_only' then 'Customer chose: partitions only, install later'
    else 'Customer chose: their own installer (send the install packet)' end
  where id = j.id;
  perform dir_enqueue('customer_choice', j.id, null, jsonb_build_object('choice', p_choice));
end $$;

create function dir_customer_payment(p_token text, p_method text, p_po_number text default null) returns void
language plpgsql security definer set search_path = public as $$
declare j dir_jobs; po text := nullif(btrim(coalesce(p_po_number, '')), '');
begin
  select * into j from dir_jobs where id = dir_quote_job_id(p_token);
  if p_method not in ('po', 'card', 'ach') then raise exception 'Choose purchase order, card or bank transfer'; end if;
  if j.partitions_paid_at is not null or j.po_accepted_at is not null then raise exception 'Your partitions order is already paid'; end if;
  if p_method = 'po' and (po is null or length(po) > 60) then raise exception 'Enter your purchase order number'; end if;
  update dir_job_quotes set payment_method = p_method, po_number = case when p_method = 'po' then po end, updated_at = now()
  where job_id = j.id;
  update dir_jobs set needs_attention = true, attention_reason = case p_method
    when 'po' then 'Customer will pay by purchase order ' || po || ': accept the PO'
    when 'card' then 'Customer will pay by card: send a payment link'
    else 'Customer will pay by bank transfer: send bank details and a pro forma invoice' end
  where id = j.id;
  perform dir_enqueue('customer_payment', j.id, null, jsonb_build_object('method', p_method, 'po_number', po));
end $$;

-- ---------- installer applications ----------
-- The public application form calls this with the publishable key. It creates an 'applied' installer
-- with pending checks, their rate card and references, and queues an email. Documents follow through
-- dir_application_document within two hours.
create function dir_submit_application(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  id_ uuid; name_ text := btrim(coalesce(p->>'business_name', '')); email_ text := lower(btrim(coalesce(p->>'email', '')));
  zip_ text := btrim(coalesce(p->>'base_zip', '')); mats text[]; mnts text[]; exs text[]; refs jsonb; r jsonb; m text; n text;
  rates jsonb := coalesce(p->'rates', '{}'); slug_ text; base_ text; k integer := 1; extras_ jsonb; cents integer;
  int_ text := '^\d{1,7}$';
begin
  if coalesce(p->>'website', '') <> '' then return gen_random_uuid(); end if; -- honeypot: bots fill every field

  if name_ = '' then raise exception 'Enter your business name'; end if;
  if btrim(coalesce(p->>'contact_name', '')) = '' then raise exception 'Enter a contact name'; end if;
  if btrim(coalesce(p->>'phone', '')) = '' then raise exception 'Enter a phone number'; end if;
  if email_ !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address'; end if;
  if btrim(coalesce(p->>'base_city', '')) = '' then raise exception 'Enter your base city'; end if;
  if zip_ !~ '^\d{5}$' then raise exception 'Enter a 5-digit ZIP code'; end if;

  select coalesce(array_agg(x), '{}') into mats from jsonb_array_elements_text(coalesce(p->'materials', '[]')) x
    where x in ('powder_coated', 'hdpe', 'phenolic', 'laminate', 'stainless');
  select coalesce(array_agg(x), '{}') into mnts from jsonb_array_elements_text(coalesce(p->'mountings', '[]')) x
    where x in ('overhead_braced', 'floor_mounted', 'ceiling_hung', 'floor_to_ceiling');
  select coalesce(array_agg(x), '{}') into exs from jsonb_array_elements_text(coalesce(p->'extras', '[]')) x
    where x in ('remove_old', 'ada', 'urinal_screens');
  if cardinality(mats) = 0 then raise exception 'Choose at least one material you install'; end if;
  if cardinality(mnts) = 0 then raise exception 'Choose at least one bracing type you install'; end if;
  foreach m in array mats loop
    if coalesce(rates->'per_stall'->>m, '') !~ int_ or (rates->'per_stall'->>m)::integer <= 0 then
      raise exception 'Enter your per-stall rate for every material you install';
    end if;
  end loop;

  refs := coalesce(p->'references', '[]');
  if jsonb_typeof(refs) <> 'array' or jsonb_array_length(refs) < 2 or jsonb_array_length(refs) > 3 then
    raise exception 'Give 2 or 3 references';
  end if;
  for r in select * from jsonb_array_elements(refs) loop
    if btrim(coalesce(r->>'name', '')) = '' or (btrim(coalesce(r->>'phone', '')) = '' and btrim(coalesce(r->>'email', '')) = '') then
      raise exception 'Give each reference a name and a phone number or email';
    end if;
  end loop;
  if btrim(coalesce(p->>'agreement_name', '')) = '' then raise exception 'Type your full name to sign'; end if;

  if (select count(*) from dir_installers where lower(contact_email) = email_ and applied_at > now() - interval '24 hours') >= 3
     or (select count(*) from dir_installers where applied_at > now() - interval '24 hours') >= 100 then
    raise exception 'Too many applications right now. Please call 1-833-997-7489.';
  end if;

  base_ := btrim(regexp_replace(lower(name_), '[^a-z0-9]+', '-', 'g'), '-');
  if base_ = '' then base_ := 'installer'; end if;
  base_ := left(base_, 50);
  slug_ := base_;
  while exists (select 1 from dir_installers where slug = slug_) loop
    k := k + 1; slug_ := base_ || '-' || k;
  end loop;

  insert into dir_installers (slug, display_name, legal_name, base_city, base_state, base_zip, service_radius_mi,
    materials, mountings, extras, status, contact_name, contact_email, contact_phone, years_in_business, crew_size,
    brands, registration_number, agreement_name, agreement_accepted_at, applied_at)
  values (slug_, name_, name_, btrim(p->>'base_city'), upper(left(coalesce(nullif(btrim(p->>'base_state'), ''), 'TX'), 2)), zip_,
    least(greatest(case when coalesce(p->>'service_radius_mi', '') ~ int_ then (p->>'service_radius_mi')::integer else 40 end, 5), 300),
    mats, mnts, exs, 'applied', btrim(p->>'contact_name'), email_, btrim(p->>'phone'),
    case when coalesce(p->>'years_in_business', '') ~ '^\d{1,3}$' then least((p->>'years_in_business')::integer, 150) end,
    case when p->>'crew_size' in ('1-2', '3-5', '6-10', '10+') then p->>'crew_size' end,
    nullif(btrim(coalesce(p->>'brands', '')), ''), nullif(btrim(coalesce(p->>'registration_number', '')), ''),
    btrim(p->>'agreement_name'), now(), now())
  returning id into id_;

  insert into dir_installer_checks (installer_id, check_type, status, internal_note) values
    (id_, 'insurance', 'pending', null),
    (id_, 'business_registration', 'pending',
      case when nullif(btrim(coalesce(p->>'registration_number', '')), '') is not null then 'Registration number: ' || btrim(p->>'registration_number') end),
    (id_, 'references', 'pending', null),
    (id_, 'response_test', 'pending', null),
    (id_, 'listing_agreement', 'pending', 'Agreed to sign if approved: ' || btrim(p->>'agreement_name') || ', ' || to_char(now(), 'YYYY-MM-DD HH24:MI TZ'));

  extras_ := '{}';
  foreach n in array array['ada_stall_cents', 'urinal_screen_cents', 'demo_per_stall_cents', 'free_miles', 'per_mile_cents'] loop
    if coalesce(rates->>n, '') ~ int_ then extras_ := extras_ || jsonb_build_object(n, (rates->>n)::integer); end if;
  end loop;
  foreach m in array mats loop
    foreach n in array mnts loop
      cents := (rates->'per_stall'->>m)::integer
        + case when n in ('ceiling_hung', 'floor_to_ceiling') and coalesce(rates->>'high_mount_extra_cents', '') ~ int_
               then (rates->>'high_mount_extra_cents')::integer else 0 end;
      insert into dir_rate_cards (installer_id, material, mounting, per_stall_low_cents, per_stall_high_cents, minimum_cents, extras)
      values (id_, m, n, cents, cents,
        case when coalesce(rates->>'minimum_cents', '') ~ int_ then (rates->>'minimum_cents')::integer else 0 end, extras_);
    end loop;
  end loop;

  insert into dir_installer_references (installer_id, name, company, phone, email, job_note)
  select id_, btrim(x->>'name'), nullif(btrim(coalesce(x->>'company', '')), ''), nullif(btrim(coalesce(x->>'phone', '')), ''),
         nullif(btrim(coalesce(x->>'email', '')), ''), nullif(btrim(coalesce(x->>'job_note', '')), '')
  from jsonb_array_elements(refs) x;

  perform dir_enqueue('application_received', null, id_, jsonb_build_object('email', email_));
  return id_;
end $$;

-- True for an applicant who applied in the last two hours: their documents may still be uploaded
-- without a login.
create function dir_application_open(p_installer uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from dir_installers where id = p_installer and status = 'applied' and applied_at > now() - interval '2 hours');
$$;

create function dir_application_document(p_installer uuid, p_check dir_check_type, p_path text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not dir_application_open(p_installer) then
    raise exception 'This application can no longer take documents. Email them to sales@nextpartitions.com.';
  end if;
  if p_check not in ('insurance', 'business_registration', 'city_registration') then raise exception 'Unknown document type'; end if;
  if p_path is null or left(p_path, 37) <> p_installer::text || '/' or length(p_path) < 38 then raise exception 'Invalid file path'; end if;
  if (select count(*) from dir_document_uploads where installer_id = p_installer) >= 5 then
    raise exception 'Up to 5 documents with an application';
  end if;
  insert into dir_document_uploads (installer_id, check_type, path) values (p_installer, p_check, p_path);
end $$;

-- Applicants upload into their own new folder, without a login, for two hours after applying.
create policy dir_documents_application_add on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'dir-documents' and dir_application_open(dir_object_owner_id(name)));

-- ---------- who may call what ----------
revoke execute on function dir_send_test_job(uuid) from public, anon;
grant execute on function dir_send_test_job(uuid) to authenticated, service_role;
revoke execute on function dir_quote_job_id(text) from public, anon, authenticated;
revoke execute on function dir_vetting_notice(uuid, text, text) from public, anon;
grant execute on function dir_vetting_notice(uuid, text, text) to authenticated, service_role;
grant execute on function dir_submit_application(jsonb), dir_application_document(uuid, dir_check_type, text), dir_application_open(uuid),
  dir_customer_quote(text), dir_customer_approve_drawings(text), dir_customer_request_change(text, text),
  dir_customer_choose(text, uuid), dir_customer_fallback(text, text), dir_customer_payment(text, text, text)
  to anon, authenticated;
