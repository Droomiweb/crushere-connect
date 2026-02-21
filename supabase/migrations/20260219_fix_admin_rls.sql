-- Fix recursive RLS policy on admins table
-- The previous policy 'auth.uid() in (select id from public.admins)' caused infinite recursion or empty results
-- because reading public.admins itself requires passing the policy.

-- Drop the old policy if it exists
drop policy if exists "Admins are viewable by admins" on public.admins;

-- Create a new, non-recursive policy
-- This allows any user to read THEIR OWN row in the admins table.
-- This is sufficient for AdminProtectedRoute to check "Am I an admin?"
create policy "Admins can view their own status"
  on public.admins for select
  using ( auth.uid() = id );
