-- The directory moved to /installers/: state hubs at /installers/<state>/ and installer profiles at
-- /installers/<installer>/ share that address space, as does /installers/apply/. An installer whose name
-- makes one of those slugs (e.g. "Texas Partitions" -> 'texas-partitions' is fine, but "Texas" -> 'texas'
-- is not) gets '-installers' added.
create function dir_reserved_slug(s text) returns boolean
language sql stable as $$
  select s = 'apply' or exists (select 1 from dir_states where slug = s);
$$;

create function dir_installers_slug_guard() returns trigger
language plpgsql as $$
begin
  if dir_reserved_slug(new.slug) then
    new.slug := new.slug || '-installers';
  end if;
  return new;
end $$;

create trigger dir_installers_slug_guard before insert or update of slug on dir_installers
  for each row execute function dir_installers_slug_guard();
