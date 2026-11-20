-- Checks ZIP locations, document uploads and the storage rules. Run after supabase_shim.sql and every migration.
-- Every block raises an exception on failure; "FILES TESTS PASSED" prints at the end.
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
   '00000000-0000-0000-0000-0000000000a1', 'Dallas', 'TX', '75201', 'approved', '{hdpe}', '{overhead_braced}'),
  ('10000000-0000-0000-0000-000000000002', 'northwind', 'Northwind Washroom', 'Northwind Washroom Inc',
   '00000000-0000-0000-0000-0000000000b1', 'Fort Worth', 'TX', '76102', 'approved', '{hdpe}', '{overhead_braced}');
insert into dir_jobs (id, area_slug, city, zip, scope, delivery_window) values
  ('20000000-0000-0000-0000-000000000001', 'dallas', 'Plano', '75074',
   '{"material":"hdpe","mounting":"overhead_braced","stalls":6}', daterange('2026-11-02', '2026-11-09')),
  ('20000000-0000-0000-0000-000000000002', 'dallas', 'Dallas', '75201',
   '{"material":"hdpe","mounting":"overhead_braced","stalls":4}', daterange('2026-11-02', '2026-11-09'));
insert into dir_job_invites (job_id, installer_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

create function pg_temp.as_user(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
  if uid is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;

-- 1. Locations come from the ZIP.
do $$ begin
  assert (select count(*) from dir_zip_centroids) > 30000, 'ZIP data not loaded';
  assert (select abs(lat - 33.03) < 0.05 and abs(lng + 96.67) < 0.05 from dir_jobs
          where id = '20000000-0000-0000-0000-000000000001'), 'job location not filled from ZIP 75074';
  assert (select lat is not null and lng is not null from dir_installers where slug = 'acme'), 'installer location not filled';
end $$;

-- A new ZIP moves the job; a ZIP sent with its own location keeps that location; an unknown ZIP clears it.
update dir_jobs set zip = '76048' where id = '20000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select abs(lat - 32.44) < 0.1 from dir_jobs where id = '20000000-0000-0000-0000-000000000002'), 'ZIP change did not move the job';
end $$;
update dir_jobs set zip = '75201', lat = 32.7877, lng = -96.7994 where id = '20000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select lat = 32.7877 from dir_jobs where id = '20000000-0000-0000-0000-000000000002'), 'given location overwritten';
end $$;
update dir_jobs set zip = '00000' where id = '20000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select lat is null from dir_jobs where id = '20000000-0000-0000-0000-000000000002'), 'unknown ZIP kept the old location';
end $$;
update dir_jobs set zip = '75201' where id = '20000000-0000-0000-0000-000000000002';
update dir_installers set base_zip = '75074' where slug = 'northwind';
do $$ begin
  assert (select abs(lat - 33.03) < 0.05 from dir_installers where slug = 'northwind'), 'installer ZIP change did not move them';
end $$;

-- 2. Before release: Acme reads drawings for the job they're invited to, nothing else; no job photos yet.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into storage.objects (bucket_id, name) values
  ('dir-drawings', '20000000-0000-0000-0000-000000000001/shop-drawings.pdf'),
  ('dir-drawings', '20000000-0000-0000-0000-000000000002/shop-drawings.pdf');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'dir-drawings') = 1, 'drawings: wrong jobs visible';
  assert (select name from storage.objects where bucket_id = 'dir-drawings') like '20000000-0000-0000-0000-000000000001/%',
    'drawings: uninvited job visible';
  begin
    insert into storage.objects (bucket_id, name) values ('dir-drawings', '20000000-0000-0000-0000-000000000001/mine.pdf');
    raise exception 'installer uploaded drawings';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('dir-job-photos', '20000000-0000-0000-0000-000000000001/before.jpg');
    raise exception 'job photo uploaded before release';
  exception when insufficient_privilege then null; end;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'dir-drawings') = 0, 'uninvited installer sees drawings';
end $$;
reset role;

-- 3. Documents: own folder only. A folder that isn't an id is refused, not an error.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('dir-documents', '10000000-0000-0000-0000-000000000001/insurance-2027.pdf');
  begin
    insert into storage.objects (bucket_id, name) values ('dir-documents', '10000000-0000-0000-0000-000000000002/fake.pdf');
    raise exception 'uploaded into another installer''s folder';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('dir-documents', 'not-a-uuid/x.pdf');
    raise exception 'uploaded into a non-id folder';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('dir-documents', 'loose-file.pdf');
    raise exception 'uploaded outside any folder';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from storage.objects where bucket_id = 'dir-documents') = 1, 'Acme cannot see own document';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'dir-documents') = 0, 'Northwind sees Acme''s documents';
