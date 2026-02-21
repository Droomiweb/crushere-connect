-- Migration: Post Counts Sync Triggers
-- Keeps likes_count, dislikes_count, and comments_count in sync with their respective tables.

-- 1. Likes/Dislikes Sync Function
CREATE OR REPLACE FUNCTION public.sync_post_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'like') THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.type = 'dislike') THEN
            UPDATE public.posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.type = 'like') THEN
            UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.type = 'dislike') THEN
            UPDATE public.posts SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.post_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.type = NEW.type) THEN RETURN NEW; END IF;
        
        IF (OLD.type = 'like' AND NEW.type = 'dislike') THEN
            UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1), dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
        ELSIF (OLD.type = 'dislike' AND NEW.type = 'like') THEN
            UPDATE public.posts SET dislikes_count = GREATEST(0, dislikes_count - 1), likes_count = likes_count + 1 WHERE id = NEW.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Comments Sync Function
CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS tr_sync_interactions ON public.post_interactions;
CREATE TRIGGER tr_sync_interactions
AFTER INSERT OR UPDATE OR DELETE ON public.post_interactions
FOR EACH ROW EXECUTE FUNCTION public.sync_post_interaction_counts();

DROP TRIGGER IF EXISTS tr_sync_comments ON public.replies;
CREATE TRIGGER tr_sync_comments
AFTER INSERT OR DELETE ON public.replies
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

-- 4. Initial Sync (Optional: Reset counts to actual values)
UPDATE public.posts p
SET 
  likes_count = (SELECT count(*) FROM public.post_interactions WHERE post_id = p.id AND type = 'like'),
  dislikes_count = (SELECT count(*) FROM public.post_interactions WHERE post_id = p.id AND type = 'dislike'),
  comments_count = (SELECT count(*) FROM public.replies WHERE post_id = p.id);
