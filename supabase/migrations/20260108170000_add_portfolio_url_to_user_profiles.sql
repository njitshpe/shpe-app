-- Add portfolio_url column to user_profiles table
-- This allows users to link their personal portfolio or website

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS portfolio_url text;

COMMENT ON COLUMN public.user_profiles.portfolio_url IS 'User portfolio or personal website URL';
