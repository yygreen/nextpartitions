-- Checks installer applications, vetting (approval rule, test job, decisions), Verified then Approved
-- and the customer's quote link. Run after supabase_shim.sql and every migration.
-- Every block raises an exception on failure; "APPLY TESTS PASSED" prints at the end.
\set ON_ERROR_STOP on

-- ---------- seed (as the database owner) ----------
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'), -- admin
  ('00000000-0000-0000-0000-0000000000a1'), -- Acme login
  ('00000000-0000-0000-0000-0000000000c1'); -- the applicant's login, once approved
insert into dir_admins values ('00000000-0000-0000-0000-00000000000a');
insert into dir_installers (id, slug, display_name, legal_name, user_id, base_city, base_state, base_zip, status, materials, mountings)
values ('10000000-0000-0000-0000-000000000001', 'acme', 'Acme Installations', 'Acme Installations LLC',
        '00000000-0000-0000-0000-0000000000a1', 'Dallas', 'TX', '75201', 'approved', '{hdpe}', '{overhead_braced}');
insert into dir_service_areas values ('10000000-0000-0000-0000-000000000001', 'dallas');

create function pg_temp.as_user(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
  if uid is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;

-- Runs q and expects an error whose message matches msg (a LIKE pattern).
create function pg_temp.fails(q text, msg text) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if sqlerrm not like msg then raise exception 'expected "%", got "%"', msg, sqlerrm; end if;
    return;
  end;
  raise exception 'expected an error: %', q;
end $$;

create function pg_temp.app(o jsonb default '{}') returns jsonb language sql as $$
  select '{
    "business_name": "Lone Star Partitions", "contact_name": "Sam Ortiz", "phone": "214-555-0150",
    "email": "Crew@LoneStar.example", "base_city": "Dallas", "base_zip": "75201", "service_radius_mi": 400,
    "years_in_business": 8, "crew_size": "3-5", "materials": ["hdpe", "phenolic", "bogus"],
    "mountings": ["overhead_braced", "ceiling_hung"], "extras": ["ada"], "registration_number": "DAL-123",
    "references": [{"name": "Kim Lee", "company": "Example GC", "phone": "214-555-0101"},
                   {"name": "Ana Ruiz", "email": "ana@example.com", "job_note": "Gym, 8 stalls"}],
    "rates": {"per_stall": {"hdpe": 14000, "phenolic": 16000}, "high_mount_extra_cents": 4500, "ada_stall_cents": 4000,
              "minimum_cents": 70000, "free_miles": 60, "per_mile_cents": 200},
    "agreement_name": "Sam Ortiz", "website": ""}'::jsonb || o;
$$;

-- 1. An anonymous visitor applies.
select pg_temp.as_user(null);
do $$ begin
  perform set_config('t.app', dir_submit_application(pg_temp.app())::text, false);
  assert (select count(*) from dir_installers) = 0, 'anon can read installers after applying';
end $$;
reset role;
do $$ declare a uuid := current_setting('t.app')::uuid; i dir_installers; begin
  select * into i from dir_installers where id = a;
  assert i.status = 'applied' and i.slug = 'lone-star-partitions', 'applicant not created as applied';
  assert i.service_radius_mi = 300, 'radius not clamped';
  assert i.materials = '{hdpe,phenolic}' and i.extras = '{ada}', 'unknown material kept';
  assert i.contact_email = 'crew@lonestar.example' and i.lat is not null, 'contact or location missing';
  assert i.agreement_name = 'Sam Ortiz' and i.agreement_accepted_at is not null, 'agreement not recorded';
  assert (select count(*) from dir_installer_checks where installer_id = a and status = 'pending') = 5, 'pending checks missing';
  assert (select internal_note from dir_installer_checks where installer_id = a and check_type = 'business_registration') = 'Registration number: DAL-123', 'registration number lost';
  assert (select count(*) from dir_rate_cards where installer_id = a) = 4, 'rate cards not one per material and mounting';
  assert (select per_stall_low_cents from dir_rate_cards where installer_id = a and material = 'hdpe' and mounting = 'ceiling_hung') = 18500, 'ceiling-hung extra not added';
  assert (select per_stall_high_cents from dir_rate_cards where installer_id = a and material = 'hdpe' and mounting = 'overhead_braced') = 14000, 'per-stall rate wrong';
  assert (select extras from dir_rate_cards where installer_id = a limit 1) = '{"ada_stall_cents": 4000, "free_miles": 60, "per_mile_cents": 200}', 'rate card extras wrong';
  assert (select count(*) from dir_installer_references where installer_id = a) = 2, 'references missing';
  assert exists (select 1 from dir_outbox where kind = 'application_received' and installer_id = a), 'no confirmation email queued';
