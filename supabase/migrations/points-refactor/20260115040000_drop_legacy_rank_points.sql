-- Migration: Drop legacy rank/points system
-- Description: Removes old rank_transactions, points, rank_rules tables and legacy RPCs
-- Now using: points_transactions, points_balances, point_rules, award_points RPC

BEGIN;

-- Drop legacy RPCs (multiple signatures to cover all possibilities)
DROP FUNCTION IF EXISTS public.get_leaderboard_by_context(text, text, integer);
DROP FUNCTION IF EXISTS public.get_leaderboard_by_context_v2(text, text, integer);
DROP FUNCTION IF EXISTS public.get_my_rank(text);
DROP FUNCTION IF EXISTS public.get_my_rank(text, text, integer);
DROP FUNCTION IF EXISTS public.get_my_rank();

-- Drop legacy tables (CASCADE needed for foreign keys/policies)
DROP TABLE IF EXISTS public.rank_transactions CASCADE;
DROP TABLE IF EXISTS public.points CASCADE;
DROP TABLE IF EXISTS public.rank_rules CASCADE;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================
-- SELECT count(*) FROM public.points_transactions;
-- SELECT count(*) FROM public.points_balances;
-- SELECT * FROM public.get_leaderboard_current_season(p_limit := 10);
--
-- If all queries succeed and return expected data, migration is complete.
