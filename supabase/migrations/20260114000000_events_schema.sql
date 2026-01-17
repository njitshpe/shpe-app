-- Events Table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE, -- QR friendly ID
  name text NOT NULL,
  description text,
  
  -- Time & Status
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  
  -- Location & Geofencing
  location_name text,
  location_address text,
  latitude numeric,
  longitude numeric,

  -- Media & Metadata
  cover_image_url text,
  tags text[] DEFAULT '{}',
  
  -- Registration
  registration_questions jsonb DEFAULT '[]'::jsonb, -- Array of questions
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Attendance Table
CREATE TABLE public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lifecycle
  status text DEFAULT 'confirmed', -- 'confirmed', 'pending', 'waitlist', etc.
  rsvp_at timestamptz,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  
  -- Registration Answers
  registration_answers jsonb DEFAULT '{}'::jsonb,
  
  UNIQUE(event_id, user_id)
);

-- RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- Events Policies
CREATE POLICY "Authenticated users can view active events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Admins can view ALL events (including inactive/deleted)
CREATE POLICY "Admins can view all events"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Attendance Policies
CREATE POLICY "Users can view own attendance"
  ON public.event_attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own attendance"
  ON public.event_attendance FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attendance"
  ON public.event_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND revoked_at IS NULL
    )
  );

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_handle_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();