-- Migration: Lock down push_token on user_profiles via column-level privileges
--
-- Problem: push_token is stored in user_profiles, which is publicly readable.
-- Anyone with the anon key can SELECT * and harvest every user's Expo push token.
--
-- Fix: Revoke table-level SELECT, then grant column-level SELECT on every
-- column EXCEPT push_token. The service_role (Edge Functions) keeps full access.

-- 1. Revoke table-level SELECT (stops the SELECT * leak of push_token)
REVOKE SELECT ON public.user_profiles FROM public;
REVOKE SELECT ON public.user_profiles FROM anon;
REVOKE SELECT ON public.user_profiles FROM authenticated;

-- 2. Service role keeps full access (Edge Functions, admin operations)
GRANT SELECT ON public.user_profiles TO service_role;

-- 3. Grant column-level SELECT to anon and authenticated (everything EXCEPT push_token)
--    Legacy columns (linkedin_url, portfolio_url, etc.) have already been dropped.
GRANT SELECT (
    id,
    user_type,
    first_name,
    last_name,
    bio,
    interests,
    profile_picture_url,
    university,
    major,
    graduation_year,
    ucid,
    profile_data,
    created_at,
    updated_at
) ON public.user_profiles TO anon, authenticated;

-- 4. Authenticated users must still be able to write their own push_token
GRANT UPDATE (push_token) ON public.user_profiles TO authenticated;

-- 5. Tell PostgREST to reload its schema cache so the new grants take effect
NOTIFY pgrst, 'reload schema';
