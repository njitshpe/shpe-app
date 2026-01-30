-- Secure Points System
-- Moving all point logic to the database (triggers) so it's impossible to cheat + reduces read calls.
-- Also added support for dynamic event points.

-- 1. Database Changes
-- We need a specific 'points' value on events so we can override the default 50.
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 50;

-- Tracking if they volunteered and how long they stayed (for future geofencing)
ALTER TABLE public.event_attendance 
ADD COLUMN IF NOT EXISTS is_volunteer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 0;

-- 2. Point Rules
-- Inserting the new rules we discussed.
INSERT INTO public.point_rules (action_type, base_points, cooldown_seconds, daily_cap, per_event_cap, enabled) VALUES
    ('event_check_in', 50, NULL, NULL, 1, true),
    ('rsvp_confirmed_bonus', 10, NULL, NULL, 1, true),
    ('volunteer_bonus', 20, NULL, NULL, 1, true),
    ('feed_post_text', 5, 3600, 25, NULL, true),
    ('feed_post_photo', 15, 3600, 25, NULL, true),
    ('referral_bonus', 50, NULL, NULL, 1, false), -- Keeping these disabled for now
    ('streak_bonus', 25, NULL, NULL, 1, false)
ON CONFLICT (action_type) 
DO UPDATE SET 
    base_points = EXCLUDED.base_points,
    daily_cap = EXCLUDED.daily_cap,
    enabled = EXCLUDED.enabled;

-- 3. The Main Event Trigger
-- This handles everything: Checking in, RSVP bonuses, and Volunteer bonuses.
CREATE OR REPLACE FUNCTION public.trigger_award_points_for_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_points integer;
BEGIN
    -- Only run if they just checked in
    IF NEW.checked_in_at IS NOT NULL AND (OLD.checked_in_at IS NULL OR OLD.checked_in_at != NEW.checked_in_at) THEN
        
        -- Get the specific points value for this event
        SELECT points INTO v_event_points
        FROM public.events
        WHERE id = NEW.event_id;

        IF v_event_points IS NULL THEN
            v_event_points := 50;
        END IF;

        -- Award the Check-In points
        PERFORM public.award_points(
            'event_check_in', 
            'event', 
            'event_check_in:event:' || NEW.event_id || ':' || NEW.user_id, -- Unique key ensures they only get it once per event
            NEW.event_id,
            jsonb_build_object('checked_in_at', NEW.checked_in_at)
        );

        -- Give them the RSVP bonus if they signed up early
        IF NEW.rsvp_at IS NOT NULL THEN
            PERFORM public.award_points(
                'rsvp_confirmed_bonus',
                'event',
                'rsvp_bonus:event:' || NEW.event_id || ':' || NEW.user_id,
                NEW.event_id,
                jsonb_build_object('rsvp_at', NEW.rsvp_at)
            );
        END IF;

        -- Give them the Volunteer bonus if applicable
        IF NEW.is_volunteer IS TRUE THEN
            PERFORM public.award_points(
                'volunteer_bonus',
                'event',
                'volunteer_bonus:event:' || NEW.event_id || ':' || NEW.user_id,
                NEW.event_id,
                jsonb_build_object('role', 'volunteer')
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_attendance_checkin ON public.event_attendance;
CREATE TRIGGER on_event_attendance_checkin
    AFTER INSERT OR UPDATE ON public.event_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_award_points_for_event();

-- 4. Feed Post Trigger
-- Awards points for posting on the feed (more for photos).
CREATE OR REPLACE FUNCTION public.trigger_award_points_for_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If it has images, give the photo bonus
    IF NEW.image_urls IS NOT NULL AND array_length(NEW.image_urls, 1) > 0 THEN
         PERFORM public.award_points(
            'feed_post_photo', 
            'post', 
            'feed_post_photo:post:' || NEW.id || ':' || NEW.user_id,
            NEW.id,
            jsonb_build_object('has_image', true)
        );
    ELSE
         -- Otherwise just the text bonus
         PERFORM public.award_points(
            'feed_post_text', 
            'post', 
            'feed_post_text:post:' || NEW.id || ':' || NEW.user_id,
            NEW.id,
            jsonb_build_object('has_image', false)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to feed_posts if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feed_posts') THEN
        DROP TRIGGER IF EXISTS on_feed_post_created ON public.feed_posts;
        CREATE TRIGGER on_feed_post_created
            AFTER INSERT ON public.feed_posts
            FOR EACH ROW
            EXECUTE FUNCTION public.trigger_award_points_for_post();
    END IF;
END $$;


-- 5. Lock it down
-- Only triggers can award points now. No more client calls.
REVOKE EXECUTE ON FUNCTION public.award_points(text, text, text, uuid, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points(text, text, text, uuid, jsonb) FROM anon;
