-- Migration: Optimize RLS policies for better performance
-- Issue: auth.uid() is re-evaluated for each row, causing poor query performance at scale
-- Fix: Wrap auth.uid() in (SELECT auth.uid()) to evaluate once per statement

-- ============================================
-- Step 1: Drop existing policies on creations
-- ============================================

DROP POLICY IF EXISTS "Anyone can view published creations" ON public.creations;
DROP POLICY IF EXISTS "Users can view own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can insert own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can update own creations" ON public.creations;
DROP POLICY IF EXISTS "Users can delete own creations" ON public.creations;

-- ============================================
-- Step 2: Drop existing policies on stages
-- ============================================

DROP POLICY IF EXISTS "Anyone can view stages of published creations" ON public.stages;
DROP POLICY IF EXISTS "Users can insert stages for own creations" ON public.stages;
DROP POLICY IF EXISTS "Users can update stages for own creations" ON public.stages;
DROP POLICY IF EXISTS "Users can delete stages for own creations" ON public.stages;

-- ============================================
-- Step 3: Drop existing policies on questions
-- ============================================

DROP POLICY IF EXISTS "Anyone can view questions of published creations" ON public.questions;
DROP POLICY IF EXISTS "Users can insert questions for own creations" ON public.questions;
DROP POLICY IF EXISTS "Users can update questions for own creations" ON public.questions;
DROP POLICY IF EXISTS "Users can delete questions for own creations" ON public.questions;

-- ============================================
-- Step 4: Drop existing policies on profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- ============================================
-- Step 5: Recreate optimized policies for creations
-- ============================================

-- รวม 2 SELECT policies เป็น 1 เพื่อหลีกเลี่ยง multiple permissive policies
CREATE POLICY "Users can view published or own creations"
  ON public.creations FOR SELECT
  USING (
    is_published = true
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can insert own creations"
  ON public.creations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own creations"
  ON public.creations FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own creations"
  ON public.creations FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- Step 6: Recreate optimized policies for stages
-- ============================================

CREATE POLICY "Anyone can view stages of published creations"
  ON public.stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND (creations.is_published = true OR creations.user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can insert stages for own creations"
  ON public.stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update stages for own creations"
  ON public.stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete stages for own creations"
  ON public.stages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- Step 7: Recreate optimized policies for questions
-- ============================================

CREATE POLICY "Anyone can view questions of published creations"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND (creations.is_published = true OR creations.user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can insert questions for own creations"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update questions for own creations"
  ON public.questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete questions for own creations"
  ON public.questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- Step 8: Recreate optimized policies for profiles
-- ============================================

-- Combined SELECT policy to avoid multiple permissive policies for same action
CREATE POLICY "Users can view own profile or admins can view all"
  ON public.profiles FOR SELECT
  USING (
    (SELECT auth.uid()) = id
    OR (SELECT auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);
