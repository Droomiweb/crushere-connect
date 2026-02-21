-- Create a policy to allow Admins to manage all profiles
-- Currently, profiles might have RLS that restricts viewing to "auth.uid() = id" (self only) or "public" (if no policy).
-- We need to ensure admins can SELECT, UPDATE, and DELETE any profile.

drop policy if exists "Admins can manage all profiles" on public.profiles;

create policy "Admins can manage all profiles"
  on public.profiles
  for all -- Access to ALL operations (Select, Insert, Update, Delete)
  using (
    exists (
      select 1 from public.admins 
      where public.admins.id = auth.uid()
    )
  );

-- Also ensure RLS is enabled on profiles, otherwise these policies don't matter (but usually it is enabled).
alter table public.profiles enable row level security;

-- If there is a "Users can view own profile" policy, this new one adds to it (OR logic), so admins get access.