end $$;

-- 2. Validation, honeypot, duplicate names and rate limits.
select pg_temp.as_user(null);
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"email": "nope"}'))$q$, 'Enter a valid email address');
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"base_zip": "752"}'))$q$, 'Enter a 5-digit ZIP code');
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"materials": ["bogus"]}'))$q$, 'Choose at least one material%');
-- Rates are optional (set later in the portal): a material without a rate gets no rate card.
select set_config('t.norates', dir_submit_application(pg_temp.app('{"materials": ["hdpe", "stainless"], "email": "norates@example.com", "business_name": "No Rates Co"}'))::text, false);
reset role;
do $$ declare a uuid := current_setting('t.norates')::uuid; begin
  assert (select count(*) from dir_rate_cards where installer_id = a and material = 'stainless') = 0, 'rate card made without a rate';
  assert (select count(*) from dir_rate_cards where installer_id = a and material = 'hdpe') > 0, 'given rate dropped';
end $$;
select pg_temp.as_user(null);
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"references": [{"name": "Kim", "phone": "1"}]}'))$q$, 'Give 2 or 3 references');
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"references": [{"name": "Kim", "phone": "1"}, {"name": "Ana"}]}'))$q$, 'Give each reference%');
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"agreement_name": " "}'))$q$, 'Type your full name to sign');
do $$ begin
  perform dir_submit_application(pg_temp.app('{"website": "http://spam.example"}'));
  perform set_config('t.app2', dir_submit_application(pg_temp.app())::text, false);
  perform dir_submit_application(pg_temp.app('{"business_name": "Third Try"}'));
end $$;
select pg_temp.fails($q$select dir_submit_application(pg_temp.app('{"business_name": "Fourth"}'))$q$, 'Too many applications%');
reset role;
do $$ begin
  -- 3 from this block plus the no-rates application above
  assert (select count(*) from dir_installers where status = 'applied') = 4, 'honeypot or validation created an installer';
  assert (select slug from dir_installers where id = current_setting('t.app2')::uuid) = 'lone-star-partitions-2', 'slug not made unique';
end $$;

-- 3. Documents with an application: own new folder only, for two hours, up to 5.
select pg_temp.as_user(null);
do $$ declare a text := current_setting('t.app'); begin
  insert into storage.objects (bucket_id, name) values ('dir-documents', a || '/coi.pdf');
  perform dir_application_document(a::uuid, 'insurance', a || '/coi.pdf');
end $$;
select pg_temp.fails($q$insert into storage.objects (bucket_id, name) values ('dir-documents', '10000000-0000-0000-0000-000000000001/x.pdf')$q$, '%row-level security%');
select pg_temp.fails(format($q$select dir_application_document(%L, 'insurance', '10000000-0000-0000-0000-000000000001/x.pdf')$q$, current_setting('t.app')), 'Invalid file path');
select pg_temp.fails(format($q$select dir_application_document(%L, 'references', %L)$q$, current_setting('t.app'), current_setting('t.app') || '/r.pdf'), 'Unknown document type');
select pg_temp.fails($q$select dir_application_document('10000000-0000-0000-0000-000000000001', 'insurance', '10000000-0000-0000-0000-000000000001/x.pdf')$q$, 'This application can no longer take documents%');
do $$ declare a text := current_setting('t.app2'); begin
  for k in 1..5 loop perform dir_application_document(a::uuid, 'insurance', a || '/f' || k || '.pdf'); end loop;
end $$;
select pg_temp.fails(format($q$select dir_application_document(%L, 'insurance', %L)$q$, current_setting('t.app2'), current_setting('t.app2') || '/f6.pdf'), 'Up to 5 documents%');
reset role;
update dir_installers set applied_at = now() - interval '3 hours' where id = current_setting('t.app2')::uuid;
select pg_temp.as_user(null);
select pg_temp.fails(format($q$insert into storage.objects (bucket_id, name) values ('dir-documents', %L)$q$, current_setting('t.app2') || '/late.pdf'), '%row-level security%');
select pg_temp.fails(format($q$select dir_application_document(%L, 'insurance', %L)$q$, current_setting('t.app2'), current_setting('t.app2') || '/late.pdf'), 'This application can no longer take documents%');
reset role;
do $$ begin
  assert (select count(*) from dir_document_uploads where installer_id = current_setting('t.app')::uuid) = 1, 'application document not queued';
  assert (select count(*) from dir_document_uploads where installer_id = current_setting('t.app2')::uuid) = 5, 'document limit wrong';
