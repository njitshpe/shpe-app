-- =============================================================================
-- LEADERBOARD POINTS V2 - USE public.points TABLE
-- =============================================================================
-- Creates v2 RPC function to aggregate leaderboard rankings using public.points
-- instead of rank_transactions. This version uses SUM(points.amount) to calculate
-- total points for each user within the specified time window.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create RPC function for time-based leaderboard (v2 using points table)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_leaderboard_by_context_v2(
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
  WITH filtered_points AS (
    SELECT
      p.user_id,
      p.amount
    FROM public.points p
    WHERE (v_start_date IS NULL OR p.created_at >= v_start_date)
      AND (v_end_date IS NULL OR p.created_at < v_end_date)
  ),
  aggregated_points AS (
    SELECT
      fp.user_id,
      COALESCE(SUM(fp.amount), 0) as total_points
    FROM filtered_points fp
    GROUP BY fp.user_id
  )
  SELECT
    up.id,
    up.first_name,
    up.last_name,
    up.user_type,
    up.major,
    up.graduation_year,
    up.profile_picture_url,
    up.rank_points,
    up.created_at
  FROM public.user_profiles up
  LEFT JOIN aggregated_points ap ON up.id = ap.user_id
  WHERE up.first_name IS NOT NULL
    AND up.last_name IS NOT NULL
    AND up.user_type IS NOT NULL
    -- Apply major filter if provided
    AND (p_major IS NULL OR up.major = p_major)
    -- Apply class year filter if provided
    AND (
      p_class_year IS NULL
      OR up.graduation_year = p_class_year
    )
    AND COALESCE(ap.total_points, 0) >= 0 -- Show users with zero or positive points
  ORDER BY COALESCE(ap.total_points, 0) DESC, up.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_leaderboard_by_context_v2 IS 'Get leaderboard rankings filtered by time context (month, semester, allTime) and optional major/class year filters. V2 uses public.points table instead of rank_transactions. Uses SECURITY DEFINER to allow all authenticated users to read leaderboard data.';

-- -----------------------------------------------------------------------------
-- 2. Grant execute permission to authenticated users
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.get_leaderboard_by_context_v2(text, text, integer) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RLS Policy Notes for points table
-- -----------------------------------------------------------------------------

-- The points table maintains its RLS policy from the award-points migration,
-- which only allows users to read their own points:
--   CREATE POLICY "Users can read own points"
--   ON public.points FOR SELECT
--   USING (auth.uid() = user_id);
--
-- This RPC function uses SECURITY DEFINER to bypass RLS and aggregate data
-- for the leaderboard without exposing individual transaction details.
-- Normal users cannot SELECT directly from points (data is protected),
-- but the RPC provides controlled access to aggregated leaderboard data only.

-- =============================================================================
-- VERIFICATION QUERIES - Compare v1 vs v2 Results (Top 20)
-- =============================================================================

-- Month
-- SELECT * FROM public.get_leaderboard_by_context('month', NULL, NULL) LIMIT 20;
-- SELECT * FROM public.get_leaderboard_by_context_v2('month', NULL, NULL) LIMIT 20;

-- Semester
-- SELECT * FROM public.get_leaderboard_by_context('semester', NULL, NULL) LIMIT 20;
-- SELECT * FROM public.get_leaderboard_by_context_v2('semester', NULL, NULL) LIMIT 20;

-- All Time
-- SELECT * FROM public.get_leaderboard_by_context('allTime', NULL, NULL) LIMIT 20;
-- SELECT * FROM public.get_leaderboard_by_context_v2('allTime', NULL, NULL) LIMIT 20;
