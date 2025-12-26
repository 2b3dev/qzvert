-- Optimize RLS policies to prevent re-evaluation of auth functions per row
-- Wrapping auth.uid() in (select auth.uid()) ensures it's evaluated once per query

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own creations" ON creations;
DROP POLICY IF EXISTS "Creators can insert creations" ON creations;
DROP POLICY IF EXISTS "Users can update own creations" ON creations;
DROP POLICY IF EXISTS "Users can delete own creations" ON creations;

DROP POLICY IF EXISTS "Users can view stages of own creations" ON stages;
DROP POLICY IF EXISTS "Creators can insert stages to own creations" ON stages;
DROP POLICY IF EXISTS "Users can update stages of own creations" ON stages;
DROP POLICY IF EXISTS "Users can delete stages of own creations" ON stages;

DROP POLICY IF EXISTS "Users can view questions of own creations" ON questions;
DROP POLICY IF EXISTS "Creators can insert questions to own creations" ON questions;
DROP POLICY IF EXISTS "Users can update questions of own creations" ON questions;
DROP POLICY IF EXISTS "Users can delete questions of own creations" ON questions;

-- Update helper functions to use optimized auth calls
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = (select auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_create_content()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND role IN ('creator', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate profiles policies with optimized auth calls
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- Recreate creations policies with optimized auth calls
CREATE POLICY "Users can view own creations"
  ON creations FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Creators can insert creations"
  ON creations FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND public.can_create_content()
  );

CREATE POLICY "Users can update own creations"
  ON creations FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own creations"
  ON creations FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Recreate stages policies with optimized auth calls
CREATE POLICY "Users can view stages of own creations"
  ON stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Creators can insert stages to own creations"
  ON stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (select auth.uid())
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can update stages of own creations"
  ON stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete stages of own creations"
  ON stages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (select auth.uid())
    )
  );

-- Recreate questions policies with optimized auth calls
CREATE POLICY "Users can view questions of own creations"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Creators can insert questions to own creations"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (select auth.uid())
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can update questions of own creations"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete questions of own creations"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (select auth.uid())
    )
  );

