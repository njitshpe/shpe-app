-- Migration: Move optional/type-specific fields to profile_data JSONB column
--
-- FIELDS THAT STAY AS COLUMNS (NOT migrated):
-- - major, ucid, graduation_year (core shared fields)
-- - interests, rank_points (used for filtering/gamification)
-- - created_at, updated_at (timestamps)
--
-- FIELDS MIGRATED TO profile_data JSONB:
-- - portfolio_url, linkedin_url, phone_number (contact/social)
-- - resume_url, resume_name (resume)
-- - company, job_title, industry, degree_type (professional)
-- - mentorship_available, mentorship_ways (mentorship)

-- Step 1: Ensure profile_data column exists with default empty object
ALTER TABLE user_profiles
ALTER COLUMN profile_data SET DEFAULT '{}'::jsonb;

-- Step 2: Update existing rows to move optional fields into profile_data
-- Only update rows where profile_data is empty to avoid overwriting existing data
UPDATE user_profiles
SET profile_data = jsonb_strip_nulls(jsonb_build_object(
  -- Contact & Social
  'portfolio_url', portfolio_url,
  'linkedin_url', linkedin_url,
  'phone_number', phone_number,

  -- Resume
  'resume_url', resume_url,
  'resume_name', resume_name,

  -- Professional fields (Alumni)
  'company', company,
  'job_title', job_title,
  'industry', industry,
  'degree_type', degree_type,

  -- Mentorship fields (Alumni)
  'mentorship_available', mentorship_available,
  'mentorship_ways', mentorship_ways
))
WHERE profile_data = '{}'::jsonb OR profile_data IS NULL;

-- Step 3: Verify migration
-- Run this to check how many profiles were migrated
-- SELECT
--   COUNT(*) as total_profiles,
--   COUNT(*) FILTER (WHERE profile_data != '{}'::jsonb) as migrated_profiles,
--   COUNT(*) FILTER (WHERE profile_data = '{}'::jsonb) as empty_profiles
-- FROM user_profiles;

-- Step 4: Check sample migrated data
-- SELECT
--   id,
--   user_type,
--   first_name,
--   last_name,
--   major,
--   graduation_year,
--   profile_data,
--   linkedin_url as legacy_linkedin,
--   company as legacy_company
-- FROM user_profiles
-- WHERE profile_data != '{}'::jsonb
-- LIMIT 10;

-- Step 5: Verify specific user types
-- -- Students
-- SELECT
--   id,
--   major,
--   graduation_year,
--   ucid,
--   profile_data->>'linkedin_url' as linkedin,
--   profile_data->>'resume_url' as resume
-- FROM user_profiles
-- WHERE user_type = 'student'
-- LIMIT 5;
--
-- -- Alumni
-- SELECT
--   id,
--   major,
--   graduation_year,
--   profile_data->>'degree_type' as degree,
--   profile_data->>'company' as company,
--   profile_data->>'job_title' as job_title,
--   (profile_data->>'mentorship_available')::boolean as mentorship
-- FROM user_profiles
-- WHERE user_type = 'alumni'
-- LIMIT 5;

-- IMPORTANT: Do NOT drop the legacy columns yet!
-- The frontend has backward compatibility to read from both locations.
-- Only drop columns after verifying all data is correctly migrated
-- and the app is working as expected in production for at least 1-2 weeks.

-- Step 6 (FUTURE - DO NOT RUN YET): Drop legacy columns after thorough verification
-- -- Uncomment and run ONLY after testing in production for 1-2 weeks
-- ALTER TABLE user_profiles
-- DROP COLUMN IF EXISTS portfolio_url,
-- DROP COLUMN IF EXISTS linkedin_url,
-- DROP COLUMN IF EXISTS phone_number,
-- DROP COLUMN IF EXISTS resume_url,
-- DROP COLUMN IF EXISTS resume_name,
-- DROP COLUMN IF EXISTS company,
-- DROP COLUMN IF EXISTS job_title,
-- DROP COLUMN IF EXISTS industry,
-- DROP COLUMN IF EXISTS degree_type,
-- DROP COLUMN IF EXISTS mentorship_available,
-- DROP COLUMN IF EXISTS mentorship_ways;

-- Add comment to profile_data column
COMMENT ON COLUMN user_profiles.profile_data IS 'JSONB column containing optional/type-specific profile fields (contact, resume, professional, mentorship). Core fields like major, graduation_year, ucid remain as columns.';
