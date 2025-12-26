-- Enable Row Level Security and create policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user can create content
CREATE OR REPLACE FUNCTION public.can_create_content()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('creator', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Creations policies
CREATE POLICY "Users can view own creations"
  ON creations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public creations"
  ON creations FOR SELECT
  USING (status = 'public');

CREATE POLICY "Anyone with link can view link creations"
  ON creations FOR SELECT
  USING (status = 'link');

CREATE POLICY "Creators can insert creations"
  ON creations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_create_content()
  );

CREATE POLICY "Users can update own creations"
  ON creations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations"
  ON creations FOR DELETE
  USING (auth.uid() = user_id);

-- Stages policies (access through creation ownership)
CREATE POLICY "Users can view stages of own creations"
  ON stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view stages of public creations"
  ON stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.status IN ('public', 'link')
    )
  );

CREATE POLICY "Creators can insert stages to own creations"
  ON stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can update stages of own creations"
  ON stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stages of own creations"
  ON stages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = stages.creation_id
      AND creations.user_id = auth.uid()
    )
  );

-- Questions policies (access through stage -> creation ownership)
CREATE POLICY "Users can view questions of own creations"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view questions of public creations"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.status IN ('public', 'link')
    )
  );

CREATE POLICY "Creators can insert questions to own creations"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = auth.uid()
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
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions of own creations"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN creations ON creations.id = stages.creation_id
      WHERE stages.id = questions.stage_id
      AND creations.user_id = auth.uid()
    )
  );

-- Embeddings policies
CREATE POLICY "Users can view embeddings of own creations"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = embeddings.creation_id
      AND creations.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view embeddings of public creations"
  ON embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = embeddings.creation_id
      AND creations.status = 'public'
    )
  );

CREATE POLICY "Creators can insert embeddings"
  ON embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = embeddings.creation_id
      AND creations.user_id = auth.uid()
    )
    AND public.can_create_content()
  );

CREATE POLICY "Users can delete embeddings of own creations"
  ON embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creations
      WHERE creations.id = embeddings.creation_id
      AND creations.user_id = auth.uid()
    )
  );
