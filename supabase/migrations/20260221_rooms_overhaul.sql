-- Drop existing table if it's the old schema
DROP TABLE IF EXISTS public.room_messages CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;

-- Create Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_private BOOLEAN DEFAULT false,
    password TEXT,
    current_music_url TEXT,
    is_playing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Room Messages table
CREATE TABLE IF NOT EXISTS public.room_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Rooms Policies
-- 1. Anyone can view all rooms (so they appear in the list)
CREATE POLICY "Anyone can view rooms" 
    ON public.rooms FOR SELECT 
    USING (true);

-- 2. Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms" 
    ON public.rooms FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 3. Room creator can update their room (e.g. change music)
CREATE POLICY "Creators can update rooms" 
    ON public.rooms FOR UPDATE 
    USING (auth.uid() = created_by);

-- 4. Room creator can delete their room
CREATE POLICY "Creators can delete rooms" 
    ON public.rooms FOR DELETE 
    USING (auth.uid() = created_by);

-- Room Messages Policies
-- 1. Anyone can read messages (Access control is handled at the application routing level via password)
CREATE POLICY "Anyone can read room messages" 
    ON public.room_messages FOR SELECT 
    USING (true);

-- 2. Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert room messages" 
    ON public.room_messages FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 3. Users can delete their own messages
CREATE POLICY "Users can delete own room messages" 
    ON public.room_messages FOR DELETE 
    USING (auth.uid() = user_id);