end $$;
reset role;

-- 4. Document uploads: own ok (stamped now, queued for review); someone else's or another folder refused; no edits.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  insert into dir_document_uploads (installer_id, check_type, path, uploaded_at)
  values ('10000000-0000-0000-0000-000000000001', 'insurance', '10000000-0000-0000-0000-000000000001/insurance-2027.pdf', now() - interval '30 days');
  begin
    insert into dir_document_uploads (installer_id, check_type, path)
    values ('10000000-0000-0000-0000-000000000002', 'insurance', '10000000-0000-0000-0000-000000000002/x.pdf');
    raise exception 'upload recorded for another installer';
  exception when insufficient_privilege then null; end;
  begin
    insert into dir_document_uploads (installer_id, check_type, path)
    values ('10000000-0000-0000-0000-000000000001', 'insurance', '10000000-0000-0000-0000-000000000002/x.pdf');
    raise exception 'upload recorded with another installer''s folder';
  exception when insufficient_privilege then null; end;
  begin
    insert into dir_document_uploads (installer_id, check_type, path, reviewed_at)
    values ('10000000-0000-0000-0000-000000000001', 'insurance', '10000000-0000-0000-0000-000000000001/y.pdf', now());
    raise exception 'installer marked own upload reviewed';
  exception when insufficient_privilege then null; end;
  update dir_document_uploads set reviewed_at = now(), review_note = 'ok';
  assert (select uploaded_at > now() - interval '1 minute' from dir_document_uploads), 'upload backdated';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  assert (select count(*) from dir_document_uploads) = 0, 'Northwind sees Acme''s uploads';
end $$;
reset role;
do $$ begin
  assert (select reviewed_at is null and review_note is null from dir_document_uploads), 'installer edited own upload';
  assert (select count(*) from dir_outbox where kind = 'document_uploaded'
          and installer_id = '10000000-0000-0000-0000-000000000001') = 1, 'upload not queued for review';
end $$;

-- 5. Released: Acme schedules (location untouched) and adds job photos; Northwind can't see them.
update dir_jobs set chosen_installer_id = '10000000-0000-0000-0000-000000000001', partitions_paid_at = now()
  where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ declare before_ double precision; begin
  select lat into before_ from dir_jobs where id = '20000000-0000-0000-0000-000000000001';
  update dir_jobs set status = 'scheduled', install_date = '2026-11-10' where id = '20000000-0000-0000-0000-000000000001';
  assert (select status = 'scheduled' and lat = before_ from dir_jobs where id = '20000000-0000-0000-0000-000000000001'),
    'scheduling failed or moved the job';
  insert into storage.objects (bucket_id, name) values ('dir-job-photos', '20000000-0000-0000-0000-000000000001/after.jpg');
  assert (select count(*) from storage.objects where bucket_id = 'dir-job-photos') = 1, 'Acme cannot see own job photo';
  begin
    insert into storage.objects (bucket_id, name) values ('dir-job-photos', '20000000-0000-0000-0000-000000000002/after.jpg');
    raise exception 'job photo on a job not released to them';
  exception when insufficient_privilege then null; end;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'dir-job-photos') = 0, 'Northwind sees Acme''s job photos';
end $$;
reset role;

-- 6. Profile photos: installers manage their own; anyone reads them, and nothing else.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  insert into storage.objects (bucket_id, name) values ('dir-profile-photos', '10000000-0000-0000-0000-000000000001/crew.jpg');
  begin
    insert into storage.objects (bucket_id, name) values ('dir-profile-photos', '10000000-0000-0000-0000-000000000002/crew.jpg');
    raise exception 'profile photo in another installer''s folder';
  exception when insufficient_privilege then null; end;
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
do $$ begin
  delete from storage.objects where bucket_id = 'dir-profile-photos';
end $$;
select pg_temp.as_user(null);
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'dir-profile-photos') = 1, 'profile photo not public or deleted by another installer';
  assert (select count(*) from storage.objects where bucket_id <> 'dir-profile-photos') = 0, 'anon sees private files';
  assert (select count(*) from dir_zip_centroids where zip = '75074') = 1, 'anon cannot read ZIP centres';
  begin
    insert into storage.objects (bucket_id, name) values ('dir-profile-photos', '10000000-0000-0000-0000-000000000001/x.jpg');
    raise exception 'anon uploaded a profile photo';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 7. Admin sees every file.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  assert (select count(*) from storage.objects) = 5, 'admin cannot see every file';
end $$;
reset role;

select 'FILES TESTS PASSED';
