-- Fix: Combine policies to avoid multiple permissive policies for same role/action
-- Drop the original admin-only read policy and create a new combined one

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Anyone can read maintenance settings" ON system_settings;
DROP POLICY IF EXISTS "Read system settings" ON system_settings;

-- Create combined policy:
-- - Anyone (anon, authenticated) can read maintenance settings
-- - Only admins can read all other settings
-- Note: Using (select auth.uid()) instead of auth.uid() for better performance
-- This prevents re-evaluation of auth.uid() for each row
CREATE POLICY "Read system settings"
  ON system_settings FOR SELECT
  TO anon, authenticated
  USING (
    -- Anyone can read maintenance settings
    key IN ('maintenance_mode', 'maintenance_message')
    OR
    -- Admins can read all settings
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );
