-- Checks the privacy and permission rules. Run after supabase_shim.sql and the migration.
-- Every block raises an exception on failure; "ALL TESTS PASSED" prints at the end.
\set ON_ERROR_STOP on

-- ---------- seed (as the database owner) ----------
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'), -- admin
  ('00000000-0000-0000-0000-0000000000a1'), -- Acme login
  ('00000000-0000-0000-0000-0000000000b1'); -- Northwind login
insert into dir_admins values ('00000000-0000-0000-0000-00000000000a');
insert into dir_installers (id, slug, display_name, legal_name, user_id, base_city, base_state, base_zip, status, materials, mountings)
values
  ('10000000-0000-0000-0000-000000000001', 'acme', 'Acme Installations', 'Acme Installations LLC',
   '00000000-0000-0000-0000-0000000000a1', 'Dallas', 'TX', '75201', 'approved', '{hdpe,phenolic}', '{overhead_braced}'),
  ('10000000-0000-0000-0000-000000000002', 'northwind', 'Northwind Washroom', 'Northwind Washroom Inc',
   '00000000-0000-0000-0000-0000000000b1', 'Fort Worth', 'TX', '76102', 'vetting', '{hdpe}', '{floor_mounted}');
insert into dir_service_areas values ('10000000-0000-0000-0000-000000000001', 'dallas');
insert into dir_installer_checks (installer_id, check_type, status, verified_at, public_label, internal_note)
values ('10000000-0000-0000-0000-000000000001', 'city_registration', 'passed', '2026-10-15',
        'City of Dallas contractor registration', 'checked on DallasNow portal');
insert into dir_jobs (id, area_slug, city, zip, scope, delivery_window)
values ('20000000-0000-0000-0000-000000000001', 'dallas', 'Dallas', '75201',
        '{"material":"hdpe","mounting":"overhead_braced","stalls":6}', daterange('2026-11-02', '2026-11-09'));
insert into dir_job_contacts values ('20000000-0000-0000-0000-000000000001', 'Pat Lee', 'Plano ISD',
  'pat@example.com', '214-555-0100', '100 Main St, Dallas', 'Front office');
insert into dir_job_invites (job_id, installer_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002');

create function pg_temp.as_user(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
  if uid is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;

-- 1. Anonymous visitors: public views only, approved installers only, no internal notes.
select pg_temp.as_user(null);
do $$ begin
  assert (select count(*) from dir_public_installers) = 1, 'public view should list only approved installers';
  assert (select slug from dir_public_installers) = 'acme', 'acme should be public';
  assert (select checks::text from dir_public_installers) not like '%DallasNow%', 'internal note leaked';
  assert (select count(*) from dir_jobs) = 0, 'anon must not see jobs';
  assert (select count(*) from dir_job_contacts) = 0, 'anon must not see contacts';
  assert (select count(*) from dir_installers) = 0, 'anon must not read installers table';
end $$;
reset role;

-- 2. Before release: Acme sees the blind job packet, not the customer.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from dir_jobs) = 1, 'invited installer should see the job';
  assert (select count(*) from dir_job_contacts) = 0, 'contacts visible before release';
end $$;

-- 3. Acme prices the job; responded_at is stamped; can't touch Northwind's invite or sent_at.
update dir_job_invites set price_cents = 180000, sent_at = now() - interval '9 days'
  where installer_id = '10000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select responded_at is not null from dir_job_invites), 'responded_at not stamped';
  assert (select sent_at > now() - interval '1 day' from dir_job_invites), 'installer changed sent_at';
end $$;
update dir_job_invites set price_cents = 1 where installer_id = '10000000-0000-0000-0000-000000000002';
reset role;
do $$ begin
  assert (select price_cents from dir_job_invites where installer_id = '10000000-0000-0000-0000-000000000002') is null,
    'installer edited another installer''s invite';
end $$;

-- 4. Installers can't post as Next Partitions or promote themselves.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  begin
    insert into dir_job_messages (job_id, installer_id, sender, body)
    values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'next_partitions', 'hi');
    raise exception 'posted as next_partitions';
  exception when insufficient_privilege then null; end;
  insert into dir_job_messages (job_id, installer_id, sender, body)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'installer', 'Is the floor finished?');
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  begin
    update dir_installers set status = 'approved' where slug = 'northwind';
    raise exception 'installer approved itself';
  exception when raise_exception then
    if sqlerrm = 'installer approved itself' then raise; end if;
  end;
  update dir_installers set about = 'HDPE specialists' where slug = 'northwind';
  assert (select count(*) from dir_job_messages) = 0, 'Northwind sees Acme''s messages';
end $$;
reset role;

-- 5. Chosen but not paid: still hidden.
update dir_jobs set chosen_installer_id = '10000000-0000-0000-0000-000000000001'
  where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from dir_job_contacts) = 0, 'contacts visible before payment';
  -- installer can't mark the partitions paid (row-level security ignores the update before release)
  update dir_jobs set partitions_paid_at = now();
end $$;
reset role;
do $$ begin
  assert (select partitions_paid_at is null from dir_jobs), 'installer marked the partitions paid';
end $$;

-- 6. Paid: released automatically; only Acme sees contacts.
update dir_jobs set partitions_paid_at = now() where id = '20000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select released_at is not null and status = 'released' from dir_jobs), 'not released after payment';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from dir_job_contacts) = 1, 'chosen installer cannot see contacts after release';
  update dir_jobs set status = 'scheduled', install_date = '2026-11-10';
  assert (select status from dir_jobs) = 'scheduled', 'installer could not schedule';
  begin
    update dir_jobs set install_date = '2026-10-30';
    raise exception 'install before delivery allowed';
  exception when check_violation then null; end;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  assert (select count(*) from dir_job_contacts) = 0, 'unchosen installer sees contacts';
end $$;
reset role;

-- 7. Payment reversed (refund/chargeback): contacts hidden again.
update dir_jobs set partitions_paid_at = null where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from dir_job_contacts) = 0, 'contacts still visible after payment reversed';
end $$;
reset role;

-- 8. Admin sees everything.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  assert (select count(*) from dir_job_contacts) = 1, 'admin cannot see contacts';
  assert (select count(*) from dir_installers) = 2, 'admin cannot see all installers';
end $$;
reset role;

select 'ALL TESTS PASSED';
