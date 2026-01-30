-- Add parent_id to feed_comments for nested replies
ALTER TABLE public.feed_comments 
ADD COLUMN parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE;

-- Index for performance when fetching replies
CREATE INDEX idx_feed_comments_parent_id ON public.feed_comments(parent_id);
