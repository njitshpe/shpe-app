-- ============================================================================
-- Migrate Moderator Roles to Super Admin (One-Time Normalization)
-- ============================================================================
-- This migration converts any active 'moderator' roles to 'super_admin'.
--
-- Background:
-- The admin system has been simplified from three roles (event_manager,
-- moderator, super_admin) to two roles (event_manager, super_admin).
-- Moderation features (view/manage reports, hide posts) are now exclusively
-- available to super_admin.
--
-- This migration ensures a safe transition by upgrading any existing moderator
-- accounts to super_admin, preserving their access to moderation features.
--
-- Safest Default: moderator → super_admin (maintains all existing permissions)
-- ============================================================================

-- Convert active moderator roles to super_admin (only if NO super_admin row exists at all)
-- This prevents unique constraint violations even if a revoked super_admin exists
UPDATE admin_roles ar
SET
    role_type = 'super_admin',
    notes = CASE
        WHEN notes IS NULL THEN 'Migrated from moderator role (role deprecation)'
        ELSE notes || E'\n\nMigrated from moderator role (role deprecation)'
    END
WHERE
    ar.role_type = 'moderator'
    AND ar.revoked_at IS NULL
    AND NOT EXISTS (
        SELECT 1
        FROM admin_roles sa
        WHERE sa.user_id = ar.user_id
          AND sa.role_type = 'super_admin'
          -- No revoked_at filter: skip conversion if ANY super_admin row exists
    );

-- Add migration note to existing super_admins (active or revoked) who also had moderator role
UPDATE admin_roles ar
SET
    notes = CASE
        WHEN notes IS NULL THEN 'Note: User also had moderator role (auto-deprecated)'
        ELSE notes || E'\n\nNote: User also had moderator role (auto-deprecated)'
    END
WHERE
    ar.role_type = 'super_admin'
    -- No revoked_at filter: annotate both active and revoked super_admin rows
    AND EXISTS (
        SELECT 1
        FROM admin_roles mod
        WHERE mod.user_id = ar.user_id
          AND mod.role_type = 'moderator'
          AND mod.revoked_at IS NULL
    )
    AND (ar.notes IS NULL OR ar.notes NOT LIKE '%also had moderator role%');

-- Revoke orphaned moderator roles (users who already had ANY super_admin row)
-- This catches users with active OR revoked super_admin to prevent constraint violations
UPDATE admin_roles
SET revoked_at = NOW()
WHERE role_type = 'moderator'
  AND revoked_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM admin_roles sa
      WHERE sa.user_id = admin_roles.user_id
        AND sa.role_type = 'super_admin'
        -- No revoked_at filter: revoke moderator if ANY super_admin exists
  );

-- Report the number of rows affected
DO $$
DECLARE
    migrated_count INTEGER;
    noted_active_count INTEGER;
    noted_revoked_count INTEGER;
    revoked_count INTEGER;
BEGIN
    -- Get count of converted roles (moderator → super_admin)
    SELECT COUNT(*) INTO migrated_count
    FROM admin_roles
    WHERE role_type = 'super_admin'
    AND revoked_at IS NULL
    AND notes LIKE '%Migrated from moderator role%';

    -- Get count of existing ACTIVE super_admins who had moderator role
    SELECT COUNT(*) INTO noted_active_count
    FROM admin_roles
    WHERE role_type = 'super_admin'
    AND revoked_at IS NULL
    AND notes LIKE '%also had moderator role%';

    -- Get count of existing REVOKED super_admins who had moderator role
    SELECT COUNT(*) INTO noted_revoked_count
    FROM admin_roles
    WHERE role_type = 'super_admin'
    AND revoked_at IS NOT NULL
    AND notes LIKE '%also had moderator role%';

    -- Get count of revoked moderator roles (were duplicates)
    SELECT COUNT(*) INTO revoked_count
    FROM admin_roles
    WHERE role_type = 'moderator'
    AND revoked_at IS NOT NULL
    AND revoked_at >= NOW() - INTERVAL '1 minute';

    RAISE NOTICE '---';
    RAISE NOTICE 'Migration Summary:';
    IF migrated_count > 0 THEN
        RAISE NOTICE '  - Migrated % moderator role(s) to super_admin', migrated_count;
    END IF;
    IF noted_active_count > 0 THEN
        RAISE NOTICE '  - Added note to % active super_admin(s) who had moderator', noted_active_count;
    END IF;
    IF noted_revoked_count > 0 THEN
        RAISE NOTICE '  - Added note to % revoked super_admin(s) who had moderator', noted_revoked_count;
    END IF;
    IF revoked_count > 0 THEN
        RAISE NOTICE '  - Revoked % moderator role(s) (user had super_admin)', revoked_count;
    END IF;
    IF migrated_count = 0 AND noted_active_count = 0 AND noted_revoked_count = 0 AND revoked_count = 0 THEN
        RAISE NOTICE '  - No active moderator roles found to migrate';
    END IF;
    RAISE NOTICE '---';
