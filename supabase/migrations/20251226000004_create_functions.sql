-- Create helper functions and triggers

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())
$$;

-- Check if user can create content (creator or admin)
CREATE OR REPLACE FUNCTION can_create_content()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role IN ('creator', 'admin')
  )
$$;

-- Check if profile is deleted
CREATE OR REPLACE FUNCTION is_profile_deleted(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = profile_id
    AND deleted_at IS NOT NULL
  )
$$;

-- Get current user's email from JWT
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT (SELECT auth.jwt() ->> 'email')
$$;

-- Check if user is invited to a creation
CREATE OR REPLACE FUNCTION is_invited_to_creation(p_creation_id uuid, p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creation_pending_invites
    WHERE creation_id = p_creation_id
    AND email = p_email
  )
$$;

-- ============================================
-- ACCOUNT MANAGEMENT FUNCTIONS
-- ============================================

-- Soft delete account (user can only delete their own)
CREATE OR REPLACE FUNCTION soft_delete_account(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL OR current_user_id != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete your own account';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Account already marked for deletion';
  END IF;

  UPDATE profiles
  SET deleted_at = now(),
      updated_at = now()
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- Restore account (admin only)
CREATE OR REPLACE FUNCTION restore_account(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = current_user_id;

  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Admin access required to restore accounts';
  END IF;

  UPDATE profiles
  SET deleted_at = NULL,
      updated_at = now()
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Hard delete expired accounts (called by cron/edge function)
CREATE OR REPLACE FUNCTION hard_delete_expired_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count integer := 0;
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id FROM profiles
    WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days'
  LOOP
    -- Delete related data first
    DELETE FROM activities WHERE user_id = user_record.id;
    DELETE FROM profiles WHERE id = user_record.id;

    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$;

-- ============================================
-- ACTIVITY PLAY FUNCTIONS
-- ============================================

-- Check if user can play activity
CREATE OR REPLACE FUNCTION can_user_play_activity(p_activity_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_activity record;
  v_play_count integer;
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

-- Record activity play
CREATE OR REPLACE FUNCTION record_activity_play(
  p_activity_id uuid,
  p_user_id uuid,
  p_score integer DEFAULT NULL,
  p_duration_seconds integer DEFAULT NULL,
  p_completed boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Update reports updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for profiles updated_at
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger for reports updated_at
CREATE TRIGGER on_reports_updated
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();
