-- Migration: Notification Philosophy Alignment
-- Adds event importance flag, inbox categorization, and changes new_events default.

-- 1A. Add event importance flag
-- is_featured: admin-selected highlight events (stronger copy, not broader reach)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- 1B. Add category column to notifications inbox
-- Enables filtering, grouping, and icons per notification type
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_notifications_user_category
  ON public.notifications (user_id, category, created_at DESC);

-- 1C. Change default for new_events_enabled on new rows
-- Existing users keep their current preference. Only new sign-ups get false.
ALTER TABLE public.user_notification_settings
  ALTER COLUMN new_events_enabled SET DEFAULT false;
