-- Migration: Points and Ranks System
-- Creates a complete points ledger, balances, rank tiers, and point rules system

-- ============================================================================
-- A) Function: compute_season_id(ts timestamptz)
-- ============================================================================
-- Returns season identifier like 'Spring_2026', 'Summer_2026', 'Fall_2026'

CREATE OR REPLACE FUNCTION public.compute_season_id(ts timestamptz)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    month_num integer;
    year_num integer;
BEGIN
    month_num := EXTRACT(MONTH FROM ts);
    year_num := EXTRACT(YEAR FROM ts);

    CASE
        WHEN month_num BETWEEN 1 AND 5 THEN
            RETURN 'Spring_' || year_num::text;
        WHEN month_num BETWEEN 6 AND 8 THEN
            RETURN 'Summer_' || year_num::text;
        ELSE -- months 9-12
            RETURN 'Fall_' || year_num::text;
    END CASE;
END;
$$;

COMMENT ON FUNCTION public.compute_season_id(timestamptz) IS
'Computes season identifier from timestamp: Spring (Jan-May), Summer (Jun-Aug), Fall (Sep-Dec)';

-- ============================================================================
-- B) Table: point_rules
-- ============================================================================
-- Defines available actions and their point values with optional rate limiting

CREATE TABLE public.point_rules (
    action_type text PRIMARY KEY,
    base_points integer NOT NULL,
    cooldown_seconds integer NULL,
    daily_cap integer NULL,
    per_event_cap integer NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.point_rules IS 'Defines point-earning actions and their rules';
COMMENT ON COLUMN public.point_rules.action_type IS 'Unique identifier for the action (e.g., event_check_in, rsvp)';
COMMENT ON COLUMN public.point_rules.base_points IS 'Points awarded for this action';
COMMENT ON COLUMN public.point_rules.cooldown_seconds IS 'Minimum seconds between earning points for same action';
COMMENT ON COLUMN public.point_rules.daily_cap IS 'Maximum points earnable per day from this action';
COMMENT ON COLUMN public.point_rules.per_event_cap IS 'Maximum times this action can earn points per event';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_point_rules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER point_rules_updated_at
    BEFORE UPDATE ON public.point_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_point_rules_updated_at();

-- ============================================================================
-- C) Table: rank_tiers
-- ============================================================================
-- Defines rank tiers and their point thresholds

CREATE TABLE public.rank_tiers (
    tier text PRIMARY KEY,
    min_points integer NOT NULL,
    sort_order integer NOT NULL
);

COMMENT ON TABLE public.rank_tiers IS 'Defines rank tiers and minimum points required';
COMMENT ON COLUMN public.rank_tiers.tier IS 'Tier name (e.g., bronze, silver, gold)';
COMMENT ON COLUMN public.rank_tiers.min_points IS 'Minimum points required to achieve this tier';
COMMENT ON COLUMN public.rank_tiers.sort_order IS 'Display order (lower = lower tier)';

-- ============================================================================
-- D) Table: points_transactions (ledger)
-- ============================================================================
-- Immutable ledger of all point transactions

CREATE TABLE public.points_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    season_id text NOT NULL DEFAULT public.compute_season_id(now()),
    action_type text NOT NULL REFERENCES public.point_rules(action_type),
    points integer NOT NULL CHECK (points <> 0),
    source_type text NOT NULL,
    source_id uuid NULL,
    idempotency_key text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.points_transactions IS 'Immutable ledger of all point transactions';
COMMENT ON COLUMN public.points_transactions.season_id IS 'Season identifier (e.g., Spring_2026)';
COMMENT ON COLUMN public.points_transactions.action_type IS 'Type of action that earned points';
COMMENT ON COLUMN public.points_transactions.source_type IS 'Source entity type (e.g., event, post, manual)';
COMMENT ON COLUMN public.points_transactions.source_id IS 'ID of the source entity (nullable for manual awards)';
COMMENT ON COLUMN public.points_transactions.idempotency_key IS 'Unique key to prevent duplicate transactions';
COMMENT ON COLUMN public.points_transactions.created_by IS 'User who created the transaction (for manual awards)';
COMMENT ON COLUMN public.points_transactions.metadata IS 'Additional transaction metadata';

