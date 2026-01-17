-- Migration: award_points RPC
-- SECURITY DEFINER function to award points with anti-abuse enforcement

-- ============================================================================
-- Function: public.award_points
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_points(
    p_action_type text,
    p_source_type text,
    p_idempotency_key text,
    p_source_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    season_id text,
    points_total integer,
    tier text,
    points_to_next_tier integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_season_id text;
    v_base_points integer;
    v_cooldown_seconds integer;
    v_daily_cap integer;
    v_per_event_cap integer;
    v_enabled boolean;
    v_last_action_at timestamptz;
    v_event_action_count integer;
    v_daily_points_sum integer;
    v_points_total integer;
    v_tier text;
    v_next_tier_min integer;
    v_points_to_next integer;
BEGIN
    -- ========================================================================
    -- 1) Input validation
    -- ========================================================================
    IF p_action_type IS NULL OR TRIM(p_action_type) = '' THEN
        RAISE EXCEPTION 'p_action_type cannot be null or empty';
    END IF;

    IF p_source_type IS NULL OR TRIM(p_source_type) = '' THEN
        RAISE EXCEPTION 'p_source_type cannot be null or empty';
    END IF;

    IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'p_idempotency_key cannot be null or empty';
    END IF;

    -- ========================================================================
    -- 2) Determine acting user
    -- ========================================================================
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: auth.uid() is NULL';
    END IF;

    -- ========================================================================
    -- 3) Compute season
    -- ========================================================================
    v_season_id := public.compute_season_id(now());

    -- ========================================================================
    -- 4) Load point rule
    -- ========================================================================
    SELECT
        pr.base_points,
        pr.cooldown_seconds,
        pr.daily_cap,
        pr.per_event_cap,
        pr.enabled
    INTO
        v_base_points,
        v_cooldown_seconds,
        v_daily_cap,
        v_per_event_cap,
        v_enabled
    FROM public.point_rules pr
    WHERE pr.action_type = p_action_type;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unknown action_type: %', p_action_type;
    END IF;

    IF v_enabled = false THEN
        RAISE EXCEPTION 'Action type "%" is disabled', p_action_type;
    END IF;

    IF v_base_points IS NULL OR v_base_points = 0 THEN
        RAISE EXCEPTION 'Action type "%" has invalid base_points (must be non-zero)', p_action_type;
    END IF;

    -- ========================================================================
    -- 6) Anti-abuse enforcement (BEFORE insert)
    -- ========================================================================

    -- per_event_cap check (scoped by source_type and source_id)
    IF v_per_event_cap IS NOT NULL AND p_source_id IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_event_action_count
        FROM public.points_transactions pt
        WHERE pt.user_id = v_user_id
          AND pt.season_id = v_season_id
          AND pt.action_type = p_action_type
          AND pt.source_type = p_source_type
          AND pt.source_id = p_source_id;

        IF v_event_action_count >= v_per_event_cap THEN
            RAISE EXCEPTION 'Per-event cap reached: action "%" for source_id "%" (limit: %)',
                p_action_type, p_source_id, v_per_event_cap;
        END IF;
    END IF;

    -- cooldown_seconds check
    IF v_cooldown_seconds IS NOT NULL THEN
        SELECT MAX(pt.created_at)
        INTO v_last_action_at
        FROM public.points_transactions pt
        WHERE pt.user_id = v_user_id
          AND pt.season_id = v_season_id
          AND pt.action_type = p_action_type;

        IF v_last_action_at IS NOT NULL
           AND now() - v_last_action_at < (v_cooldown_seconds || ' seconds')::interval THEN
            RAISE EXCEPTION 'Cooldown active: action "%" requires % seconds between awards',
                p_action_type, v_cooldown_seconds;
        END IF;
    END IF;

    -- daily_cap check (only count positive points to prevent gaming)
    IF v_daily_cap IS NOT NULL THEN
        SELECT COALESCE(SUM(GREATEST(pt.points, 0)), 0)
        INTO v_daily_points_sum
        FROM public.points_transactions pt
        WHERE pt.user_id = v_user_id
          AND pt.season_id = v_season_id
          AND pt.action_type = p_action_type
          AND pt.created_at >= date_trunc('day', now())
          AND pt.created_at < date_trunc('day', now()) + interval '1 day';

        IF v_daily_points_sum + v_base_points > v_daily_cap THEN
            RAISE EXCEPTION 'Daily cap exceeded: action "%" allows % points/day (current: %, attempted: %)',
                p_action_type, v_daily_cap, v_daily_points_sum, v_base_points;
        END IF;
    END IF;

    -- ========================================================================
    -- 5) Insert transaction (with idempotency handling)
    -- ========================================================================
    BEGIN
        INSERT INTO public.points_transactions (
            user_id,
            season_id,
            action_type,
            points,
            source_type,
            source_id,
            idempotency_key,
            metadata
        ) VALUES (
            v_user_id,
            v_season_id,
            p_action_type,
            v_base_points,
            p_source_type,
            p_source_id,
            p_idempotency_key,
            COALESCE(p_metadata, '{}'::jsonb)
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Idempotency: transaction already exists, continue to return current summary
            NULL;
    END;

    -- ========================================================================
    -- 7) Build return values
    -- ========================================================================

    -- Get current points balance
    SELECT pb.points_total
    INTO v_points_total
    FROM public.points_balances pb
    WHERE pb.user_id = v_user_id
      AND pb.season_id = v_season_id;

    IF NOT FOUND THEN
        v_points_total := 0;
    END IF;

    -- Determine current tier
    SELECT rt.tier
    INTO v_tier
    FROM public.rank_tiers rt
    WHERE rt.min_points <= v_points_total
    ORDER BY rt.min_points DESC
    LIMIT 1;

    IF NOT FOUND THEN
        v_tier := 'unranked';
    END IF;

    -- Calculate points to next tier
    SELECT rt.min_points
    INTO v_next_tier_min
    FROM public.rank_tiers rt
    WHERE rt.min_points > v_points_total
    ORDER BY rt.min_points ASC
    LIMIT 1;

    IF FOUND THEN
        v_points_to_next := v_next_tier_min - v_points_total;
    ELSE
        v_points_to_next := 0;
    END IF;

    -- Return the summary
    RETURN QUERY SELECT
        v_season_id,
        v_points_total,
        v_tier,
        v_points_to_next;
END;
$$;

COMMENT ON FUNCTION public.award_points(text, text, text, uuid, jsonb) IS
'Awards points to the authenticated user for a given action. Enforces anti-abuse rules (per_event_cap, cooldown_seconds, daily_cap). Uses idempotency_key to prevent duplicate awards. Returns current season balance, tier, and points to next tier.';

-- ============================================================================
-- Grants
-- ============================================================================

-- Only authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.award_points(text, text, text, uuid, jsonb) TO authenticated;

-- Revoke from public/anon for safety
REVOKE EXECUTE ON FUNCTION public.award_points(text, text, text, uuid, jsonb) FROM public;
REVOKE EXECUTE ON FUNCTION public.award_points(text, text, text, uuid, jsonb) FROM anon;
