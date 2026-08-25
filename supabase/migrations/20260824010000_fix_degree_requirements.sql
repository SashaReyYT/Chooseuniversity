-- C1 fix: required_degree_level on master/phd programmes should reference
-- the PRIOR degree (bachelor for masters, master for PhD), not the
-- programme's own outcome level. Bachelor/foundation programmes get NULL
-- (secondary education implied).

update programme_academic_requirements r
set required_degree_level = case p.degree_level
  when 'master' then 'bachelor'::degree_level
  when 'phd' then 'master'::degree_level
  else null
end
from programmes p
where r.programme_id = p.id
  and p.degree_level in ('foundation', 'bachelor');
