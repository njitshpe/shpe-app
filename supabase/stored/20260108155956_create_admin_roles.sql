-- Create admin_roles table for role-based access control
-- This table manages admin permissions independently from the rank/points system

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL DEFAULT 'event_manager',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, role_type)
);

-- Index for fast role lookups (only active roles)
CREATE INDEX idx_admin_roles_user_active ON admin_roles(user_id) 
  WHERE revoked_at IS NULL;

-- Index for audit queries
CREATE INDEX idx_admin_roles_granted_by ON admin_roles(granted_by);

-- Enable Row Level Security
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active admin roles (needed for UI permission checks)
CREATE POLICY "Anyone can view active admin roles"
  ON admin_roles FOR SELECT
  USING (revoked_at IS NULL);

-- Policy: Only existing admins can grant/revoke admin roles
CREATE POLICY "Admins can manage admin roles"
  ON admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Add admin tracking fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Update RLS policies for events table to allow admin mutations

-- Policy: Admins can insert events
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Policy: Admins can update events
DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Policy: Admins can delete events (soft delete by setting is_active = false)
DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update updated_at on events
DROP TRIGGER IF EXISTS events_updated_at_trigger ON events;
CREATE TRIGGER events_updated_at_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Comment on table and columns for documentation
COMMENT ON TABLE admin_roles IS 'Manages admin role assignments for eboard members and administrators';
COMMENT ON COLUMN admin_roles.role_type IS 'Type of admin role: event_manager, super_admin, etc.';
COMMENT ON COLUMN admin_roles.revoked_at IS 'When set, indicates the role has been revoked';
COMMENT ON COLUMN events.created_by IS 'User ID of the admin who created this event';
COMMENT ON COLUMN events.updated_by IS 'User ID of the admin who last updated this event';
