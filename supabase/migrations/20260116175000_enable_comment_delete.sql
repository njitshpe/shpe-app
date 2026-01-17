-- Enable RLS
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Cleansing fire: remove all previous attempts at update policies for this table
DROP POLICY IF EXISTS "Users can update their own comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Update own comments" ON public.feed_comments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.feed_comments;

-- 1. Simple DELETE policy
CREATE POLICY "Users can delete their own comments" 
ON public.feed_comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Restore a basic UPDATE policy (just in case)
CREATE POLICY "Users can update their own comments" 
ON public.feed_comments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
