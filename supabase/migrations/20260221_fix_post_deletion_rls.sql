-- Fix: Add DELETE policies for posts
-- 1. Policy for Authors to delete their own posts
CREATE POLICY "Authors can delete their own posts" ON public.posts
FOR DELETE USING (auth.uid() = author_id);

-- 2. Policy for Admins to delete any post
CREATE POLICY "Admins can delete any post" ON public.posts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  )
);
