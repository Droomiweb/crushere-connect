-- Migration: Comment Likes & Nested Reply Support
-- Ensure replies table has necessary columns
ALTER TABLE public.replies
  ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mentions TEXT[];

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID NOT NULL REFERENCES public.replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their comment likes" ON public.comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Replies policies using DO blocks (CREATE POLICY IF NOT EXISTS is not valid SQL)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'replies' AND policyname = 'Anyone can read replies'
  ) THEN
    CREATE POLICY "Anyone can read replies" ON public.replies FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'replies' AND policyname = 'Authenticated users can reply'
  ) THEN
    CREATE POLICY "Authenticated users can reply" ON public.replies FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'replies' AND policyname = 'Authors can delete replies'
  ) THEN
    CREATE POLICY "Authors can delete replies" ON public.replies FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;