end $$;

-- 4. Test job: admin only, never swept or widened, kept out of area prices, no customer quote.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select pg_temp.fails(format($q$select dir_send_test_job(%L)$q$, current_setting('t.app')), 'only Next Partitions can send test jobs');
select pg_temp.as_user(null);
select pg_temp.fails(format($q$select dir_send_test_job(%L)$q$, current_setting('t.app')), '%permission denied%');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin perform set_config('t.test', dir_send_test_job(current_setting('t.app')::uuid)::text, false); end $$;
reset role;
update dir_installers set user_id = '00000000-0000-0000-0000-0000000000c1' where id = current_setting('t.app')::uuid;
do $$ declare j dir_jobs; begin
  select * into j from dir_jobs where id = current_setting('t.test')::uuid;
  assert j.is_test and j.status = 'routed' and j.city = 'Dallas' and j.scope->>'material' = 'hdpe', 'test job wrong';
  assert (select estimate_cents from dir_job_invites where job_id = j.id) = 70000, 'test job estimate wrong';
  assert not exists (select 1 from dir_job_quotes where job_id = j.id), 'test job got a customer quote';
  update dir_jobs set price_due_at = now() - interval '1 day' where id = j.id;
  update dir_job_invites set sent_at = now() - interval '2 days' where job_id = j.id;
  perform dir_sweep_jobs();
  select * into j from dir_jobs where id = j.id;
  assert j.status = 'routed' and j.search_round = 1 and j.window_closed_at is null, 'sweep touched the test job';
  assert (select count(*) from dir_job_invites where job_id = j.id) = 1, 'test job widened to others';
  assert (select reminded_at is null from dir_job_invites where job_id = j.id), 'test job sent a reminder';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
do $$ begin
  assert (select count(*) from dir_jobs) = 1, 'applicant cannot see the test job';
  update dir_job_invites set price_cents = 70000 where job_id = current_setting('t.test')::uuid;
end $$;
reset role;
do $$ begin
  assert (select responded_at is not null from dir_job_invites where job_id = current_setting('t.test')::uuid), 'test reply not timed';
  assert (select count(*) from dir_area_price_benchmarks) = 0, 'test job counted in area prices';
end $$;

-- 5. Approval needs the five checks; vetting decisions.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.fails(format($q$update dir_installers set status = 'approved' where id = %L$q$, current_setting('t.app')),
  'Before approving, these checks must pass: insurance, business or city registration, references, response test, listing agreement');
update dir_installer_checks set status = 'passed', verified_at = current_date
  where installer_id = current_setting('t.app')::uuid and check_type in ('insurance', 'business_registration', 'references', 'listing_agreement');
select pg_temp.fails(format($q$update dir_installers set status = 'approved' where id = %L$q$, current_setting('t.app')),
  'Before approving, these checks must pass: response test');
update dir_installer_checks set status = 'passed', verified_at = current_date
  where installer_id = current_setting('t.app')::uuid and check_type = 'response_test';
update dir_installers set status = 'approved' where id = current_setting('t.app')::uuid;
do $$ begin
  perform dir_vetting_notice(current_setting('t.app2')::uuid, 'info_request', 'Send your Dallas registration');
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
select pg_temp.fails(format($q$select dir_vetting_notice(%L, 'rejected', 'x')$q$, current_setting('t.app2')), 'only Next Partitions can send vetting decisions');
select pg_temp.as_user(null);
select pg_temp.fails(format($q$select dir_vetting_notice(%L, 'rejected', 'x')$q$, current_setting('t.app2')), '%permission denied%');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select dir_vetting_notice(current_setting('t.app2')::uuid, 'rejected', 'No partition installs in the last two years');
reset role;
do $$ begin
  assert (select approved_at is not null from dir_installers where id = current_setting('t.app')::uuid), 'approved_at not set';
  assert (select status = 'delisted' and decision_note = 'No partition installs in the last two years'
          from dir_installers where id = current_setting('t.app2')::uuid), 'rejection not recorded';
  assert (select payload->>'note' from dir_outbox where kind = 'application_info_request') = 'Send your Dallas registration', 'info request not queued';
  assert (select payload->>'email' from dir_outbox where kind = 'application_rejected') = 'crew@lonestar.example', 'rejection email not queued';
