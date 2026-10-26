-- Checks dir_outbox_context, what the email worker reads for each outbox row: the right job, customer,
-- installer address and quote token, and that only the service role can call it.
-- Run after supabase_shim.sql and every migration. "OUTBOX TESTS PASSED" prints at the end.
\set ON_ERROR_STOP on

insert into auth.users values ('00000000-0000-0000-0000-0000000000a1', 'login@acme.example');
insert into dir_installers (id, slug, display_name, legal_name, user_id, base_city, base_state, base_zip, status, materials, mountings, contact_email)
values ('10000000-0000-0000-0000-000000000001', 'acme', 'Acme Installations', 'Acme Installations LLC',
        '00000000-0000-0000-0000-0000000000a1', 'Dallas', 'TX', '75201', 'approved', '{hdpe}', '{overhead_braced}', 'office@acme.example'),
       ('10000000-0000-0000-0000-000000000002', 'northwind', 'Northwind', 'Northwind LLC',
        null, 'Dallas', 'TX', '75201', 'approved', '{hdpe}', '{overhead_braced}', 'office@northwind.example');
insert into dir_jobs (id, ref, area_slug, city, zip, scope, delivery_window)
values ('20000000-0000-0000-0000-000000000001', 'J-OUT', 'dallas', 'Plano', '75074',
        '{"material":"hdpe","mounting":"overhead_braced","stalls":6}', daterange('2026-11-09', '2026-11-14'));
insert into dir_job_contacts values ('20000000-0000-0000-0000-000000000001', 'Pat Lee', 'Plano ISD', 'pat@example.org',
  '214-555-0100', '1200 Example Pkwy, Plano', 'Front office');
insert into dir_job_invites (job_id, installer_id, price_cents, responded_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 112000, now()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', null, null);

do $$
declare c jsonb; c2 jsonb; c3 jsonb;
begin
  select dir_outbox_context(id) into c from dir_outbox
  where kind = 'job_invite' and installer_id = '10000000-0000-0000-0000-000000000001';
  assert c->'job'->>'ref' = 'J-OUT', 'job ref';
  assert (c->'job'->>'stalls')::int = 6 and c->'job'->>'material' = 'hdpe', 'scope';
  assert c->'job'->>'delivery_from' = '2026-11-09' and c->'job'->>'delivery_to' = '2026-11-13', 'delivery window: ' || (c->'job')::text;
  assert (c->'job'->>'priced')::int = 1, 'priced count';
  assert c->'installer'->>'email' = 'login@acme.example', 'the login address comes first';
  assert (c->'invite'->>'price_cents')::int = 112000, 'invite price';
  assert c->'customer'->>'email' = 'pat@example.org' and c->>'quote_token' is not null, 'customer and quote token';

  select dir_outbox_context(id) into c2 from dir_outbox
  where kind = 'job_invite' and installer_id = '10000000-0000-0000-0000-000000000002';
  assert c2->'installer'->>'email' = 'office@northwind.example', 'without a login, the application address';

  perform dir_enqueue('application_received', null, '10000000-0000-0000-0000-000000000002', '{"email":"x@y.example"}');
  select dir_outbox_context(id) into c3 from dir_outbox where kind = 'application_received';
  assert c3->'job' = 'null'::jsonb and c3->'customer' = 'null'::jsonb and c3->'invite' = 'null'::jsonb, 'no job: ' || c3::text;
  assert c3->'payload'->>'email' = 'x@y.example', 'payload';
end $$;

do $$ begin
  assert not has_function_privilege('anon', 'dir_outbox_context(bigint)', 'execute'), 'anon can read contact details';
  assert not has_function_privilege('authenticated', 'dir_outbox_context(bigint)', 'execute'), 'logged-in users can read contact details';
  assert has_function_privilege('service_role', 'dir_outbox_context(bigint)', 'execute'), 'the worker can';
end $$;

select 'OUTBOX TESTS PASSED';
