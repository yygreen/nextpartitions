-- Found on the 2026-11-02 staging run (docs/staging-run-2026-11-02.md):
--   * a job could be shown to the customer with no installer prices ("0 firm installation prices" email);
--   * an admin could move a job straight from presented to signed_off, skipping release and install;
--   * nothing created the pilot area, so a fresh project had nowhere to route jobs.

-- ---------- job status guard ----------
-- Applies to everyone, admins and the server included. Named so it runs after dir_jobs_release
-- (same-timing triggers fire in name order), which may have just set status to 'released'.
create function dir_jobs_status_guard() returns trigger
language plpgsql as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  case new.status
    when 'presented' then
      if new.is_test then
        raise exception 'Test jobs are never shown to a customer';
      end if;
      if not exists (select 1 from dir_job_invites v where v.job_id = new.id and dir_quote_price_visible(v)) then
        raise exception 'No installer prices to show yet: wait for a price, clear a checked price flag, or call the customer about partitions only';
      end if;
    when 'installer_chosen' then
      if new.chosen_installer_id is null then
        raise exception 'Record which installer the customer chose first';
      end if;
    when 'released', 'scheduled', 'installed' then
      if new.released_at is null then
        raise exception 'The job isn''t released yet: the customer must choose an installer and pay (or have a PO accepted)';
      end if;
      if new.status = 'scheduled' and new.install_date is null then
        raise exception 'Set the install date first';
      end if;
    when 'signed_off' then
      if old.status <> 'installed' then
        raise exception 'Only an installed job can be signed off';
      end if;
    else
      null; -- new, routed, quoting, cancelled
  end case;
  return new;
end $$;

create trigger dir_jobs_status_guard before update on dir_jobs
  for each row execute function dir_jobs_status_guard();

-- ---------- pilot area ----------
-- Unpublished until 3+ installers are listed (the coordinator publishes it from Vetting).
insert into dir_areas (slug, name, short_name, state, state_slug, center_lat, center_lng, cities)
values ('dallas', 'Dallas–Fort Worth', 'DFW', 'TX', 'texas', 32.84, -96.97,
        '{Dallas,"Fort Worth",Arlington,Plano,Irving,Garland,Frisco,McKinney,Denton}')
on conflict (slug) do nothing;