end $$;

-- 6. Public as soon as approved (Verified: no completed job yet); the first signed-off job earns Approved.
do $$ begin
  assert (select installs from dir_public_installers where slug = 'lone-star-partitions') = 0, 'not public once approved';
  assert (select count(*) from dir_public_rate_cards where slug = 'lone-star-partitions') > 0, 'rates not public once approved';
  assert coalesce((select checks::text from dir_public_installers where slug = 'lone-star-partitions'), '') not like '%Completed a job%', 'completed job shown too early';
end $$;
insert into dir_jobs (id, area_slug, city, zip, scope, delivery_window, chosen_installer_id, partitions_paid_at)
values ('20000000-0000-0000-0000-000000000009', 'dallas', 'Dallas', '75201', '{"material":"hdpe","mounting":"overhead_braced","stalls":3}',
        daterange('2026-11-02', '2026-11-09'), current_setting('t.app')::uuid, now());
update dir_jobs set status = 'signed_off' where id = '20000000-0000-0000-0000-000000000009';
do $$ begin
  assert (select checks::text from dir_public_installers where slug = 'lone-star-partitions') like '%Completed a job for a Next Partitions customer%', 'completed job not shown';
  assert (select installs from dir_public_installers where slug = 'lone-star-partitions') = 1, 'install not counted';
end $$;

-- 7. The customer's quote link.
insert into dir_jobs (id, ref, area_slug, city, zip, scope, delivery_window)
values ('20000000-0000-0000-0000-000000000001', 'J-QUOTE', 'dallas', 'Plano', '75074',
        '{"material":"hdpe","mounting":"overhead_braced","stalls":6}', daterange('2026-11-09', '2026-11-14'));
insert into dir_job_contacts (job_id, customer_name, company, email) values ('20000000-0000-0000-0000-000000000001', 'Pat Lee', 'Plano ISD', 'pat@example.org');
update dir_job_quotes set partitions_cents = 527000, freight_cents = 38500, quote_ref = 'Q-1048' where job_id = '20000000-0000-0000-0000-000000000001';
insert into dir_job_invites (job_id, installer_id) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', current_setting('t.app')::uuid);
select set_config('t.token', (select token from dir_job_quotes where job_id = '20000000-0000-0000-0000-000000000001'), false);
-- a quote row a test job should never have, to prove its link still doesn't work
insert into dir_job_quotes (job_id, token) values (current_setting('t.test')::uuid, 'testjobtoken');

select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
do $$ begin
  assert (select count(*) from dir_job_quotes) = 0, 'installer can read quotes';
end $$;
select pg_temp.as_user(null);
do $$ declare q jsonb := dir_customer_quote(current_setting('t.token')); begin
  assert length(current_setting('t.token')) = 64, 'token too short';
  assert dir_customer_quote('nope') is null and dir_customer_quote('testjobtoken') is null, 'unknown or test token answered';
  assert q->>'customer_name' = 'Pat Lee' and (q->>'partitions_cents')::int = 527000, 'quote details missing';
  assert q->>'delivery_from' = '2026-11-09' and q->>'delivery_to' = '2026-11-13', 'delivery dates wrong';
  assert jsonb_array_length(q->'prices') = 0 and not (q->>'has_drawings')::boolean, 'prices shown too early';
end $$;
select pg_temp.fails($q$select dir_customer_approve_drawings('nope')$q$, 'Quote not found');
select pg_temp.fails($q$select dir_customer_fallback('testjobtoken', 'wait')$q$, 'Quote not found');
select pg_temp.fails(format($q$select dir_customer_approve_drawings(%L)$q$, current_setting('t.token')), 'Your shop drawings aren''t ready yet');
reset role;
update dir_jobs set drawings_path = '20000000-0000-0000-0000-000000000001/v1.pdf', status = 'quoting' where id = '20000000-0000-0000-0000-000000000001';
update dir_job_invites set price_cents = 200000 where job_id = '20000000-0000-0000-0000-000000000001' and installer_id = '10000000-0000-0000-0000-000000000001';
update dir_job_invites set price_cents = 300000 where job_id = '20000000-0000-0000-0000-000000000001' and installer_id = current_setting('t.app')::uuid;
update dir_job_invites set price_flag = 'above_rates' where job_id = '20000000-0000-0000-0000-000000000001' and installer_id = current_setting('t.app')::uuid;
select pg_temp.as_user(null);
select dir_customer_approve_drawings(current_setting('t.token'));
do $$ begin
  assert jsonb_array_length(dir_customer_quote(current_setting('t.token'))->'prices') = 0, 'prices shown before presented';
