-- The governing law on each state hub, and a one-line local rule on each area page (city or county contractor
-- licensing or registration needed to pull permits). Both shown with source, date checked and who to confirm with.
-- Filled by 20261103000400_laws_and_local_rules_data.sql (scripts/build-local-rules.py).
alter table dir_states
  add column license_law text,          -- e.g. 'NRS ch. 624; NAC 624.260'
  add column license_law_url text;

alter table dir_areas
  add column local_note text,           -- one sentence, plain language
  add column local_authority text,
  add column local_source_url text,
  add column local_checked date;
