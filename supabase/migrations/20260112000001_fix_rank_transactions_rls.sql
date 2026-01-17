-- =============================================================================
-- FIX RANK_TRANSACTIONS RLS POLICY
-- =============================================================================
-- This migration ensures the broad "Allow leaderboard aggregation reads" policy
-- is removed if it was previously applied, restoring proper security.
--
-- The rank_transactions table should only have the original restrictive policy
-- that allows users to read their own transactions only.
-- =============================================================================

-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Allow leaderboard aggregation reads" ON public.rank_transactions;

-- Verify the original restrictive policy exists
-- If it doesn't exist, recreate it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rank_transactions'
      AND policyname = 'Users can read own rank transactions'
      AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Users can read own rank transactions"
    ON public.rank_transactions FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
--
-- To verify the fix worked:
--
-- 1. Check policies on rank_transactions:
--    SELECT policyname, cmd, qual
--    FROM pg_policies
--    WHERE tablename = 'rank_transactions' AND schemaname = 'public';
--
--    Expected: Only "Users can read own rank transactions" with
--              USING (auth.uid() = user_id)
--
-- 2. Test as normal user (should only see own transactions):
--    SELECT * FROM rank_transactions;
--
-- 3. Test RPC still works (should return leaderboard):
--    SELECT * FROM get_leaderboard_by_context('allTime', NULL, NULL);
--
-- =============================================================================