end $$;
select pg_temp.fails(format($q$select dir_customer_choose(%L, '10000000-0000-0000-0000-000000000001')$q$, current_setting('t.token')), 'Installer prices aren''t ready yet');
reset role;
update dir_jobs set status = 'presented' where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.as_user(null);
do $$ declare p jsonb := dir_customer_quote(current_setting('t.token'))->'prices'; begin
  assert jsonb_array_length(p) = 1 and p->0->>'slug' = 'acme', 'flagged price shown or price missing';
  assert (p->0->>'price_cents')::int = 200000 and (p->0->>'listed')::boolean, 'price details wrong (approved installers are public)';
end $$;
select pg_temp.fails(format($q$select dir_customer_choose(%L, %L)$q$, current_setting('t.token'), current_setting('t.app')), 'That installer has no price on this quote');
select dir_customer_request_change(current_setting('t.token'), 'The ADA stall should be on the left.');
select pg_temp.fails(format($q$select dir_customer_choose(%L, '10000000-0000-0000-0000-000000000001')$q$, current_setting('t.token')), 'Approve your shop drawings first');
select pg_temp.fails(format($q$select dir_customer_request_change(%L, ' ')$q$, current_setting('t.token')), 'Describe the change%');
reset role;
do $$ begin
  assert (select needs_attention and attention_reason = 'Customer asked for a drawing change' from dir_jobs where id = '20000000-0000-0000-0000-000000000001'), 'change not flagged';
  assert (select drawings_approved_at is null and change_request like '%ADA%' from dir_job_quotes where job_id = '20000000-0000-0000-0000-000000000001'), 'change not recorded';
end $$;
select pg_temp.as_user(null);
select dir_customer_approve_drawings(current_setting('t.token'));
select dir_customer_fallback(current_setting('t.token'), 'partitions_only');
select pg_temp.fails(format($q$select dir_customer_payment(%L, 'po')$q$, current_setting('t.token')), 'Enter your purchase order number');
select dir_customer_payment(current_setting('t.token'), 'po', 'PO-123');
reset role;
do $$ begin
  assert (select attention_reason from dir_jobs where id = '20000000-0000-0000-0000-000000000001') = 'Customer will pay by purchase order PO-123: accept the PO', 'payment not flagged';
  assert exists (select 1 from dir_outbox where kind = 'customer_choice') and exists (select 1 from dir_outbox where kind = 'customer_payment'), 'customer events not queued';
end $$;
select pg_temp.as_user(null);
select dir_customer_choose(current_setting('t.token'), '10000000-0000-0000-0000-000000000001');
select pg_temp.fails(format($q$select dir_customer_choose(%L, '10000000-0000-0000-0000-000000000001')$q$, current_setting('t.token')), 'You''ve already chosen%');
select pg_temp.fails(format($q$select dir_customer_fallback(%L, 'wait')$q$, current_setting('t.token')), 'You''ve already chosen%');
reset role;
do $$ begin
  assert (select status = 'installer_chosen' and chosen_installer_id = '10000000-0000-0000-0000-000000000001'
          from dir_jobs where id = '20000000-0000-0000-0000-000000000001'), 'choice not recorded';
  assert exists (select 1 from dir_outbox where kind = 'installer_chosen' and job_id = '20000000-0000-0000-0000-000000000001'), 'choice not queued';
end $$;
update dir_jobs set po_accepted_at = now() where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.as_user(null);
select pg_temp.fails(format($q$select dir_customer_payment(%L, 'card')$q$, current_setting('t.token')), 'Your partitions order is already paid');
do $$ begin
  assert (dir_customer_quote(current_setting('t.token'))->>'paid')::boolean, 'paid not shown';
end $$;
reset role;

select 'APPLY TESTS PASSED';
