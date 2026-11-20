-- State hubs (/service-area/<state>/) for all 50 states and DC, with each state's licensing summary for
-- "who may install partitions here". Slugs match app/src/directory/states.ts; New York state is
-- 'new-york-state' because 'new-york' is the New York City page.
-- The summary columns are filled by 20261103000200_state_licensing.sql (from research/state-licensing/);
-- every rule shows its source, the date it was checked and the authority to confirm with.

create table dir_states (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  code char(2) not null unique,
  name text not null,
  license_status text check (license_status in ('license_required', 'above_threshold', 'registration_only', 'no_state_license', 'unclear')),
  license_threshold_cents integer,
  license_summary text,                 -- plain language, for the public page
  license_authority text,               -- who to confirm with
  license_source_url text,
  license_checked date
);

-- Internal research notes: how sure we are and what to confirm. Admins only.
create table dir_state_notes (
  slug text primary key references dir_states (slug),
  confidence text check (confidence in ('high', 'medium', 'low')),
  note text
);

alter table dir_states enable row level security;
create policy admin_all on dir_states for all using (dir_is_admin()) with check (dir_is_admin());
create policy public_read on dir_states for select using (true);
grant select on dir_states to anon, authenticated;
grant insert, update, delete on dir_states to authenticated; -- rows limited to admins by admin_all

alter table dir_state_notes enable row level security;
create policy admin_all on dir_state_notes for all using (dir_is_admin()) with check (dir_is_admin());
revoke all on dir_state_notes from anon;
grant select, insert, update, delete on dir_state_notes to authenticated;

insert into dir_states (slug, code, name) values
  ('alabama', 'AL', 'Alabama'),
  ('alaska', 'AK', 'Alaska'),
  ('arizona', 'AZ', 'Arizona'),
  ('arkansas', 'AR', 'Arkansas'),
  ('california', 'CA', 'California'),
  ('colorado', 'CO', 'Colorado'),
  ('connecticut', 'CT', 'Connecticut'),
  ('delaware', 'DE', 'Delaware'),
  ('district-of-columbia', 'DC', 'District of Columbia'),
  ('florida', 'FL', 'Florida'),
  ('georgia', 'GA', 'Georgia'),
  ('hawaii', 'HI', 'Hawaii'),
  ('idaho', 'ID', 'Idaho'),
  ('illinois', 'IL', 'Illinois'),
  ('indiana', 'IN', 'Indiana'),
  ('iowa', 'IA', 'Iowa'),
  ('kansas', 'KS', 'Kansas'),
  ('kentucky', 'KY', 'Kentucky'),
  ('louisiana', 'LA', 'Louisiana'),
  ('maine', 'ME', 'Maine'),
  ('maryland', 'MD', 'Maryland'),
  ('massachusetts', 'MA', 'Massachusetts'),
  ('michigan', 'MI', 'Michigan'),
  ('minnesota', 'MN', 'Minnesota'),
  ('mississippi', 'MS', 'Mississippi'),
  ('missouri', 'MO', 'Missouri'),
  ('montana', 'MT', 'Montana'),
  ('nebraska', 'NE', 'Nebraska'),
  ('nevada', 'NV', 'Nevada'),
  ('new-hampshire', 'NH', 'New Hampshire'),
  ('new-jersey', 'NJ', 'New Jersey'),
  ('new-mexico', 'NM', 'New Mexico'),
  ('new-york-state', 'NY', 'New York'),
  ('north-carolina', 'NC', 'North Carolina'),
  ('north-dakota', 'ND', 'North Dakota'),
  ('ohio', 'OH', 'Ohio'),
  ('oklahoma', 'OK', 'Oklahoma'),
  ('oregon', 'OR', 'Oregon'),
  ('pennsylvania', 'PA', 'Pennsylvania'),
  ('rhode-island', 'RI', 'Rhode Island'),
  ('south-carolina', 'SC', 'South Carolina'),
  ('south-dakota', 'SD', 'South Dakota'),
  ('tennessee', 'TN', 'Tennessee'),
  ('texas', 'TX', 'Texas'),
  ('utah', 'UT', 'Utah'),
  ('vermont', 'VT', 'Vermont'),
  ('virginia', 'VA', 'Virginia'),
  ('washington', 'WA', 'Washington'),
  ('west-virginia', 'WV', 'West Virginia'),
  ('wisconsin', 'WI', 'Wisconsin'),
  ('wyoming', 'WY', 'Wyoming');

alter table dir_areas add constraint dir_areas_state_fk foreign key (state_slug) references dir_states (slug);

-- Areas are readable whether or not they're published, so a state hub can say where installers are coming
-- next. The app still shows an area page only once it's published (3+ listed installers).
drop policy published_read on dir_areas;
create policy public_read on dir_areas for select using (true);
