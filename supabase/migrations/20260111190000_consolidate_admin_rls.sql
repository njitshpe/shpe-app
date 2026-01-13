-- ============================================================================
-- Consolidate Admin RLS Policies (Final Version)
-- ============================================================================
-- This migration consolidates all admin RLS fixes into one clean migration:
-- 1. Removes ALL existing admin_roles policies and creates final set
-- 2. Adds admin policies for reports table (with table existence check)
-- 3. Adds admin policies for feed_posts table (with table existence check)
-- 4. Ensures no recursion issues and no client-side role management
-- ============================================================================

-- ============================================================================
-- Part 1: Clean up admin_roles policies (remove ALL existing, add final set)
-- ============================================================================

-- Drop ALL existing admin_roles policies to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users can manage admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Only admins can manage admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can read their own role" ON admin_roles;
DROP POLICY IF EXISTS "Allow admins to read their own role" ON admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON admin_roles;
DROP POLICY IF EXISTS "Users can read their own admin role" ON admin_roles;
DROP POLICY IF EXISTS "Anyone can view active admin roles" ON admin_roles;

-- Create final policy: users can ONLY read their own admin role
-- This allows AdminService to check admin status without exposing all admin info
CREATE POLICY "Users can read their own admin role"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- IMPORTANT: No INSERT/UPDATE/DELETE policies on admin_roles
-- Admin role management MUST be done via:
-- 1. Service role (Supabase Studio)
-- 2. Edge function with service role (manage-admin-roles)
-- This prevents:
-- - Recursion issues (querying admin_roles inside its own policy)
-- - Client-side privilege escalation
-- - Unauthorized role grants

-- ============================================================================
-- Part 2: Add admin policies for reports table (if exists)
-- ============================================================================

DO $$
BEGIN
    -- Check if reports table exists
    IF to_regclass('public.reports') IS NOT NULL THEN
        -- Drop existing policies to prevent duplicates
        DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
        DROP POLICY IF EXISTS "Admins can update all reports" ON reports;

        -- Allow super admins to view ALL reports (not just their own)
        CREATE POLICY "Admins can view all reports"
          ON reports
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM admin_roles
              WHERE user_id = auth.uid()
              AND role_type = 'super_admin'
              AND revoked_at IS NULL
            )
          );

        -- Allow super admins to update ALL reports (change status, mark as resolved)
        CREATE POLICY "Admins can update all reports"
          ON reports
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM admin_roles
              WHERE user_id = auth.uid()
              AND role_type = 'super_admin'
              AND revoked_at IS NULL
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM admin_roles
              WHERE user_id = auth.uid()
              AND role_type = 'super_admin'
              AND revoked_at IS NULL
            )
          );

        RAISE NOTICE 'Admin policies created for reports table';
    ELSE
        RAISE NOTICE 'Reports table does not exist, skipping admin policies';
    END IF;
END $$;

-- Note: Existing "Users can view their own reports" policy remains
-- so regular users can check the status of reports they submitted

-- ============================================================================
-- Part 3: Add admin policies for feed_posts table (if exists)
-- ============================================================================

DO $$
BEGIN
    -- Check if feed_posts table exists
    IF to_regclass('public.feed_posts') IS NOT NULL THEN
        -- Drop existing policies to prevent duplicates
        DROP POLICY IF EXISTS "Admins can update any post" ON feed_posts;
        DROP POLICY IF EXISTS "Admins can view all posts including hidden" ON feed_posts;
        DROP POLICY IF EXISTS "Anyone can view active posts" ON feed_posts;
        DROP POLICY IF EXISTS "Anyone can view active non-hidden posts" ON feed_posts;

        -- Allow super admins to update ANY post (needed to set is_hidden = true)
        CREATE POLICY "Admins can update any post"
          ON feed_posts
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM admin_roles
              WHERE user_id = auth.uid()
              AND role_type = 'super_admin'
              AND revoked_at IS NULL
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM admin_roles
              WHERE user_id = auth.uid()
              AND role_type = 'super_admin'
              AND revoked_at IS NULL
            )
          );

        -- Allow super admins to view all posts including hidden ones (for moderation)
        CREATE POLICY "Admins can view all posts including hidden"
          ON feed_posts
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM admin_roles
              WHERE user_id = auth.uid()
              AND role_type = 'super_admin'
              AND revoked_at IS NULL
            )
          );

        -- Public SELECT policy: exclude hidden posts
        -- Use COALESCE to handle NULL values (treat NULL as false)
        CREATE POLICY "Anyone can view active non-hidden posts"
          ON feed_posts
          FOR SELECT
          TO public
          USING (is_active = true AND COALESCE(is_hidden, false) = false);

        RAISE NOTICE 'Admin policies created for feed_posts table';
    ELSE
        RAISE NOTICE 'feed_posts table does not exist, skipping admin policies';
    END IF;
END $$;

-- Note: Admin policies work alongside user policies (PERMISSIVE mode combines with OR)
-- - Regular users see: is_active = true AND is_hidden = false
-- - Admins see: all posts (both conditions combined with OR)
-- - Users can still update their own posts via "Users can update their own posts" policy

-- ============================================================================
-- Verification Notes
-- ============================================================================

-- To verify policies are working correctly:
--
-- 1. Verify admin_roles has only one SELECT policy:
--    SELECT policyname FROM pg_policies WHERE tablename = 'admin_roles';
--    -- Should return only: "Users can read their own admin role"
--
-- 2. Check admin can see all reports:
--    SELECT COUNT(*) FROM reports; -- Should return total count for admins
--
-- 3. Check regular user sees only their reports:
--    SELECT COUNT(*) FROM reports; -- Should return only reports where reporter_id = auth.uid()
--
-- 4. Check admin can update any report:
--    UPDATE reports SET status = 'reviewing' WHERE id = '<some_report_id>';
--
-- 5. Check admin can hide posts:
--    UPDATE feed_posts SET is_hidden = true WHERE id = '<some_post_id>';
--
-- 6. Check hidden posts don't appear to regular users:
--    SELECT * FROM feed_posts WHERE is_hidden = true; -- Should be empty for non-admins
--
-- 7. Verify admin role management requires service role:
--    INSERT INTO admin_roles (user_id, role_type) VALUES (auth.uid(), 'super_admin');
--    -- Should fail with permission denied (no INSERT policy exists)

-- ============================================================================
-- Security Summary
-- ============================================================================

-- SECURITY IMPROVEMENTS:
-- 1. Removed ALL policies that allow client-side admin role management
-- 2. Removed recursion-causing "Only admins can manage admin roles" policy
-- 3. Admin role management now REQUIRES service role (via Studio or edge function)
-- 4. Admins can view and update all reports (moderation screen works)
-- 5. Admins can hide inappropriate posts
-- 6. Hidden posts are excluded from public view
-- 7. No duplicate policies (all drops use IF EXISTS)
-- 8. Table existence checks prevent migration failures

-- ADMIN ROLE MANAGEMENT:
-- The ONLY ways to manage admin roles are:
-- 1. Direct SQL with service role in Supabase Studio
-- 2. Edge function: manage-admin-roles (uses service role internally)
-- 3. Manual SQL scripts with service role credentials

-- FIRST ADMIN BOOTSTRAP:
-- The first admin must be created manually:
-- INSERT INTO admin_roles (user_id, role_type, notes)
-- VALUES ('<user-uuid>', 'super_admin', 'Initial admin - manually created');
