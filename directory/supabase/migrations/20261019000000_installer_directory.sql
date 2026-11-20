-- Installer directory for nextpartitions.com (Supabase / Postgres).
-- Self-contained: every object is prefixed dir_ so it can't collide with the existing schema.
-- Privacy rule enforced in the database, not the UI: an installer can read a customer's
-- contact details only once that customer has chosen them AND paid for the partitions order.

-- ---------- types ----------
create type dir_installer_status as enum ('applied', 'vetting', 'approved', 'suspended', 'delisted');
create type dir_check_type as enum (
  'insurance', 'business_registration', 'city_registration', 'references',
  'listing_agreement', 'completed_job', 'response_test', 'background_check', 'state_license'
);
create type dir_check_status as enum ('pending', 'passed', 'failed', 'expired');
create type dir_job_status as enum (
  'new', 'routed', 'quoting', 'presented', 'installer_chosen',
  'released', 'scheduled', 'installed', 'signed_off', 'cancelled'
);
create type dir_message_sender as enum ('installer', 'next_partitions');

-- ---------- people ----------
-- Staff who run the directory. Map this to the site's existing admin role if there is one.
create table dir_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table dir_installers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null,
  legal_name text not null,
  user_id uuid unique references auth.users (id) on delete set null, -- portal login
  base_city text not null,
  base_state char(2) not null,
  base_zip char(5) not null,
  lat double precision,
  lng double precision,
  service_radius_mi integer not null default 40 check (service_radius_mi between 5 and 300),
  materials text[] not null default '{}',   -- powder_coated, hdpe, phenolic, laminate, stainless
  mountings text[] not null default '{}',   -- overhead_braced, floor_mounted, ceiling_hung, floor_to_ceiling
  about text,
  photo_url text,
  tracked_phone text,                       -- call-tracking number shown on the profile
  status dir_installer_status not null default 'applied',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- What we checked, with dates. Profiles show these as facts ("Insurance on file, confirmed 2026-10").
create table dir_installer_checks (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid not null references dir_installers (id) on delete cascade,
  check_type dir_check_type not null,
  status dir_check_status not null default 'pending',
  verified_at date,
  expires_at date,
  public_label text,                        -- e.g. 'City of Dallas contractor registration'
  internal_note text,
  document_path text,                       -- storage path of the certificate, never public
  unique (installer_id, check_type)
);

-- Area pages an installer appears on (slugs follow /service-area/[slug]/).
create table dir_service_areas (
  installer_id uuid not null references dir_installers (id) on delete cascade,
  area_slug text not null,
  primary key (installer_id, area_slug)
);

-- Pre-agreed prices that power instant estimates.
create table dir_rate_cards (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid not null references dir_installers (id) on delete cascade,
  material text not null,
  mounting text not null,
  per_stall_low_cents integer not null check (per_stall_low_cents > 0),
  per_stall_high_cents integer not null check (per_stall_high_cents >= per_stall_low_cents),
  minimum_cents integer not null default 0,
  extras jsonb not null default '{}',       -- e.g. {"demo_per_stall_cents": 4000, "ada_stall_cents": 6000}
  updated_at timestamptz not null default now(),
  unique (installer_id, material, mounting)
);

