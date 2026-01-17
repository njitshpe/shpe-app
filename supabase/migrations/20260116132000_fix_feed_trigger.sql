-- Fix for feed post points trigger
-- Adds exception handling so points errors (like cooldowns) don't block post creation

CREATE OR REPLACE FUNCTION public.trigger_award_points_for_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Wrap in a block to catch errors (like cooldowns) without failing the insert
    BEGIN
        -- Check if it has images (using correct column name 'image_urls')
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
    EXCEPTION WHEN OTHERS THEN
        -- Log warning but allow the insert to proceed
        RAISE WARNING 'Failed to award points for post: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;
