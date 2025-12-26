-- Table to store allowed users for private_group creations
CREATE TABLE creation_allowed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id uuid NOT NULL REFERENCES creations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(creation_id, user_id)
);

-- Index for faster lookups
CREATE INDEX idx_creation_allowed_users_creation ON creation_allowed_users(creation_id);
CREATE INDEX idx_creation_allowed_users_user ON creation_allowed_users(user_id);

-- Enable RLS
ALTER TABLE creation_allowed_users ENABLE ROW LEVEL SECURITY;

-- Policies for creation_allowed_users
-- Owner can manage allowed users
CREATE POLICY "Owner can manage allowed users" ON creation_allowed_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = creation_allowed_users.creation_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

-- Allowed users can view their own entries
CREATE POLICY "Users can view their allowed entries" ON creation_allowed_users
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));
