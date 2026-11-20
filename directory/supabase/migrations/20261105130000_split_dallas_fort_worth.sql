-- Dallas and Fort Worth as two areas that don't overlap.
--
-- The pilot area 'dallas' (20261102000000) was the whole metro, "Dallas–Fort Worth", listing Fort Worth and
-- Arlington. The February plan's city list then added 'fort-worth' (20261103000100), which lists the same western
-- cities, so the Texas page showed both areas with the same towns. The live site plans one buy page per city
-- (/service-area/dallas/, /service-area/fort-worth/), and each city has its own contractor registration rule, so
-- each gets its own installer area: every nearby city goes to the closer of the two centres. Installers in the
-- middle can serve both areas (dir_service_areas), so nobody loses coverage.

update dir_areas
set name = 'Dallas',
    short_name = 'Dallas',
    -- Dallas city centre (Census 2024 Gazetteer), instead of the metro midpoint
    center_lat = 32.7936,
    center_lng = -96.7662,
    cities = '{Dallas,Plano,Irving,Garland,Frisco,McKinney,"Grand Prairie",Carrollton,Lewisville}'
where slug = 'dallas';

update dir_areas
set cities = '{"Fort Worth",Arlington,Mansfield,"North Richland Hills","Flower Mound",Denton}'
where slug = 'fort-worth';
