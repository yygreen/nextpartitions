#!/usr/bin/env bash
# Runs every database test on fresh local databases: the Supabase stand-in, all migrations, then the test file.
# Needs a local Postgres you can createdb on (set PGUSER/PGHOST as needed).
set -euo pipefail
cd "$(dirname "$0")/.."
for t in rls_test routing_test; do
  db="dirtest_$t"
  dropdb --if-exists "$db"; createdb "$db"
  for f in tests/supabase_shim.sql migrations/*.sql "tests/$t.sql"; do
    psql -q -v ON_ERROR_STOP=1 -d "$db" -f "$f" >/tmp/"$db".log 2>&1 || { tail -20 /tmp/"$db".log; exit 1; }
  done
  grep -h "PASSED" /tmp/"$db".log
done
