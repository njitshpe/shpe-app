-- Migration: Add get_current_season_id RPC
-- Returns current season identifier using compute_season_id(now())

CREATE OR REPLACE FUNCTION public.get_current_season_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT public.compute_season_id(now());
$$;

COMMENT ON FUNCTION public.get_current_season_id() IS
'Returns current season identifier using compute_season_id(now())';
