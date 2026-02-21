-- Migration to support referrals and points
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Optional: Index on referrer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON public.profiles(referrer_id);
