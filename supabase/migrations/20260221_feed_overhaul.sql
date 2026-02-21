-- Migration: Feed & Posting Overhaul
-- Transition from anonymous string-based posts to profile-linked rich media posts.

-- 1. Create Replies Table
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL, -- Will link to posts later
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Post Interactions Table (Anonymous Likes/Dislikes)
CREATE TABLE IF NOT EXISTS public.post_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 3. Update/Redefine Posts Table
-- Since 'posts' might already have data, we'll try to migrate it
-- For safety in this migration, we'll add columns to existing table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS poll_data JSONB; -- { options: string[], votes: Record<string, number> }
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;

-- Link replies to posts now that posts is confirmed
ALTER TABLE public.replies ADD CONSTRAINT fk_replies_post FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.post_interactions ADD CONSTRAINT fk_interactions_post FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Replies
CREATE POLICY "Anyone can view replies" ON public.replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can reply" ON public.replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Interactions
CREATE POLICY "Anyone can view interaction counts" ON public.post_interactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own interactions" ON public.post_interactions FOR ALL USING (auth.uid() = user_id);

-- Posts update policy (Only author can edit)
-- Assuming posts already has RLS, if not:
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 6. Functions for Likes/Dislikes (Optional but cleaner)
-- We'll handle counts via frontend/trigger or simple updates for now.
