-- Migration: Drop legacy rank columns from user_profiles
--
-- We now use the new points system:
--   - public.points_balances: stores user points per category (lifetime, semester, etc.)
--   - public.rank_tiers: defines rank thresholds and titles
--
-- The old rank_points and rank columns on user_profiles are no longer needed.

-- Drop legacy columns if they exist
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS rank_points;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS rank;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to confirm changes)
-- ============================================================================

-- Should return 0 rows if columns were successfully dropped
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('rank_points', 'rank');

-- Verify points_balances table is populated
SELECT * FROM public.points_balances LIMIT 5;
