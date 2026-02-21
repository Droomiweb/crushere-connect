-- Crushere 2.0: Database Overhaul

-- 1. Extend Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'normal' CHECK (subscription_plan IN ('normal', 'premium')),
ADD COLUMN IF NOT EXISTS last_crush_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_crush_count INTEGER DEFAULT 0;

-- Index for username search
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 2. Crushes Table
CREATE TABLE IF NOT EXISTS public.crushes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_mutual BOOLEAN DEFAULT false,
    UNIQUE(sender_id, receiver_id)
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'gift')),
    created_at TIMESTAMPTZ DEFAULT now(),
    is_read BOOLEAN DEFAULT false
);

-- 4. Rooms Table (if not exists)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for Messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crushes;

-- RLS Policies
ALTER TABLE public.crushes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Crushes Policies: Only sender can see their sent crushes, but recipients can't see them until they are mutual!
CREATE POLICY "Users can see their own sent crushes" ON public.crushes
FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can see mutual crushes" ON public.crushes
FOR SELECT USING (auth.uid() = receiver_id AND is_mutual = true);

CREATE POLICY "Users can insert crushes" ON public.crushes
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Messages Policies
CREATE POLICY "Users can see their own messages" ON public.messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);