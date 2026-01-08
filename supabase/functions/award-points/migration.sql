-- =============================================================================
-- POINTS & RANK SYSTEM MIGRATION
-- =============================================================================
-- Copy and paste this SQL into the Supabase SQL Editor.
-- 
-- This migration adds:
-- 1. points table for tracking point transactions (per award-points README)
-- 2. rank_points and rank columns to user_profiles
-- 3. rank_rules table for data-driven rule configuration
-- 4. rank_transactions table for audit trail
-- 
-- Assumptions:
-- - Canonical profile table is user_profiles (adjust if different)
-- - Committee membership will be passed via metadata.committee_member for MVP
--   TODO: Add committee_member column to user_profiles or create committee_members table
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create points table for transaction records
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid,
  amount integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT points_pkey PRIMARY KEY (id),
  CONSTRAINT points_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT points_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS points_user_id_idx ON public.points (user_id);

-- Index for event-based queries
CREATE INDEX IF NOT EXISTS points_event_id_idx ON public.points (event_id);

-- Unique constraint to prevent duplicate awards per event/action
CREATE UNIQUE INDEX IF NOT EXISTS points_unique_award_idx 
ON public.points (user_id, event_id, reason) 
WHERE event_id IS NOT NULL;

COMMENT ON TABLE public.points IS 'Transaction log for all points awarded. One record per award action.';

-- -----------------------------------------------------------------------------
-- 2. Add rank columns to user_profiles
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS rank_points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank text DEFAULT 'unranked';

-- Add CHECK constraint for valid rank values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_rank_check'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_rank_check
    CHECK (rank IS NULL OR rank IN ('unranked', 'bronze', 'silver', 'gold'));
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.rank_points IS 'Accumulated rank points (0-100). Used to determine rank tier.';
COMMENT ON COLUMN public.user_profiles.rank IS 'Current rank tier: unranked (0-24), bronze (25-49), silver (50-74), gold (75+)';

-- -----------------------------------------------------------------------------
-- 3. Create rank_rules table for data-driven rule configuration
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rank_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  rules jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT rank_rules_pkey PRIMARY KEY (id),
  CONSTRAINT rank_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Ensure only one active rule set at a time
CREATE UNIQUE INDEX IF NOT EXISTS rank_rules_active_unique 
ON public.rank_rules (active) 
WHERE active = true;

COMMENT ON TABLE public.rank_rules IS 'Versioned rule sets for point calculations. Only one can be active at a time.';
COMMENT ON COLUMN public.rank_rules.rules IS 'JSONB containing rule definitions. Schema: { version: string, rules: RuleDefinition[] }';

-- -----------------------------------------------------------------------------
-- 4. Create rank_transactions table for audit trail
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  points_delta integer NOT NULL,
  previous_points integer NOT NULL,
  new_points integer NOT NULL,
  previous_rank text,
  new_rank text,
  rank_changed boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT rank_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT rank_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS rank_transactions_user_id_idx ON public.rank_transactions (user_id);
CREATE INDEX IF NOT EXISTS rank_transactions_action_type_idx ON public.rank_transactions (action_type);
CREATE INDEX IF NOT EXISTS rank_transactions_created_at_idx ON public.rank_transactions (created_at DESC);

COMMENT ON TABLE public.rank_transactions IS 'Audit log for all rank point changes. Every point award creates a record.';

-- -----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------

-- Enable RLS on new tables
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_transactions ENABLE ROW LEVEL SECURITY;

-- points: Users can read their own points
CREATE POLICY "Users can read own points"
ON public.points FOR SELECT
USING (auth.uid() = user_id);

-- rank_rules: Anyone can read active rules
CREATE POLICY "Anyone can read active rank rules"
ON public.rank_rules FOR SELECT
USING (active = true);

-- rank_transactions: Users can read their own transactions
CREATE POLICY "Users can read own rank transactions"
ON public.rank_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE on all tables done via service role in Edge Functions

-- -----------------------------------------------------------------------------
-- 6. Insert default rule set (v1) - aligned with award-points README
-- -----------------------------------------------------------------------------

INSERT INTO public.rank_rules (name, version, active, rules)
VALUES (
  'MVP Rules v1',
  '1.0.0',
  true,
  '{
    "version": "1.0.0",
    "rules": [
      {
        "action_type": "attendance",
        "base_points": 10,
        "enabled": true
      },
      {
        "action_type": "feedback",
        "base_points": 5,
        "enabled": true
      },
      {
        "action_type": "photo_upload",
        "base_points": 5,
        "enabled": true,
        "multipliers": [
          { "field": "photoType", "operator": "eq", "value": "alumni", "multiplier": 2 },
          { "field": "photoType", "operator": "eq", "value": "professional", "multiplier": 3 },
          { "field": "photoType", "operator": "eq", "value": "member_of_month", "multiplier": 4 }
        ]
      },
      {
        "action_type": "rsvp",
        "base_points": 3,
        "enabled": true
      },
      {
        "action_type": "early_checkin",
        "base_points": 5,
        "enabled": true,
        "multipliers": [
          { "field": "minutes_early", "operator": "gte", "value": 15, "multiplier": 1.5 }
        ]
      },
      {
        "action_type": "verified",
        "base_points": 10,
        "enabled": true
      },
      {
        "action_type": "college_year",
        "base_points": 5,
        "enabled": true,
        "multipliers": [
          { "field": "college_year", "operator": "eq", "value": 1, "multiplier": 1.2 },
          { "field": "college_year", "operator": "eq", "value": 4, "multiplier": 1.5 }
        ]
      },
      {
        "action_type": "committee_setup",
        "base_points": 10,
        "enabled": true,
        "requires_committee_for_rank": true
      }
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Helper function to get rank from points
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_rank_from_points(points integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF points >= 75 THEN RETURN 'gold';
  ELSIF points >= 50 THEN RETURN 'silver';
  ELSIF points >= 25 THEN RETURN 'bronze';
  ELSE RETURN 'unranked';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_rank_from_points IS 'Calculate rank tier from points. Thresholds: unranked (0-24), bronze (25-49), silver (50-74), gold (75+)';

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
-- 
-- Point Values (from award-points README):
-- - Attendance: 10 points (event check-in)
-- - Feedback: 5 points (post-event survey)
-- - Photo Upload: 5 points base
--   - Photo w/ Alumni: 10 points (2x multiplier)
--   - Photo w/ Professional: 15 points (3x multiplier)
--   - Photo w/ Member of Month: 20 points (4x multiplier)
-- - RSVP: 3 points
-- - Early Check-in: 5 points (7 with 15+ min early)
-- - Verified: 10 points
-- - Committee Setup: 10 points (rank change requires committee_member=true)
--
-- TODO (Follow-up PRs):
-- 1. Add committee_member boolean to user_profiles OR create committee_members table
-- 2. When done, update Edge Function to prefer DB-derived membership over metadata
--
-- Deployment:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Deploy Edge Function: supabase functions deploy award-points
-- 3. Verify with test curl requests (see README.md)
--
-- =============================================================================
