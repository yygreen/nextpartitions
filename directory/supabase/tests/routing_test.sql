-- Checks job routing, the price window, the fallback, price checks, PO release, message redaction
-- and the outbox. Run on a fresh database after supabase_shim.sql and all migrations.
-- Every block raises an exception on failure; "ROUTING TESTS PASSED" prints at the end.
\set ON_ERROR_STOP on

create function pg_temp.as_user(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
  if uid is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;
create function pg_temp.inv(p_job text, p_slug text) returns dir_job_invites language sql as $$
  select v.* from dir_job_invites v join dir_installers i on i.id = v.installer_id
  where v.job_id = p_job::uuid and i.slug = p_slug;
$$;

-- ---------- seed (as the database owner) ----------
-- Logins: admin ...0a; Acme a1, Northwind b1, Contoso c1, Fabrikam d1.
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b1'), ('00000000-0000-0000-0000-0000000000c1'), ('00000000-0000-0000-0000-0000000000d1');
insert into dir_admins values ('00000000-0000-0000-0000-00000000000a');

insert into dir_installers (id, slug, display_name, legal_name, user_id, base_city, base_state, base_zip, lat, lng,
                            service_radius_mi, materials, mountings, status, approved_at) values
 ('10000000-0000-0000-0000-00000000000a', 'acme', 'Acme', 'Acme LLC', '00000000-0000-0000-0000-0000000000a1', 'Dallas', 'TX', '75201',
  32.78, -96.80, 60, '{hdpe,phenolic}', '{overhead_braced,floor_mounted}', 'approved', now() - interval '2 years'),
 ('10000000-0000-0000-0000-00000000000b', 'northwind', 'Northwind', 'Northwind Inc', '00000000-0000-0000-0000-0000000000b1', 'Fort Worth', 'TX', '76102',
  32.755, -97.33, 45, '{hdpe,phenolic}', '{overhead_braced,floor_mounted}', 'approved', now() - interval '1 year'),
 ('10000000-0000-0000-0000-00000000000c', 'contoso', 'Contoso', 'Contoso LLC', '00000000-0000-0000-0000-0000000000c1', 'Arlington', 'TX', '76010',
  32.735, -97.11, 40, '{hdpe,phenolic}', '{overhead_braced,floor_mounted}', 'approved', now() - interval '1 year'),
 ('10000000-0000-0000-0000-00000000000d', 'fabrikam', 'Fabrikam', 'Fabrikam LLC', '00000000-0000-0000-0000-0000000000d1', 'Denton', 'TX', '76201',
  33.215, -97.13, 45, '{hdpe}', '{overhead_braced}', 'approved', now() - interval '1 month'),
 ('10000000-0000-0000-0000-00000000000e', 'expired', 'Expired Ins', 'Expired LLC', null, 'Dallas', 'TX', '75201',
  32.78, -96.80, 60, '{hdpe}', '{overhead_braced}', 'approved', now() - interval '1 year'),
 ('10000000-0000-0000-0000-00000000000f', 'applicant', 'Applicant', 'Applicant LLC', null, 'Dallas', 'TX', '75201',
  32.78, -96.80, 60, '{hdpe}', '{overhead_braced}', 'vetting', null),
 ('10000000-0000-0000-0000-000000000010', 'steelonly', 'Steel Only', 'Steel LLC', null, 'Dallas', 'TX', '75201',
  32.78, -96.80, 60, '{powder_coated}', '{overhead_braced}', 'approved', now() - interval '1 year');

insert into dir_installer_checks (installer_id, check_type, status, verified_at, expires_at)
select id, t, 'passed', current_date - 30, current_date + 300
from dir_installers, unnest(array['insurance', 'city_registration']::dir_check_type[]) t
where slug in ('acme', 'northwind', 'contoso', 'fabrikam', 'steelonly', 'applicant');
insert into dir_installer_checks (installer_id, check_type, status, verified_at, expires_at) values
 ('10000000-0000-0000-0000-00000000000e', 'insurance', 'passed', current_date - 400, current_date - 5),   -- expired
 ('10000000-0000-0000-0000-00000000000e', 'city_registration', 'passed', current_date - 30, current_date + 300),
 ('10000000-0000-0000-0000-00000000000c', 'background_check', 'passed', current_date - 30, current_date + 300);

insert into dir_rate_cards (installer_id, material, mounting, per_stall_low_cents, per_stall_high_cents, minimum_cents, extras) values
 ('10000000-0000-0000-0000-00000000000a', 'hdpe', 'overhead_braced', 13000, 15000, 70000,
  '{"ada_stall_cents":4000,"urinal_screen_cents":4500,"demo_per_stall_cents":2500,"per_mile_cents":200,"free_miles":60}'),
 ('10000000-0000-0000-0000-00000000000a', 'phenolic', 'floor_mounted', 15000, 17000, 70000,
  '{"ada_stall_cents":4000,"urinal_screen_cents":4500,"per_mile_cents":200,"free_miles":60}');

-- Plano school job (J1), Granbury brewery (J2), plus jobs for capacity, preference, checks and reminders.
insert into dir_jobs (id, area_slug, city, zip, lat, lng, scope, delivery_window) values
 ('20000000-0000-0000-0000-000000000001', 'dallas-fort-worth', 'Plano', '75074', 33.02, -96.70,
  '{"material":"hdpe","mounting":"overhead_braced","stalls":6,"ada":true,"urinal_screens":2,"remove_stalls":6}', daterange('2026-11-09', '2026-11-14')),
 ('20000000-0000-0000-0000-000000000002', 'dallas-fort-worth', 'Granbury', '76048', 32.44, -97.79,
  '{"material":"phenolic","mounting":"floor_mounted","stalls":4,"ada":true,"urinal_screens":2}', daterange('2026-11-12', '2026-11-19'));
insert into dir_job_contacts values ('20000000-0000-0000-0000-000000000001', 'Pat Lee', 'Plano ISD', 'pat@example.org',
  '214-555-0100', '1200 Example Pkwy, Plano', 'Front office');

-- 1. Estimate from Acme's own rates: 6 × $140 + ADA $40 + 2 × $45 + 6 × $25 = $1,120; Granbury adds travel.
do $$ begin
  assert dir_estimate_cents('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001') = 112000, 'Plano estimate';
  assert dir_estimate_cents('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000002') = 80000,
    'Granbury estimate: 4 × $160 + $40 + $90 + 15 mi × $2 travel';
  assert dir_estimate_cents('10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001') is null, 'no rate card, no estimate';
end $$;

-- 2. Anonymous visitors and installers can't route jobs.
select pg_temp.as_user(null);
do $$ begin
  begin perform dir_route_job('20000000-0000-0000-0000-000000000001'); raise exception 'anon routed a job';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  begin perform dir_route_job('20000000-0000-0000-0000-000000000001'); raise exception 'installer routed a job';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 3. Route Plano as an admin: Acme, Contoso, Fabrikam qualify. Expired insurance, an applicant, a
--    steel-only installer and Northwind (49 mi, covers 45) don't.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  assert dir_route_job('20000000-0000-0000-0000-000000000001') = 3, 'Plano should get 3 invites';
end $$;
reset role;
do $$ begin
  assert (select array_agg(i.slug order by i.slug) from dir_job_invites v join dir_installers i on i.id = v.installer_id
          where v.job_id = '20000000-0000-0000-0000-000000000001') = '{acme,contoso,fabrikam}', 'wrong installers invited';
  assert (select status = 'quoting' and search_round = 1 and price_due_at > now() + interval '1 day' from dir_jobs
          where id = '20000000-0000-0000-0000-000000000001'), 'job not quoting with a 2-business-day deadline';
  assert (pg_temp.inv('20000000-0000-0000-0000-000000000001', 'acme')).estimate_cents = 112000, 'estimate not stored on invite';
  assert (select count(*) from dir_outbox where kind = 'job_invite' and job_id = '20000000-0000-0000-0000-000000000001') = 3,
    'job_invite emails not queued';
end $$;

-- 4. Acme prices above its own rates (flagged); can't touch the estimate or due date. Contoso declines.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
update dir_job_invites set price_cents = 140000, estimate_cents = 1, due_at = now() + interval '9 days',
  earliest_install_date = '2026-11-16', assumptions = 'Floor finished; blocking in place'
  where job_id = '20000000-0000-0000-0000-000000000001';
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
update dir_job_invites set declined = true, declined_reason = 'Fully booked' where job_id = '20000000-0000-0000-0000-000000000001';
reset role;
do $$ declare a dir_job_invites := pg_temp.inv('20000000-0000-0000-0000-000000000001', 'acme'); begin
  assert a.price_flag = 'above_rates', 'price 25% above own rates not flagged';
  assert a.estimate_cents = 112000 and a.due_at < now() + interval '5 days', 'installer changed protected invite fields';
  assert a.responded_at is not null and not a.late, 'reply not stamped';
  assert (pg_temp.inv('20000000-0000-0000-0000-000000000001', 'contoso')).declined, 'decline not saved';
  assert (select count(*) from dir_outbox where kind = 'invite_answered' and job_id = '20000000-0000-0000-0000-000000000001') = 2,
    'answers not queued';
end $$;

-- 5. Deadline passes with one price in: the window closes and Dana is asked to check the flagged price.
update dir_jobs set price_due_at = now() - interval '1 minute' where id = '20000000-0000-0000-0000-000000000001';
select dir_sweep_jobs();
do $$ begin
  assert (select window_closed_at is not null and needs_attention and attention_reason like 'Price check%'
          from dir_jobs where id = '20000000-0000-0000-0000-000000000001'), 'window not closed / price check not flagged';
  assert exists (select 1 from dir_outbox where kind = 'prices_ready' and job_id = '20000000-0000-0000-0000-000000000001'), 'prices_ready not queued';
end $$;

-- 6. A late price is still accepted until the customer chooses, and marked late.
update dir_job_invites set due_at = now() - interval '1 hour'
  where job_id = '20000000-0000-0000-0000-000000000001' and installer_id = '10000000-0000-0000-0000-00000000000d';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
update dir_job_invites set price_cents = 115000 where job_id = '20000000-0000-0000-0000-000000000001';
reset role;
do $$ begin
  assert (pg_temp.inv('20000000-0000-0000-0000-000000000001', 'fabrikam')).late, 'late reply not marked';
end $$;

-- 7. Before release, contact details are blacked out of messages, whoever sends them.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1');
insert into dir_job_messages (job_id, installer_id, sender, body) values ('20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-00000000000c', 'installer', 'Call me on (214) 555-0199 or mail bob@contoso.example');
reset role;
do $$ declare m dir_job_messages; begin
  select * into m from dir_job_messages where installer_id = '10000000-0000-0000-0000-00000000000c';
  assert m.redacted and m.body not like '%555-0199%' and m.body not like '%@contoso%', 'contact details not hidden: ' || m.body;
end $$;

-- 8. Customer chooses Acme and the school's purchase order is accepted: the job is released (no payment yet).
update dir_jobs set chosen_installer_id = '10000000-0000-0000-0000-00000000000a', status = 'installer_chosen'
  where id = '20000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select released_at is null from dir_jobs where id = '20000000-0000-0000-0000-000000000001'), 'released before PO or payment';
end $$;
update dir_jobs set po_accepted_at = now() where id = '20000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select released_at is not null and status = 'released' from dir_jobs where id = '20000000-0000-0000-0000-000000000001'),
    'accepted PO did not release the job';
  assert exists (select 1 from dir_outbox where kind = 'installer_chosen' and job_id = '20000000-0000-0000-0000-000000000001'), 'chosen not queued';
  assert exists (select 1 from dir_outbox where kind = 'job_released' and payload->>'by' = 'purchase_order'), 'release not queued';
end $$;

-- 9. After the choice, others can't change their price. Acme sees the customer and can share a number;
--    Acme can't change job fields other than status and install date.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  begin update dir_job_invites set price_cents = 90000 where job_id = '20000000-0000-0000-0000-000000000001';
    raise exception 'priced after the customer chose';
  exception when raise_exception then
    if sqlerrm not like '%already chosen%' then raise; end if;
  end;
end $$;
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
insert into dir_job_messages (job_id, installer_id, sender, body) values ('20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-00000000000a', 'installer', 'I will call Pat on 214-555-0123');
do $$ begin
  assert (select count(*) from dir_job_contacts) = 1, 'chosen installer cannot see contacts after PO release';
  assert (select body like '%214-555-0123%' and not redacted from dir_job_messages
          where installer_id = '10000000-0000-0000-0000-00000000000a'), 'number hidden after release';
  begin update dir_jobs set lat = 0 where id = '20000000-0000-0000-0000-000000000001'; raise exception 'installer moved the job';
  exception when raise_exception then if sqlerrm not like 'installers may only%' then raise; end if; end;
  update dir_jobs set status = 'scheduled', install_date = '2026-11-16';
  update dir_jobs set status = 'installed';
end $$;
reset role;
do $$ begin
  assert exists (select 1 from dir_outbox where kind = 'review_request' and deliver_after > now() + interval '23 hours'),
    'review request not queued for the next day';
end $$;

-- 10. Granbury: only Northwind covers it, and declines. The sweep widens once to 75 mi (Acme 75 mi,
--     Contoso 53 mi; Fabrikam is 79 mi and doesn't install phenolic). Both decline: no prices, Dana steps in.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select dir_route_job('20000000-0000-0000-0000-000000000002');
reset role;
do $$ begin
  assert (select count(*) from dir_job_invites where job_id = '20000000-0000-0000-0000-000000000002') = 1, 'Granbury round 1';
end $$;
update dir_job_invites set declined = true where job_id = '20000000-0000-0000-0000-000000000002';
select dir_sweep_jobs();
do $$ begin
  assert (select search_round = 2 and window_closed_at is null and not needs_attention from dir_jobs
          where id = '20000000-0000-0000-0000-000000000002'), 'search not widened';
  assert (select array_agg(i.slug order by i.slug) from dir_job_invites v join dir_installers i on i.id = v.installer_id
          where v.job_id = '20000000-0000-0000-0000-000000000002' and v.invited_by = 'widened') = '{acme,contoso}', 'wrong widened invites';
  assert (pg_temp.inv('20000000-0000-0000-0000-000000000002', 'acme')).estimate_cents = 80000, 'travel not in widened estimate';
  assert exists (select 1 from dir_outbox where kind = 'search_widened' and job_id = '20000000-0000-0000-0000-000000000002'), 'widen not queued';
end $$;
update dir_job_invites set declined = true where job_id = '20000000-0000-0000-0000-000000000002' and responded_at is null;
select dir_sweep_jobs();
do $$ begin
  assert (select needs_attention and window_closed_at is not null and attention_reason like 'No prices after the wider search%'
          from dir_jobs where id = '20000000-0000-0000-0000-000000000002'), 'no-price fallback not flagged';
  assert exists (select 1 from dir_outbox where kind = 'no_prices' and job_id = '20000000-0000-0000-0000-000000000002'), 'no_prices not queued';
end $$;

-- 11. Dana invites an installer by hand: reopens the window. An installer with expired insurance is refused.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select dir_invite_installer('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000d');
do $$ begin
  begin perform dir_invite_installer('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000e');
    raise exception 'invited an installer with expired insurance';
  exception when raise_exception then if sqlerrm not like '%expired%' then raise; end if; end;
end $$;
reset role;
do $$ begin
  assert (select window_closed_at is null from dir_jobs where id = '20000000-0000-0000-0000-000000000002'), 'manual invite did not reopen';
  assert (pg_temp.inv('20000000-0000-0000-0000-000000000002', 'fabrikam')).invited_by = 'manual', 'manual invite not recorded';
end $$;

-- 12. Preference, capacity, away dates and background checks.
insert into dir_jobs (id, area_slug, city, zip, lat, lng, scope, delivery_window, preferred_installer_id, others_ok, requires_background_check) values
 ('20000000-0000-0000-0000-000000000003', 'dallas-fort-worth', 'Plano', '75074', 33.02, -96.70,
  '{"material":"hdpe","mounting":"overhead_braced","stalls":3}', daterange('2026-12-01', '2026-12-05'), '10000000-0000-0000-0000-00000000000d', false, false),
 ('20000000-0000-0000-0000-000000000004', 'dallas-fort-worth', 'Plano', '75074', 33.02, -96.70,
  '{"material":"hdpe","mounting":"overhead_braced","stalls":3}', daterange('2026-12-01', '2026-12-05'), null, true, true),
 ('20000000-0000-0000-0000-000000000005', 'dallas-fort-worth', 'Plano', '75074', 33.02, -96.70,
  '{"material":"hdpe","mounting":"overhead_braced","stalls":3}', daterange('2026-12-01', '2026-12-05'), null, true, false);
update dir_installers set max_open_jobs = 0 where slug = 'acme';
update dir_installers set away_from = '2026-12-02', away_to = '2026-12-10' where slug = 'contoso';
select dir_route_job('20000000-0000-0000-0000-000000000003');
select dir_route_job('20000000-0000-0000-0000-000000000004');
select dir_route_job('20000000-0000-0000-0000-000000000005');
do $$ begin
  assert (select array_agg(i.slug || ':' || v.invited_by) from dir_job_invites v join dir_installers i on i.id = v.installer_id
          where v.job_id = '20000000-0000-0000-0000-000000000003') = '{fabrikam:preferred}', 'preferred-only job should invite just Fabrikam';
  assert (select count(*) from dir_job_invites where job_id = '20000000-0000-0000-0000-000000000004') = 0,
    'school job: only Contoso has a background check, and Contoso is away';
  assert (select needs_attention and attention_reason = 'No installer covers this job' from dir_jobs
          where id = '20000000-0000-0000-0000-000000000004'), 'uncovered job not flagged';
  assert (select array_agg(i.slug) from dir_job_invites v join dir_installers i on i.id = v.installer_id
          where v.job_id = '20000000-0000-0000-0000-000000000005') = '{fabrikam}', 'Acme at capacity and Contoso away should be skipped';
end $$;

-- 13. Reminder after 20 hours without an answer, once.
update dir_job_invites set sent_at = now() - interval '21 hours' where job_id = '20000000-0000-0000-0000-000000000005';
select dir_sweep_jobs();
select dir_sweep_jobs();
do $$ begin
  assert (select count(*) from dir_outbox where kind = 'invite_reminder' and job_id = '20000000-0000-0000-0000-000000000005') = 1,
    'reminder missing or sent twice';
end $$;

-- 14. The outbox: hidden from installers, claimable by the email/CRM worker only.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from dir_outbox) = 0, 'installer can read the outbox';
  begin perform dir_outbox_claim(5); raise exception 'installer claimed outbox rows';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role service_role;
do $$ declare n integer; begin
  select count(*) into n from dir_outbox_claim(5);
  assert n = 5, 'worker could not claim rows';
  perform dir_outbox_done((select min(id) from dir_outbox));
  assert (select sent_at is not null from dir_outbox where id = (select min(id) from dir_outbox)), 'done not recorded';
end $$;
reset role;

select 'ROUTING TESTS PASSED';
