-- Migration: Ensure mobile_no is unique across profiles
-- This prevents multiple users from registering with the same phone number

ALTER TABLE public.profiles ADD CONSTRAINT profiles_mobile_no_key UNIQUE (mobile_no);
