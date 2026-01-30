-- Secure admin_roles RLS policy
-- This fixes the security vulnerability where any authenticated user could manage admin roles
-- CRITICAL: This prevents privilege escalation attacks

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage admin roles" ON admin_roles;

-- Create a more secure policy that only allows existing admins to grant/revoke roles
-- This prevents non-admins from granting themselves admin privileges
CREATE POLICY "Only admins can manage admin roles"
  ON admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Note: The first admin must be added via SQL or service role key
-- Example: INSERT INTO admin_roles (user_id, role_type, granted_by)
--          VALUES ('first-admin-uuid', 'super_admin', NULL);
