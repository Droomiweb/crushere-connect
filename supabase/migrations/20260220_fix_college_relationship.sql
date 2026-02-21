-- Migration: Fix profiles-colleges relationship
-- Add foreign key constraint to profiles.college_id

ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_college 
FOREIGN KEY (college_id) 
REFERENCES public.colleges(id) 
ON DELETE SET NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
