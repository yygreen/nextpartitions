-- What the email worker (supabase/functions/dir-outbox) needs to write each outbox message: the job, the
-- customer, the installer and the customer's quote link token. Service role only: it returns contact details.
-- Runs after 20261022000000_apply_vetting_quote.sql.

create function dir_outbox_context(p_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', o.id, 'kind', o.kind, 'payload', o.payload, 'created_at', o.created_at,
    'job', case when j.id is not null then jsonb_build_object(
      'ref', j.ref, 'city', j.city, 'zip', j.zip, 'status', j.status, 'is_test', j.is_test,
      'stalls', j.scope->'stalls', 'material', j.scope->>'material', 'mounting', j.scope->>'mounting',
      'install_date', j.install_date, 'price_due_at', j.price_due_at,
      'delivery_from', lower(j.delivery_window), 'delivery_to', upper(j.delivery_window) - 1,
      'priced', (select count(*) from dir_job_invites v where v.job_id = j.id and v.price_cents is not null and not v.declined)) end,
    'customer', case when c.job_id is not null then jsonb_build_object(
      'name', c.customer_name, 'company', c.company, 'email', c.email,
      -- Phone and site only go to the installer in the job_released email, as the portal shows them then.
      'phone', c.phone, 'site_address', c.site_address, 'site_contact', c.site_contact) end,
    'quote_token', q.token,
    'installer', case when i.id is not null then jsonb_build_object(
      'name', i.display_name, 'slug', i.slug, 'contact_name', i.contact_name,
      -- The portal login's address first: that's the inbox the installer signs in with.
      'email', coalesce(u.email, i.contact_email)) end,
    'invite', case when v.job_id is not null then jsonb_build_object(
      'price_cents', v.price_cents, 'due_at', v.due_at, 'estimate_cents', v.estimate_cents, 'invited_by', v.invited_by) end)
  from dir_outbox o
  left join dir_jobs j on j.id = o.job_id
  left join dir_job_contacts c on c.job_id = o.job_id
  left join dir_job_quotes q on q.job_id = o.job_id
  left join dir_installers i on i.id = o.installer_id
  left join auth.users u on u.id = i.user_id
  left join dir_job_invites v on v.job_id = o.job_id and v.installer_id = o.installer_id
  where o.id = p_id;
$$;

revoke execute on function dir_outbox_context(bigint) from public, anon, authenticated;
grant execute on function dir_outbox_context(bigint) to service_role;
