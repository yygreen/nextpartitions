# Installer directory module

Built to drop into the live nextpartitions.com app. The live site is a Lovable project using **TanStack Start (React, server-rendered) with a Supabase backend**, so this module uses the same stack. Every database object is prefixed `dir_` so nothing collides with the existing schema.

## What's here

| Path | What it is | Status |
|---|---|---|
| `supabase/migrations/20261019000000_installer_directory.sql` | Tables, privacy rules (row-level security), triggers and public views | Done, tested |
| `supabase/tests/` | A stand-in for Supabase's auth roles plus an automated test of the privacy rules | Done |
| Routes and components (TanStack Start + Tailwind + shadcn/ui) | `/service-area/texas/`, `/service-area/[city]/` installer section, installer profiles, installer portal | Next |

## The rules the database enforces

- **Customer details stay hidden** from installers until the customer has chosen that installer **and** paid for the partitions order. `released_at` is set only by a trigger; reversing the payment hides them again.
- Before release, installers see a **blind job packet** only: scope, drawings, city/ZIP, delivery window, a job reference.
- Installers can price jobs they were invited to, message **through Next Partitions**, and edit their own profile text and rate card. They can't change their status, approval, tracked phone, or any job field except install date and status (scheduled → installed) after release. An install date can't be before delivery.
- The public site reads three views only (`dir_public_installers`, `dir_public_rate_cards`, `dir_public_reviews`): approved installers, published reviews and passed checks, with no legal names, documents or internal notes.
- Reply time is measured automatically (`responded_at` is stamped on the first answer) and shown as a median on the profile.

## Running the tests locally

```sh
createdb dirtest
psql -d dirtest -f supabase/tests/supabase_shim.sql
psql -d dirtest -f supabase/migrations/20261019000000_installer_directory.sql
psql -d dirtest -f supabase/tests/rls_test.sql   # prints ALL TESTS PASSED
```

## For Marc: how to merge it

1. Lovable projects sync two-way with GitHub. The simplest route is to **add us as a collaborator on the project's GitHub repo**; we open a pull request there and Lovable picks it up on merge. No Lovable seat needed.
2. Run the migration on the Supabase project (or let Lovable apply it from `supabase/migrations/`).
3. Map `dir_admins` to the site's existing admin role, if there is one.
4. Installer portal logins reuse Supabase Auth: an installer is a normal user linked through `dir_installers.user_id`.

## Open decisions that may change the schema

- Payment collection on the installer's behalf and the single checkout: needs the lawyer and CPA (adds payout fields).
- How `quote_request_ref` links to the existing quote requests: needs a look at the live schema.
- Whether site-measure visits release the site address early (an extra release stage).
