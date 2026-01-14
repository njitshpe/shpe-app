-- =============================================================================
-- LEADERBOARD TIME-BASED AGGREGATION
-- =============================================================================
-- Creates RPC function to aggregate leaderboard rankings by time window:
-- - month: Current calendar month
-- - semester: Jan-Jun or Jul-Dec
-- - allTime: All time (sums all rank_transactions)
--
-- Uses rank_transactions table to sum points within the time window.
-- Includes both positive and negative point deltas for accurate totals.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create RPC function for time-based leaderboard
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_leaderboard_by_context(
  p_context text DEFAULT 'allTime',
  p_major text DEFAULT NULL,
  p_class_year integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  user_type text,
  major text,
  expected_graduation_year integer,
  graduation_year integer,
  profile_picture_url text,
  rank_points integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_current_month integer;
  v_current_year integer;
BEGIN
  -- Calculate time window based on context
  v_current_month := EXTRACT(MONTH FROM NOW());
  v_current_year := EXTRACT(YEAR FROM NOW());

  CASE p_context
    WHEN 'month' THEN
      -- Current calendar month
      v_start_date := DATE_TRUNC('month', NOW());
      v_end_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

    WHEN 'semester' THEN
      -- Spring semester: Jan 1 - Jun 30
      -- Fall semester: Jul 1 - Dec 31
      IF v_current_month >= 1 AND v_current_month <= 6 THEN
        v_start_date := (v_current_year || '-01-01')::date;
        v_end_date := (v_current_year || '-07-01')::date;
      ELSE
        v_start_date := (v_current_year || '-07-01')::date;
        v_end_date := ((v_current_year + 1) || '-01-01')::date;
      END IF;

    ELSE -- 'allTime'
      v_start_date := NULL;
      v_end_date := NULL;
  END CASE;

  -- Return leaderboard data
  RETURN QUERY
  WITH user_points AS (
    -- For all contexts (including allTime), sum points_delta from rank_transactions
    -- This includes both positive and negative point changes for accurate totals
    SELECT
      up.id,
      COALESCE(
        (
          SELECT SUM(rt.points_delta)
          FROM public.rank_transactions rt
          WHERE rt.user_id = up.id
            AND (v_start_date IS NULL OR rt.created_at >= v_start_date)
            AND (v_end_date IS NULL OR rt.created_at < v_end_date)
        ),
        0
      ) as total_points
    FROM public.user_profiles up
    WHERE up.first_name IS NOT NULL
      AND up.last_name IS NOT NULL
      AND up.user_type IS NOT NULL
      -- Apply major filter if provided
      AND (p_major IS NULL OR up.major = p_major)
      -- Apply class year filter if provided (check both student and alumni)
      AND (
        p_class_year IS NULL
        OR up.expected_graduation_year = p_class_year
        OR up.graduation_year = p_class_year
      )
  )
  SELECT
    up.id,
    up.first_name,
    up.last_name,
    up.user_type,
    up.major,
    up.expected_graduation_year,
    up.graduation_year,
    up.profile_picture_url,
    upts.total_points::integer as rank_points,
    up.created_at
  FROM public.user_profiles up
  INNER JOIN user_points upts ON up.id = upts.id
  WHERE upts.total_points >= 0 -- Show users with zero or positive points
  ORDER BY upts.total_points DESC, up.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_leaderboard_by_context IS 'Get leaderboard rankings filtered by time context (month, semester, allTime) and optional major/class year filters. Uses SECURITY DEFINER to allow all authenticated users to read leaderboard data.';

-- -----------------------------------------------------------------------------
-- 2. Grant execute permission to authenticated users
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.get_leaderboard_by_context(text, text, integer) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RLS Policy Notes for rank_transactions
-- -----------------------------------------------------------------------------

-- The rank_transactions table maintains its original RLS policy from the
-- award-points migration, which only allows users to read their own transactions:
--   CREATE POLICY "Users can read own rank transactions"
--   ON public.rank_transactions FOR SELECT
--   USING (auth.uid() = user_id);
--
-- This RPC function uses SECURITY DEFINER to bypass RLS and aggregate data
-- for the leaderboard without exposing individual transaction details.
-- Normal users cannot SELECT directly from rank_transactions (data is protected),
-- but the RPC provides controlled access to aggregated leaderboard data only.

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
--
-- Time Windows:
-- - month: Current calendar month (e.g., Jan 1 - Jan 31)
-- - semester: Spring (Jan 1 - Jun 30) or Fall (Jul 1 - Dec 31)
-- - allTime: All time using SUM(rank_transactions.points_delta)
--
-- Security:
-- - rank_transactions table has RLS that only allows users to read their own rows
-- - This RPC uses SECURITY DEFINER to bypass RLS and aggregate data securely
-- - Normal users cannot SELECT directly from rank_transactions
-- - Leaderboard data is accessible only through this RPC
--
-- Correctness:
-- - All contexts (month, semester, allTime) sum points_delta from rank_transactions
-- - Includes both positive AND negative deltas for accurate point totals
-- - Example: +10 then -3 in a month = 7 points for that month
--
-- Display Logic:
-- - Shows users with >= 0 points (includes users at 0)
-- - Hides users with negative totals (if any exist)
-- - Rationale: Motivates participation by showing everyone at baseline or above
--
-- Performance:
-- - Existing indexes on rank_transactions(user_id) and rank_transactions(created_at)
--   should provide good query performance
--
-- Usage Example:
-- SELECT * FROM get_leaderboard_by_context('month', NULL, NULL);
-- SELECT * FROM get_leaderboard_by_context('semester', 'Computer Science', 2025);
-- SELECT * FROM get_leaderboard_by_context('allTime', NULL, NULL);
--
-- =============================================================================
