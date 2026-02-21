-- Fix: Admins RLS - Eliminate infinite recursion
-- The problem: any policy that queries `admins` to check membership
-- triggers the SELECT policy, which queries `admins` again → ∞ recursion.
-- Solution: Use a SECURITY DEFINER function that bypasses RLS.

-- Step 1: Drop ALL existing policies on admins table
DROP POLICY IF EXISTS "Admins are viewable by admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;

-- Step 2: Create a SECURITY DEFINER function to check admin status
-- This runs as the DB owner, bypassing RLS, breaking the recursion.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = user_id);
$$;

-- Step 3: Re-create safe, non-recursive policies using the function
CREATE POLICY "Admins can view all admins" ON public.admins
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can add new admins" ON public.admins
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can remove admins" ON public.admins
  FOR DELETE USING (public.is_admin(auth.uid()));
