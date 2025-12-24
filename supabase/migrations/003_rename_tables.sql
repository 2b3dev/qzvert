-- Migration: Rename tables for clarity
-- quests -> creations (stores quiz, quest, flashcard, roleplay)
-- quizzes -> questions (stores actual quiz questions)

-- Step 1: Drop existing policies first (they reference old table names)

-- Drop quizzes policies
DROP POLICY IF EXISTS "Anyone can view quizzes of published quests" ON public.quizzes;
DROP POLICY IF EXISTS "Users can insert quizzes for own quests" ON public.quizzes;
DROP POLICY IF EXISTS "Users can update quizzes for own quests" ON public.quizzes;
DROP POLICY IF EXISTS "Users can delete quizzes for own quests" ON public.quizzes;

-- Drop stages policies
DROP POLICY IF EXISTS "Anyone can view stages of published quests" ON public.stages;
DROP POLICY IF EXISTS "Users can insert stages for own quests" ON public.stages;
DROP POLICY IF EXISTS "Users can update stages for own quests" ON public.stages;
DROP POLICY IF EXISTS "Users can delete stages for own quests" ON public.stages;

-- Drop quests policies
DROP POLICY IF EXISTS "Anyone can view published quests" ON public.quests;
DROP POLICY IF EXISTS "Users can view own quests" ON public.quests;
DROP POLICY IF EXISTS "Users can insert own quests" ON public.quests;
DROP POLICY IF EXISTS "Users can update own quests" ON public.quests;
DROP POLICY IF EXISTS "Users can delete own quests" ON public.quests;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS public.increment_play_count(uuid);

-- Step 3: Drop indexes (they will be recreated with new names)
DROP INDEX IF EXISTS public.quests_user_id_idx;
DROP INDEX IF EXISTS public.quests_is_published_idx;
DROP INDEX IF EXISTS public.stages_quest_id_idx;
DROP INDEX IF EXISTS public.stages_order_idx;
DROP INDEX IF EXISTS public.quizzes_stage_id_idx;

-- Step 4: Rename tables
ALTER TABLE public.quests RENAME TO creations;
ALTER TABLE public.quizzes RENAME TO questions;

-- Step 5: Rename foreign key column in stages table
ALTER TABLE public.stages RENAME COLUMN quest_id TO creation_id;

-- Step 6: Recreate indexes with new names
CREATE INDEX creations_user_id_idx ON public.creations(user_id);
CREATE INDEX creations_is_published_idx ON public.creations(is_published);
CREATE INDEX stages_creation_id_idx ON public.stages(creation_id);
CREATE INDEX stages_order_idx ON public.stages(creation_id, order_index);
CREATE INDEX questions_stage_id_idx ON public.questions(stage_id);

-- Step 7: Recreate RLS policies for creations table
CREATE POLICY "Anyone can view published creations"
  ON public.creations FOR SELECT
  USING (is_published = true);

CREATE POLICY "Users can view own creations"
  ON public.creations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creations"
  ON public.creations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creations"
  ON public.creations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations"
  ON public.creations FOR DELETE
  USING (auth.uid() = user_id);

-- Step 8: Recreate RLS policies for stages table
CREATE POLICY "Anyone can view stages of published creations"
  ON public.stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND (creations.is_published = true OR creations.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert stages for own creations"
  ON public.stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stages for own creations"
  ON public.stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stages for own creations"
  ON public.stages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
  );

-- Step 9: Recreate RLS policies for questions table
CREATE POLICY "Anyone can view questions of published creations"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND (creations.is_published = true OR creations.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert questions for own creations"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for own creations"
  ON public.questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions for own creations"
  ON public.questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stages
      JOIN public.creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = auth.uid()
    )
  );

-- Step 10: Recreate function with new table name
CREATE OR REPLACE FUNCTION public.increment_play_count(creation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.creations
  SET play_count = play_count + 1
  WHERE id = creation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
