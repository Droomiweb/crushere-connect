-- Create a table for public profiles linked to auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  phone text,
  full_name text,
  avatar_url text,
  college_id uuid, -- Link to colleges table
  is_verified boolean default false,
  verification_status text default 'pending', -- pending, verified, rejected
  college_mode_enabled boolean default false, -- Toggle for College Mode
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for colleges
create table public.colleges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text, -- e.g., 'stanford.edu' for email matching
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for subscriptions/premium plans
create table public.subscription_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- e.g., 'Gold', 'Platinum'
  description text,
  price_monthly numeric not null,
  duration_days integer not null, -- e.g., 30
  features jsonb, -- List of features enabled
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Track user subscriptions
create table public.user_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.subscription_plans(id),
  status text not null, -- active, expired, cancelled
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Admin roles table
create table public.admins (
  id uuid references auth.users(id) on delete cascade not null primary key,
  role text default 'admin', -- super_admin, moderator
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feature flags for admin control
create table public.feature_flags (
  key text primary key,
  is_enabled boolean default false,
  description text
);

-- Row Level Security (RLS) Policies

-- Profiles: Users can view their own profile. Public can view basic info of others (tbd).
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Subscriptions: Users can view their own. Admins can view all.
alter table public.user_subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.user_subscriptions for select
  using ( auth.uid() = user_id );

-- Admins: Only super admins can manage admins.
alter table public.admins enable row level security;

create policy "Admins are viewable by admins"
  on public.admins for select
  using ( auth.uid() in (select id from public.admins) );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, full_name, avatar_url)
  values (new.id, new.email, new.phone, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
