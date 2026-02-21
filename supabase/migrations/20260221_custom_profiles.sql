-- Add profile_layout JSONB column to profiles table
ALTER TABLE public.profiles
ADD COLUMN profile_layout JSONB DEFAULT '{}'::jsonb;
