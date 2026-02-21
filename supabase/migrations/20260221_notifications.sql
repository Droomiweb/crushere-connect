-- 20260221_notifications.sql
-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'college_join', 'admin_broadcast', 'interaction', etc.
    title TEXT,
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster fetching
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- 3. Trigger for New Student Joined College
CREATE OR REPLACE FUNCTION public.notify_college_join() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when college_id is set and full_name is present (onboarding complete)
    IF (NEW.college_id IS NOT NULL AND NEW.full_name IS NOT NULL AND (OLD.full_name IS NULL OR OLD.college_id IS NULL)) THEN
        -- Insert notifications for all OTHER students in the same college
        INSERT INTO public.notifications (user_id, type, title, content, data)
        SELECT 
            p.id, 
            'college_join', 
            'New student joined!', 
            NEW.full_name || ' from your college joined to Crushere, checkout 🚀',
            jsonb_build_object('joined_user_id', NEW.id, 'college_id', NEW.college_id)
        FROM public.profiles p
        WHERE p.college_id = NEW.college_id AND p.id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_onboarding_complete
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (NEW.college_id IS NOT NULL AND NEW.full_name IS NOT NULL)
    EXECUTE FUNCTION public.notify_college_join();

-- 4. Admin Broadcast Helper Function
CREATE OR REPLACE FUNCTION public.broadcast_admin_notification(
    p_title TEXT,
    p_content TEXT,
    p_college_id UUID DEFAULT NULL
) 
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, content)
    SELECT 
        id, 
        'admin_broadcast', 
        p_title, 
        p_content
    FROM public.profiles
    WHERE (p_college_id IS NULL OR college_id = p_college_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
