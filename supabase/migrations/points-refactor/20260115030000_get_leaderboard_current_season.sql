-- Migration: get_leaderboard_current_season RPC
-- Returns paginated leaderboard for the current season with optional filters

-- ============================================================================
-- Function: public.get_leaderboard_current_season
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard_current_season(
    p_major text DEFAULT NULL,
    p_class_year integer DEFAULT NULL,
    p_user_type text DEFAULT NULL,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    user_id uuid,
    first_name text,
    last_name text,
    user_type text,
    major text,
    graduation_year integer,
    profile_picture_url text,
    season_id text,
    points_total integer,
    tier text,
    rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_season_id text;
BEGIN
    -- ========================================================================
    -- 1) Compute current season
    -- ========================================================================
    v_season_id := public.compute_season_id(now());

    -- ========================================================================
    -- 2) Return leaderboard with filters, tier, and rank
    -- ========================================================================
    RETURN QUERY
    WITH ranked_users AS (
        SELECT
            pb.user_id,
            up.first_name,
            up.last_name,
            up.user_type,
            up.major,
            up.graduation_year,
            up.profile_picture_url,
            pb.season_id,
            pb.points_total,
            -- Determine tier via LEFT JOIN LATERAL
            tier_lookup.tier AS tier,
            -- Compute rank using DENSE_RANK: users with same points get same rank
            DENSE_RANK() OVER (
                ORDER BY pb.points_total DESC, up.created_at ASC
            )::integer AS rank
        FROM public.points_balances pb
        INNER JOIN public.user_profiles up ON up.id = pb.user_id
        LEFT JOIN LATERAL (
            SELECT rt.tier
            FROM public.rank_tiers rt
            WHERE rt.min_points <= pb.points_total
            ORDER BY rt.min_points DESC
            LIMIT 1
        ) tier_lookup ON true
        WHERE pb.season_id = v_season_id
          -- Exclude incomplete profiles
          AND up.first_name IS NOT NULL
          AND up.last_name IS NOT NULL
          AND up.user_type IS NOT NULL
          -- Exclude zero or negative points
          AND pb.points_total > 0
          -- Optional filters
          AND (p_major IS NULL OR up.major = p_major)
          AND (p_class_year IS NULL OR up.graduation_year = p_class_year)
          AND (p_user_type IS NULL OR up.user_type = p_user_type)
    )
    SELECT
        ru.user_id,
        ru.first_name,
        ru.last_name,
        ru.user_type,
        ru.major,
        ru.graduation_year,
        ru.profile_picture_url,
        ru.season_id,
        ru.points_total,
        COALESCE(ru.tier, 'unranked') AS tier,
        ru.rank
    FROM ranked_users ru
    ORDER BY ru.rank ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.get_leaderboard_current_season(text, integer, text, integer, integer) IS
'Returns paginated leaderboard for current season. Supports filtering by major, class_year (graduation_year), and user_type. Excludes incomplete profiles and users with zero points. Uses DENSE_RANK for ranking.';

-- ============================================================================
-- Grants
-- ============================================================================

-- Only authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.get_leaderboard_current_season(text, integer, text, integer, integer) TO authenticated;

-- Revoke from public/anon for safety
REVOKE EXECUTE ON FUNCTION public.get_leaderboard_current_season(text, integer, text, integer, integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard_current_season(text, integer, text, integer, integer) FROM anon;
