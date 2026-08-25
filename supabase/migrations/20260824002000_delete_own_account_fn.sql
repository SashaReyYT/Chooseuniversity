-- Self-service account deletion (GDPR-style).
--
-- Supabase's JS client has no user-side delete; the standard pattern is a
-- SECURITY DEFINER function owned by postgres that removes the caller's
-- auth.users row. Every application table references auth.users with
-- ON DELETE CASCADE (0004/0005/0006/0014/20260820220000), so one delete
-- wipes profiles, saved programmes, comparisons, scores and weights.

create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_own_account() from anon, public;
grant execute on function public.delete_own_account() to authenticated;
