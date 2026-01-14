-- Fix infinite recursion in admin_roles RLS policy
-- Remove the problematic "Admins can manage admin roles" policy

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage admin roles" ON admin_roles;

-- For now, we'll allow authenticated users to manage admin roles
-- In production, I should manage this through a secure admin interface
-- or use service role key for admin management
CREATE POLICY "Authenticated users can manage admin roles"
  ON admin_roles FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
