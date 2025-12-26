-- Migration: Rename "creations" to "activities"
-- This migration safely renames tables, columns, indexes, and recreates RLS policies

-- ============================================================
-- STEP 1: Drop all RLS policies that reference "creations"
-- ============================================================

-- Drop creations policies
DROP POLICY IF EXISTS "Users can view own creations" ON creations;
DROP POLICY IF EXISTS "Anyone can view public creations" ON creations;
DROP POLICY IF EXISTS "Anyone with link can view link creations" ON creations;
DROP POLICY IF EXISTS "Creators can insert creations" ON creations;
DROP POLICY IF EXISTS "Users can update own creations" ON creations;
DROP POLICY IF EXISTS "Users can delete own creations" ON creations;

-- Drop stages policies (they reference creations table)
DROP POLICY IF EXISTS "Users can view stages of own creations" ON stages;
DROP POLICY IF EXISTS "Anyone can view stages of public creations" ON stages;
DROP POLICY IF EXISTS "Creators can insert stages to own creations" ON stages;
DROP POLICY IF EXISTS "Users can update stages of own creations" ON stages;
DROP POLICY IF EXISTS "Users can delete stages of own creations" ON stages;

-- Drop questions policies (they reference creations table via join)
DROP POLICY IF EXISTS "Users can view questions of own creations" ON questions;
DROP POLICY IF EXISTS "Anyone can view questions of public creations" ON questions;
DROP POLICY IF EXISTS "Creators can insert questions to own creations" ON questions;
DROP POLICY IF EXISTS "Users can update questions of own creations" ON questions;
DROP POLICY IF EXISTS "Users can delete questions of own creations" ON questions;

-- Drop embeddings policies (they reference creations table)
DROP POLICY IF EXISTS "Users can view embeddings of own creations" ON embeddings;
DROP POLICY IF EXISTS "Anyone can view embeddings of public creations" ON embeddings;
DROP POLICY IF EXISTS "Creators can insert embeddings" ON embeddings;
DROP POLICY IF EXISTS "Users can delete embeddings of own creations" ON embeddings;

-- ============================================================
-- STEP 2: Rename tables
-- ============================================================

ALTER TABLE creations RENAME TO activities;
ALTER TABLE creation_pending_invites RENAME TO activity_pending_invites;

-- ============================================================
-- STEP 3: Rename foreign key columns
-- ============================================================

ALTER TABLE stages RENAME COLUMN creation_id TO activity_id;
ALTER TABLE embeddings RENAME COLUMN creation_id TO activity_id;
ALTER TABLE activity_pending_invites RENAME COLUMN creation_id TO activity_id;

-- ============================================================
-- STEP 4: Rename indexes
-- ============================================================

ALTER INDEX idx_creations_user_id RENAME TO idx_activities_user_id;
ALTER INDEX idx_creations_status RENAME TO idx_activities_status;
ALTER INDEX idx_pending_invites_creation_id RENAME TO idx_pending_invites_activity_id;

-- ============================================================
-- STEP 5: Recreate RLS policies with new table/column names
-- ============================================================

-- Activities policies (formerly creations)
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public activities"
  ON activities FOR SELECT
  USING (status = 'public');

CREATE POLICY "Anyone with link can view link activities"
  ON activities FOR SELECT
  USING (status = 'link');

CREATE POLICY "Creators can insert activities"
  ON activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_create_content()
  );

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);

-- Stages policies (updated to reference activities)
CREATE POLICY "Users can view stages of own activities"
  ON stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = stages.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view stages of public activities"
  ON stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = stages.activity_id
      AND activities.status IN ('public', 'link')
    )
  );

CREATE POLICY "Creators can insert stages to own activities"
  ON stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = stages.activity_id
      AND activities.user_id = auth.uid()
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can update stages of own activities"
  ON stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = stages.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stages of own activities"
  ON stages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = stages.activity_id
      AND activities.user_id = auth.uid()
    )
  );

-- Questions policies (updated to reference activities)
CREATE POLICY "Users can view questions of own activities"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN activities ON activities.id = stages.activity_id
      WHERE stages.id = questions.stage_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view questions of public activities"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN activities ON activities.id = stages.activity_id
      WHERE stages.id = questions.stage_id
      AND activities.status IN ('public', 'link')
    )
  );

CREATE POLICY "Creators can insert questions to own activities"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN activities ON activities.id = stages.activity_id
      WHERE stages.id = questions.stage_id
      AND activities.user_id = auth.uid()
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can update questions of own activities"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN activities ON activities.id = stages.activity_id
      WHERE stages.id = questions.stage_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of own activities"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN activities ON activities.id = stages.activity_id
      WHERE stages.id = questions.stage_id
      AND activities.user_id = auth.uid()
    )
  );

-- Embeddings policies (updated to reference activities)
CREATE POLICY "Users can view embeddings of own activities"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = embeddings.activity_id
      AND activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view embeddings of public activities"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = embeddings.activity_id
      AND activities.status = 'public'
    )
  );

CREATE POLICY "Creators can insert embeddings"
  ON embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = embeddings.activity_id
      AND activities.user_id = auth.uid()
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can delete embeddings of own activities"
  ON embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = embeddings.activity_id
      AND activities.user_id = auth.uid()
    )
  );
