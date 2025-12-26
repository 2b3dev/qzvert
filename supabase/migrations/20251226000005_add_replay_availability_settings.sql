-- Migration: Add replay and availability settings for activities
-- This adds:
-- 1. replay_limit column on activities (null = unlimited)
-- 2. available_from / available_until columns for scheduling
-- 3. activity_play_records table to track plays per user
-- 4. RLS policies for the new table

-- ============================================================
-- STEP 1: Add new columns to activities table
-- ============================================================

-- Replay limit: null = unlimited, 1 = once only, n = max n times
ALTER TABLE activities ADD COLUMN replay_limit integer DEFAULT NULL;

-- Availability window: both null = always available
ALTER TABLE activities ADD COLUMN available_from timestamptz DEFAULT NULL;
ALTER TABLE activities ADD COLUMN available_until timestamptz DEFAULT NULL;

-- ============================================================
-- STEP 2: Create activity_play_records table
-- ============================================================

CREATE TABLE activity_play_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now(),
  score integer,
  duration_seconds integer,
  completed boolean DEFAULT false
);

-- Create indexes for efficient queries
CREATE INDEX idx_play_records_activity_id ON activity_play_records(activity_id);
CREATE INDEX idx_play_records_user_id ON activity_play_records(user_id);
CREATE INDEX idx_play_records_activity_user ON activity_play_records(activity_id, user_id);

-- ============================================================
-- STEP 3: Enable RLS on the new table
-- ============================================================

ALTER TABLE activity_play_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own play records
CREATE POLICY "Users can view own play records"
  ON activity_play_records FOR SELECT
  USING (auth.uid() = user_id);

-- Creators can view all play records for their activities
CREATE POLICY "Creators can view play records for own activities"
  ON activity_play_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_play_records.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- Users can insert their own play records
CREATE POLICY "Users can insert own play records"
  ON activity_play_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own play records (for marking completed, updating score)
CREATE POLICY "Users can update own play records"
  ON activity_play_records FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- STEP 4: Create helper function to check if user can play
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_user_play_activity(
  p_activity_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity record;
  v_play_count integer;
  v_result jsonb;
BEGIN
  -- Get activity settings
  SELECT replay_limit, available_from, available_until
  INTO v_activity
  FROM activities
  WHERE id = p_activity_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_play', false, 'reason', 'activity_not_found');
  END IF;

  -- Check availability window
  IF v_activity.available_from IS NOT NULL AND now() < v_activity.available_from THEN
    RETURN jsonb_build_object(
      'can_play', false,
      'reason', 'not_yet_available',
      'available_from', v_activity.available_from
    );
  END IF;

  IF v_activity.available_until IS NOT NULL AND now() > v_activity.available_until THEN
    RETURN jsonb_build_object(
      'can_play', false,
      'reason', 'expired',
      'available_until', v_activity.available_until
    );
  END IF;

  -- If replay_limit is null, unlimited plays allowed
  IF v_activity.replay_limit IS NULL THEN
    RETURN jsonb_build_object('can_play', true, 'reason', 'unlimited');
  END IF;

  -- Count user's completed plays
  SELECT COUNT(*)
  INTO v_play_count
  FROM activity_play_records
  WHERE activity_id = p_activity_id
    AND user_id = p_user_id
    AND completed = true;

  IF v_play_count >= v_activity.replay_limit THEN
    RETURN jsonb_build_object(
      'can_play', false,
      'reason', 'replay_limit_reached',
      'plays_used', v_play_count,
      'replay_limit', v_activity.replay_limit
    );
  END IF;

  RETURN jsonb_build_object(
    'can_play', true,
    'reason', 'within_limit',
    'plays_used', v_play_count,
    'plays_remaining', v_activity.replay_limit - v_play_count
  );
END;
$$;

-- ============================================================
-- STEP 5: Create function to record a play
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_activity_play(
  p_activity_id uuid,
  p_user_id uuid,
  p_score integer DEFAULT NULL,
  p_duration_seconds integer DEFAULT NULL,
  p_completed boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record_id uuid;
BEGIN
  INSERT INTO activity_play_records (activity_id, user_id, score, duration_seconds, completed)
  VALUES (p_activity_id, p_user_id, p_score, p_duration_seconds, p_completed)
  RETURNING id INTO v_record_id;

  RETURN v_record_id;
END;
$$;