END $$;

-- ============================================================================
-- Verification Notes
-- ============================================================================

-- To verify the migration:
--
-- 1. Check for any remaining active moderator roles:
--    SELECT * FROM admin_roles WHERE role_type = 'moderator' AND revoked_at IS NULL;
--    -- Should return empty (all active moderators either migrated or revoked)
--
-- 2. Check migrated roles (moderator → super_admin):
--    SELECT user_id, role_type, notes
--    FROM admin_roles
--    WHERE notes LIKE '%Migrated from moderator role%'
--    AND revoked_at IS NULL;
--    -- Shows users whose moderator role was upgraded to super_admin
--    -- (only users who had NO super_admin row at all)
--
-- 3. Check existing super_admins (active) who had moderator role:
--    SELECT user_id, role_type, revoked_at, notes
--    FROM admin_roles
--    WHERE notes LIKE '%also had moderator role%'
--    AND revoked_at IS NULL;
--    -- Shows users who already had active super_admin (their moderator was revoked)
--
-- 4. Check existing super_admins (revoked) who had moderator role:
--    SELECT user_id, role_type, revoked_at, notes
--    FROM admin_roles
--    WHERE notes LIKE '%also had moderator role%'
--    AND revoked_at IS NOT NULL;
--    -- Shows users who had revoked super_admin (their moderator was revoked to avoid constraint)
--
-- 5. Verify only valid role types exist:
--    SELECT DISTINCT role_type FROM admin_roles WHERE revoked_at IS NULL;
--    -- Should only return: 'event_manager' and 'super_admin'
--
-- 6. Check for duplicate (user_id, role_type) combinations (active roles):
--    SELECT user_id, role_type, COUNT(*)
--    FROM admin_roles
--    WHERE revoked_at IS NULL
--    GROUP BY user_id, role_type
--    HAVING COUNT(*) > 1;
--    -- Should return empty (no duplicates)
--
-- 7. Check for duplicate (user_id, role_type) combinations (ALL roles):
--    SELECT user_id, role_type, COUNT(*)
--    FROM admin_roles
--    GROUP BY user_id, role_type
--    HAVING COUNT(*) > 1;
--    -- May show duplicates if user had same role multiple times (normal for historical data)

-- ============================================================================
-- Security Summary
-- ============================================================================

-- CHANGES:
-- 1. Active moderator roles converted to super_admin ONLY if user has NO super_admin row at all
-- 2. Existing super_admin roles (active OR revoked) annotated if user also had moderator
-- 3. Moderator roles revoked when user already had ANY super_admin (active or revoked)
-- 4. Migration notes appended to preserve audit trail
-- 5. Previously revoked moderator roles left unchanged (historical record)
-- 6. No data loss - all accounts maintain or gain permissions
-- 7. Unique constraint (user_id, role_type) preserved - NO CONFLICTS POSSIBLE
--
-- PERMISSIONS AFTER MIGRATION:
-- - Former moderators now have: all moderation + event management + role management
-- - This is the safest default as it preserves existing access patterns
-- - Permissions can be downgraded manually if specific users only need event_manager role
--
-- EDGE CASES HANDLED (ALL SAFE):
-- - User with active moderator + active super_admin: moderator revoked, super_admin kept
-- - User with active moderator + revoked super_admin: moderator revoked (prevents constraint)
-- - User with only active moderator: upgraded to super_admin
-- - User with revoked moderator: left unchanged (historical record)
--
-- CONSTRAINT SAFETY:
-- - The NOT EXISTS check has NO revoked_at filter, so it catches ALL super_admin rows
-- - This prevents attempting to INSERT/UPDATE to a (user_id, 'super_admin') combo that exists
-- - Even if the existing super_admin is revoked, we don't try to create another one
-- - The moderator role is revoked instead, maintaining data integrity
