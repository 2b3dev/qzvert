-- Create system_settings table for admin configuration
-- This table stores key-value pairs for system settings

CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for fast key lookup
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('site_name', '"QzVert"', 'Name of the site'),
  ('site_description', '"AI-powered Learning Platform"', 'Description of the site'),
  ('maintenance_mode', 'false', 'Whether the site is in maintenance mode'),
  ('maintenance_message', '"We are currently performing maintenance. Please check back soon."', 'Message shown during maintenance'),
  ('max_activities_per_user', '100', 'Maximum activities a user can create'),
  ('max_questions_per_activity', '50', 'Maximum questions per activity'),
  ('max_file_upload_size_mb', '5', 'Maximum file upload size in MB'),
  ('ai_credits_per_user', '100', 'AI credits given to new users'),
  ('ai_credits_per_generation', '10', 'AI credits consumed per generation'),
  ('enable_public_activities', 'true', 'Allow users to publish activities publicly'),
  ('enable_user_registration', 'true', 'Allow new user registrations'),
  ('enable_ai_generation', 'true', 'Enable AI-powered content generation'),
  ('require_email_verification', 'false', 'Require email verification before using platform');

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read settings
-- Note: Using (SELECT auth.uid()) for better performance (prevents re-evaluation per row)
CREATE POLICY "Admins can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update settings
CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert settings
CREATE POLICY "Admins can insert system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete settings
CREATE POLICY "Admins can delete system settings"
  ON system_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();