-- Indexes for points_transactions
CREATE INDEX idx_points_transactions_user_created
    ON public.points_transactions(user_id, created_at DESC);

CREATE INDEX idx_points_transactions_season_user
    ON public.points_transactions(season_id, user_id);

CREATE INDEX idx_points_transactions_source
    ON public.points_transactions(source_type, source_id);

-- ============================================================================
-- E) Table: points_balances
-- ============================================================================
-- Materialized balances per user per season (updated via trigger)

CREATE TABLE public.points_balances (
    user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    season_id text NOT NULL,
    points_total integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, season_id)
);

COMMENT ON TABLE public.points_balances IS 'Aggregated point balances per user per season';

-- Index for leaderboard queries
CREATE INDEX idx_points_balances_season_points
    ON public.points_balances(season_id, points_total DESC);

-- ============================================================================
-- F) Trigger: Auto-update points_balances on transaction insert
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_points_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.points_balances (user_id, season_id, points_total, updated_at)
    VALUES (NEW.user_id, NEW.season_id, NEW.points, now())
    ON CONFLICT (user_id, season_id)
    DO UPDATE SET
        points_total = public.points_balances.points_total + NEW.points,
        updated_at = now();

    RETURN NEW;
END;
$$;

CREATE TRIGGER points_transactions_update_balance
    AFTER INSERT ON public.points_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_points_balance();

-- ============================================================================
-- G) Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_balances ENABLE ROW LEVEL SECURITY;

-- point_rules: Everyone can read (public reference data)
CREATE POLICY "point_rules_select_all" ON public.point_rules
    FOR SELECT
    USING (true);

-- rank_tiers: Everyone can read (public reference data)
CREATE POLICY "rank_tiers_select_all" ON public.rank_tiers
    FOR SELECT
    USING (true);

-- points_transactions: Users can only SELECT their own rows
CREATE POLICY "points_transactions_select_own" ON public.points_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- points_transactions: No direct INSERT from clients (must use service role or SECURITY DEFINER function)
-- Note: No INSERT policy means clients cannot insert directly

-- points_balances: Users can only SELECT their own row
CREATE POLICY "points_balances_select_own" ON public.points_balances
    FOR SELECT
    USING (auth.uid() = user_id);

-- points_balances: No direct INSERT/UPDATE from clients (managed by trigger)
-- Note: No INSERT/UPDATE policies means clients cannot modify directly

-- ============================================================================
-- H) Seed Data: rank_tiers and point_rules
-- ============================================================================

-- Insert rank tiers
INSERT INTO public.rank_tiers (tier, min_points, sort_order) VALUES
    ('bronze', 0, 1),
    ('silver', 150, 2),
    ('gold', 350, 3)
ON CONFLICT DO NOTHING;

-- Insert point rules
INSERT INTO public.point_rules (action_type, base_points, cooldown_seconds, daily_cap, per_event_cap, enabled) VALUES
    ('event_check_in', 50, NULL, NULL, 1, true),
    ('rsvp', 5, NULL, NULL, 1, true),
    ('feed_post', 5, 3600, 25, NULL, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Grants for service role (if needed for Edge Functions)
-- ============================================================================

-- Service role can do everything (default behavior, but explicit for clarity)
GRANT ALL ON public.point_rules TO service_role;
GRANT ALL ON public.rank_tiers TO service_role;
GRANT ALL ON public.points_transactions TO service_role;
GRANT ALL ON public.points_balances TO service_role;

-- Authenticated users get SELECT only (RLS will further restrict)
GRANT SELECT ON public.point_rules TO authenticated;
GRANT SELECT ON public.rank_tiers TO authenticated;
GRANT SELECT ON public.points_transactions TO authenticated;
GRANT SELECT ON public.points_balances TO authenticated;
