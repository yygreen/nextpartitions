-- Areas the directory covers. Each one renders an installer section on /service-area/[slug]/
-- and appears on its state hub (/service-area/texas/).
create table dir_areas (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,                      -- 'Dallas–Fort Worth'
  short_name text not null,                -- 'DFW'
  state char(2) not null,
  state_slug text not null,                -- 'texas'
  center_lat double precision not null,
  center_lng double precision not null,
  cities text[] not null default '{}',
  published boolean not null default false -- false until 3+ installers are approved
);

alter table dir_areas enable row level security;
create policy admin_all on dir_areas for all using (dir_is_admin()) with check (dir_is_admin());
create policy published_read on dir_areas for select using (published);
grant select on dir_areas to anon, authenticated;