-- ---------- jobs ----------
-- The blind job packet: everything an installer needs to price, nothing that identifies the customer.
create table dir_jobs (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('J-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 4)),
  quote_request_ref text,                   -- link to the site's existing quote request
  area_slug text not null,
  city text not null,
  zip char(5) not null,
  scope jsonb not null,                     -- material, mounting, stalls, layout, ada, demo, notes
  drawings_path text,
  delivery_window daterange,
  status dir_job_status not null default 'new',
  chosen_installer_id uuid references dir_installers (id),
  partitions_paid_at timestamptz,
  released_at timestamptz,                  -- set by trigger only
  install_date date,
  created_at timestamptz not null default now(),
  check (install_date is null or delivery_window is null or install_date >= lower(delivery_window))
);

-- Customer details live apart from the job so access rules can differ.
create table dir_job_contacts (
  job_id uuid primary key references dir_jobs (id) on delete cascade,
  customer_name text not null,
  company text,
  email text not null,
  phone text,
  site_address text,
  site_contact text
);

-- Installers invited to price a job, and their answers. Feeds response-time stats.
create table dir_job_invites (
  job_id uuid not null references dir_jobs (id) on delete cascade,
  installer_id uuid not null references dir_installers (id) on delete cascade,
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  declined boolean not null default false,
  price_cents integer check (price_cents > 0),
  installer_notes text,
  primary key (job_id, installer_id)
);

-- Questions run through us before release. The customer only ever appears as the job ref.
create table dir_job_messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references dir_jobs (id) on delete cascade,
  installer_id uuid not null references dir_installers (id) on delete cascade,
  sender dir_message_sender not null,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table dir_job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references dir_jobs (id) on delete cascade,
  status dir_job_status not null,
  note text,
  photo_paths text[] not null default '{}',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Only customers with a signed-off job can review. Published unedited.
create table dir_reviews (
  job_id uuid primary key references dir_jobs (id) on delete cascade,
  installer_id uuid not null references dir_installers (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  reviewer_display text not null,           -- e.g. 'Facilities manager, Plano'
  published_at timestamptz
);

create index on dir_job_invites (installer_id);
create index on dir_jobs (chosen_installer_id);
create index on dir_jobs (status);
create index on dir_job_messages (job_id, installer_id);
create index on dir_reviews (installer_id) where published_at is not null;

-- ---------- helpers ----------
-- Guards below apply to logged-in requests (roles anon/authenticated). Server-side code using the
-- service role, and migrations run as the owner, are not restricted by them.
create function dir_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from dir_admins where user_id = auth.uid());
$$;

create function dir_my_installer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from dir_installers where user_id = auth.uid();
$$;

create function dir_can_see_job(j uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dir_job_invites i
    where i.job_id = j and i.installer_id = dir_my_installer_id()
  );
$$;

-- ---------- release rule ----------
-- released_at can only be set here: chosen installer + paid partitions order.
create function dir_jobs_release() returns trigger
language plpgsql as $$
begin
  if new.chosen_installer_id is not null and new.partitions_paid_at is not null then
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

create trigger dir_jobs_release before insert or update on dir_jobs
for each row execute function dir_jobs_release();

-- Installers may change only scheduling and status fields on jobs released to them.
create function dir_jobs_installer_guard() returns trigger
language plpgsql as $$
begin
  if dir_is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if (new.ref, new.quote_request_ref, new.area_slug, new.city, new.zip, new.scope, new.drawings_path,
      new.delivery_window, new.chosen_installer_id, new.partitions_paid_at)
     is distinct from
     (old.ref, old.quote_request_ref, old.area_slug, old.city, old.zip, old.scope, old.drawings_path,
      old.delivery_window, old.chosen_installer_id, old.partitions_paid_at) then
    raise exception 'installers may only update install_date and status';
  end if;
  if new.status not in ('scheduled', 'installed') or old.status not in ('released', 'scheduled', 'installed') then
    raise exception 'installers may move a released job to scheduled or installed only';
  end if;
  return new;
end $$;

create trigger dir_jobs_installer_guard before update on dir_jobs
for each row execute function dir_jobs_installer_guard();

-- ---------- public directory view ----------
-- What the site renders. Approved installers only; no legal name, documents or internal notes.
create view dir_public_installers with (security_invoker = false) as
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
group by i.id;

create view dir_public_rate_cards with (security_invoker = false) as
select i.slug, r.material, r.mounting, r.per_stall_low_cents, r.per_stall_high_cents, r.minimum_cents, r.extras
from dir_rate_cards r join dir_installers i on i.id = r.installer_id
where i.status = 'approved';

create view dir_public_reviews with (security_invoker = false) as
select i.slug, r.rating, r.body, r.reviewer_display, r.published_at
from dir_reviews r join dir_installers i on i.id = r.installer_id
where r.published_at is not null and i.status = 'approved';

grant select on dir_public_installers, dir_public_rate_cards, dir_public_reviews to anon, authenticated;

-- ---------- row level security ----------
alter table dir_admins enable row level security;
alter table dir_installers enable row level security;
alter table dir_installer_checks enable row level security;
alter table dir_service_areas enable row level security;
alter table dir_rate_cards enable row level security;
alter table dir_jobs enable row level security;
alter table dir_job_contacts enable row level security;
alter table dir_job_invites enable row level security;
alter table dir_job_messages enable row level security;
alter table dir_job_events enable row level security;
alter table dir_reviews enable row level security;

-- Admins: everything.
create policy admin_all on dir_admins for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_installers for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_installer_checks for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_service_areas for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_rate_cards for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_jobs for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_job_contacts for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_job_invites for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_job_messages for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_job_events for all using (dir_is_admin()) with check (dir_is_admin());
create policy admin_all on dir_reviews for all using (dir_is_admin()) with check (dir_is_admin());

-- Installers: their own profile, checks (read only) and rate card.
create policy own_profile_read on dir_installers for select using (id = dir_my_installer_id());
create policy own_profile_edit on dir_installers for update using (id = dir_my_installer_id())
  with check (id = dir_my_installer_id());
create policy own_checks_read on dir_installer_checks for select using (installer_id = dir_my_installer_id());
create policy own_areas_read on dir_service_areas for select using (installer_id = dir_my_installer_id());
create policy own_rates on dir_rate_cards for all using (installer_id = dir_my_installer_id())
  with check (installer_id = dir_my_installer_id());

-- Jobs: only jobs they were invited to; the job row itself carries no customer details.
create policy invited_jobs_read on dir_jobs for select using (dir_can_see_job(id));
create policy released_jobs_update on dir_jobs for update
  using (chosen_installer_id = dir_my_installer_id() and released_at is not null)
  with check (chosen_installer_id = dir_my_installer_id());

-- THE privacy rule: contacts only for the chosen installer, only after release.
create policy released_contacts_read on dir_job_contacts for select using (
  exists (select 1 from dir_jobs j
          where j.id = job_id and j.chosen_installer_id = dir_my_installer_id() and j.released_at is not null)
);

-- Invites: read own; answer own (price, notes, decline). Can't change who or when it was sent.
create policy own_invites_read on dir_job_invites for select using (installer_id = dir_my_installer_id());
create policy own_invites_answer on dir_job_invites for update using (installer_id = dir_my_installer_id())
  with check (installer_id = dir_my_installer_id());

-- Messages: own thread on invited jobs; installers can only post as 'installer'.
create policy own_messages_read on dir_job_messages for select using (installer_id = dir_my_installer_id());
create policy own_messages_post on dir_job_messages for insert with check (
  installer_id = dir_my_installer_id() and sender = 'installer' and dir_can_see_job(job_id)
);

-- Events: chosen installer reads and posts on released jobs.
create policy job_events_read on dir_job_events for select using (
  exists (select 1 from dir_jobs j where j.id = job_id and j.chosen_installer_id = dir_my_installer_id())
);
create policy job_events_post on dir_job_events for insert with check (
  exists (select 1 from dir_jobs j where j.id = job_id
          and j.chosen_installer_id = dir_my_installer_id() and j.released_at is not null)
  and status in ('scheduled', 'installed')
);

-- Reviews: installers read their own (published or not).
create policy own_reviews_read on dir_reviews for select using (installer_id = dir_my_installer_id());

-- Installers edit their own profile text, photo and coverage only; never status, identity or phone.
create function dir_installers_guard() returns trigger
language plpgsql as $$
begin
  if dir_is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if (new.slug, new.legal_name, new.user_id, new.status, new.approved_at, new.tracked_phone)
     is distinct from
     (old.slug, old.legal_name, old.user_id, old.status, old.approved_at, old.tracked_phone) then
    raise exception 'installers may not change slug, legal name, login, status or tracked phone';
  end if;
  return new;
end $$;

create trigger dir_installers_guard before update on dir_installers
for each row execute function dir_installers_guard();

-- Invite answers: stamp responded_at on the first answer; installers can't touch sent_at.
create function dir_invites_answer() returns trigger
language plpgsql as $$
begin
  if not dir_is_admin() and current_user in ('authenticated', 'anon') then
    new.sent_at := old.sent_at;
    new.job_id := old.job_id;
    new.installer_id := old.installer_id;
  end if;
  if new.responded_at is null and (new.price_cents is not null or new.declined) then
    new.responded_at := now();
  end if;
  return new;
end $$;

create trigger dir_invites_answer before update on dir_job_invites
for each row execute function dir_invites_answer();
