# Staging run, 2026-11-02

Supabase project **nextpartitions-staging** (`vgypcsirdnxlcolosrwm`, us-east-1). Not the live project (`sdniadjapygfknazbnqe`, in `commercial-partitions/supabase/config.toml`), which the staging token can't reach.

## What was set up

| Step | Result |
|---|---|
| Migrations | 10 from `nomadicmarc/commercial-partitions` (live site), then the 7 in `supabase/migrations/`. All applied cleanly and recorded in `supabase_migrations.schema_migrations`, so `supabase db push` sees them. 33,791 ZIP centres loaded. The live site's email cron and vault secret are comments in its migration (Lovable applies them), so staging doesn't send the live site's emails. |
| DFW area | Seeded by hand (`dallas`, Dallas–Fort Worth): **no migration or portal screen creates areas**. |
| Email worker | `dir-outbox` deployed. Secrets: `EMAIL_PROVIDER=log`, `COORDINATOR_EMAIL=coordinator@staging.invalid`, `SITE_URL=http://localhost:3000`, `TIME_ZONE=America/Chicago`. Cron job `dir-outbox` runs it every minute (`net.http_post` with the service-role key in the vault as `dir_outbox_service_role_key`). `dir-sweep-jobs` runs every 15 minutes. |
| Buckets | `dir-documents`, `dir-drawings`, `dir-job-photos` private; `dir-profile-photos` public. |
| `/portal/` auth redirect | **Not set**: the token lacks `project_admin_write`. Add it in Authentication → URL Configuration. |
| App | `app/.env` (git-ignored) points at staging: publishable key for the app, service-role key for the server only. |

## The job flow

`node scripts/staging-e2e.mjs "$PWD/app"` runs every step as the real role (anonymous visitor, coordinator, installers, customer), so row-level security applies. Each run makes new installers and a job tagged with a run id. Second run: **41 of 43 steps pass**.

Works: applications with document uploads (anonymous); approval refused until the five checks pass; test jobs, timed replies; listing as Verified; area published, public views and pages show the 3 installers; job entered by hand with drawings, location from ZIP; routing invites all 3, estimates from rate cards, prices above rates flagged; installers see a blind packet only (no contact, no quote, drawings readable), phone and email masked in messages; the customer's quote link, drawings download, drawings approval, choice, PO; nothing released until the PO is accepted, then only the chosen installer sees the customer; an install date before delivery is refused; photos, installed, sign-off (label becomes Approved, installs 1); review shown publicly; 52 outbox rows sent by cron with no errors. Every kind of email renders, including the customer's quote link email. Pages render from staging data: `/service-area/texas`, `/service-area/dallas`, `/installers/<slug>`, `/installers/apply/`, `/quote/<token>`.

## What breaks or needs a decision

Fixed the same day (items 2–5): migration `20261102000000_job_status_guard_and_dfw.sql` (applied to staging, with tests in `apply_test.sql`) and the portal's Documents queue. Rerun: **43 of 44 steps pass**; the one left is item 1.


1. **Open. Installer logins can't be given on staging.** `inviteUserByEmail` (the portal's "give a login") rejects the test addresses as invalid, then hits Supabase's built-in email rate limit; built-in email only sends to the project team. Needs a real address plus custom SMTP (e.g. Resend) under Authentication → SMTP. The run signs installers in with passwords instead.
2. **Fixed.** **Accepting a document from the Documents queue doesn't set a profile label** (`reviewUpload` in `app/src/portal/repo.supabase.ts`), so a Verified installer whose insurance and registration were accepted there shows no checks on their profile. The Vetting tab's buttons do set labels. Now accepting a document keeps the check's label or gives it the Vetting tab's default (`CHECK_DEFAULT_PUBLIC_LABEL` in `app/src/portal/types.ts`).
3. **Fixed.** **The coordinator could show prices with none in.** Run 1 presented a job with 0 prices and the customer email read "along with 0 firm installation prices". The portal hides the button, but the database didn't stop it. Now `dir_jobs_status_guard` refuses `presented` without a price the customer would see (and for test jobs).
4. **Fixed.** **Job status could skip steps for admins** (run 1: `presented` straight to `signed_off`). Now, for everyone: `installer_chosen` needs a chosen installer, `released`/`scheduled`/`installed` need the job released (`scheduled` also an install date), `signed_off` only from `installed`.
5. **Fixed.** **No seed for the pilot area**: the migration adds DFW (`dallas`, unpublished). Other areas still need a row by hand until there's a screen.
6. **Review requests go to the coordinator**, and the coordinator enters the review: no customer review page yet (as the README says).
7. Function logs can't be read with this token (`analytics_logs_read`); the emails were checked by rendering `messages.ts` on each row's `dir_outbox_context`.
