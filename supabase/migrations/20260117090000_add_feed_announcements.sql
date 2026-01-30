ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS is_announcement boolean DEFAULT false;

ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS title text;
