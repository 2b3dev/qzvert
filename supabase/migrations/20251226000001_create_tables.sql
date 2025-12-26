-- Create tables for QzVert application

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'creator', 'admin')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creations table
CREATE TABLE creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail text,
  tags text[],
  raw_content text NOT NULL,
  theme_config jsonb DEFAULT '{"timerEnabled": false, "timerSeconds": 30, "livesEnabled": true, "maxLives": 3, "theme": "adventure"}',
  play_count integer DEFAULT 0,
  type text NOT NULL CHECK (type IN ('quiz', 'quest', 'flashcard', 'roleplay')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'private_group', 'link', 'public'))
);

-- Stages table
CREATE TABLE stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id uuid REFERENCES creations(id) ON DELETE CASCADE,
  title text NOT NULL,
  lesson_summary text NOT NULL,
  order_index integer NOT NULL
);

-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[],
  correct_answer integer,
  explanation text NOT NULL,
  order_index integer NOT NULL,
  type text NOT NULL DEFAULT 'multiple_choice' CHECK (type IN ('multiple_choice', 'subjective')),
  model_answer text,
  points integer DEFAULT 100
);

-- Embeddings table (for vector search)
CREATE TABLE embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id uuid REFERENCES creations(id) ON DELETE CASCADE,
  vector_data float8[] NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_creations_user_id ON creations(user_id);
CREATE INDEX idx_creations_status ON creations(status);
CREATE INDEX idx_stages_creation_id ON stages(creation_id);
CREATE INDEX idx_stages_order ON stages(creation_id, order_index);
CREATE INDEX idx_questions_stage_id ON questions(stage_id);
CREATE INDEX idx_questions_order ON questions(stage_id, order_index);
CREATE INDEX idx_embeddings_creation_id ON embeddings(creation_id);
