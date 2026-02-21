-- 20260221_onboarding_persistence.sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'email_otp';
