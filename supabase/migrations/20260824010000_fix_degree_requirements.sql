-- C1 fix (audit): the datafill set required_degree_level = degree_level on
-- every programme, meaning a bachelor's programme "requires a bachelor's
-- degree" — which excludes every secondary-school graduate, i.e. the core
-- audience. The field represents PRIOR education, not outcome level:
--   bachelor programme → no explicit prior-degree gate (secondary implied)
--   master programme   → bachelor required
--   phd programme      → master required

update programmes p set
  required_degree_level = case p.degree_level
    when 'master' then 'bachelor'::degree_level
    when 'phd' then 'master'::degree_level
    else null
  end
from programme_academic_requirements r
where r.programme_id = p.id
  and p.degree_level in ('foundation', 'bachelor');
