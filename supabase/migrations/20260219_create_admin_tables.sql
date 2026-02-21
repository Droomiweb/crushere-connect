-- Ensure profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key
);

-- Ensure profiles has necessary columns
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists is_verified boolean default false;
alter table public.profiles add column if not exists verification_status text default 'pending';

-- Ensure admins table exists
create table if not exists public.admins (
  id uuid references auth.users(id) on delete cascade not null primary key,
  role text default 'admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Warn: We need to enable RLS for admins if we just created it
alter table public.admins enable row level security;

-- Create policy for admins if it doesn't exist (using DO block to avoid error if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admins' AND policyname = 'Admins are viewable by admins'
    ) THEN
        create policy "Admins are viewable by admins"
          on public.admins for select
          using ( auth.uid() in (select id from public.admins) );
    END IF;
END $$;


-- Create a table for content reports
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references auth.users(id) on delete set null,
  target_id uuid not null, -- ID of the reported post or user
  target_type text not null check (target_type in ('post', 'user', 'comment')),
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  resolved_by uuid references auth.users(id)
);

-- RLS for reports: Users can create, Admins can view/update
alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins can view all reports"
  on public.reports for select
  using (exists (select 1 from public.admins where id = auth.uid()));

create policy "Admins can update reports"
  on public.reports for update
  using (exists (select 1 from public.admins where id = auth.uid()));


-- Create a table for system settings
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Seed initial settings
insert into public.system_settings (key, value, description)
values 
  ('maintenance_mode', 'false', 'If true, shows maintenance screen to non-admins'),
  ('allow_signups', 'true', 'If false, disables new user registrations'),
  ('require_verification', 'false', 'If true, users must be verified to post')
on conflict (key) do nothing;

-- RLS for system_settings: Public read (or auth read), Admin write
alter table public.system_settings enable row level security;

create policy "Anyone can read system settings"
  on public.system_settings for select
  using (true);

create policy "Admins can update system settings"
  on public.system_settings for update
  using (exists (select 1 from public.admins where id = auth.uid()));

create policy "Admins can insert system settings"
  on public.system_settings for insert
  with check (exists (select 1 from public.admins where id = auth.uid()));

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Insert Admin User
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'crush.in@gmail.com') THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'crush.in@gmail.com',
      crypt('Crush@2005', gen_salt('bf')), -- Hash the password
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User"}',
      now(),
      now(),
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- Insert into public.profiles (or update if exists)
    INSERT INTO public.profiles (id, email, full_name, is_verified, verification_status)
    VALUES (new_user_id, 'crush.in@gmail.com', 'Admin User', true, 'verified')
    ON CONFLICT (id) DO UPDATE SET
      is_verified = true,
      verification_status = 'verified';

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, email, full_name, is_verified, verification_status)
    VALUES (new_user_id, 'crush.in@gmail.com', 'Admin User', true, 'verified')
    ON CONFLICT (id) DO UPDATE SET
        is_verified = excluded.is_verified,
        verification_status = excluded.verification_status;

    -- Insert into public.admins
    -- Check if admins table exists or create it? 
    -- It is referenced in policies so it must exist. 
    -- But previous migration file didn't create it. 
    -- Start by checking if table exists, if not create logic should be handled.
    -- Assuming it exists based on policies.
    INSERT INTO public.admins (id, role)
    VALUES (new_user_id, 'superadmin');
    
  ELSE
    -- User exists, ensure they are in admins
    INSERT INTO public.admins (id, role)
    SELECT id, 'superadmin'
    FROM auth.users 
    WHERE email = 'crush.in@gmail.com'
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
