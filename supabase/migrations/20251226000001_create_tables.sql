-- Create tables for QzVert application

-- Create custom types
CREATE TYPE creation_status AS ENUM ('draft', 'private_group', 'link', 'public');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE content_type AS ENUM ('activity', 'profile', 'comment');
CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'harassment', 'misinformation', 'copyright', 'other');

-- User role enum type
CREATE TYPE user_role AS ENUM ('user', 'plus', 'pro', 'ultra', 'admin');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  email text,
  role user_role DEFAULT 'user',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail text,
  tags text[],
  raw_content text NOT NULL,
  theme_config jsonb DEFAULT '{"theme": "adventure", "maxLives": 3, "livesEnabled": true, "timerEnabled": false, "timerSeconds": 30}',
  play_count integer DEFAULT 0,
  type text NOT NULL DEFAULT 'smart_quiz',
  status creation_status NOT NULL DEFAULT 'draft',
  replay_limit integer,
  available_from timestamptz,
  available_until timestamptz,
  time_limit_minutes integer,
  age_range text
);

-- Stages table
CREATE TABLE stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  title text NOT NULL,
  lesson_summary text NOT NULL,
  order_index integer NOT NULL
);

-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  explanation text NOT NULL,
  order_index integer DEFAULT 0
);

-- Activity pending invites table
CREATE TABLE activity_pending_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, email)
);

-- Activity play records table
CREATE TABLE activity_play_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now(),
  started_at timestamptz DEFAULT now(),
  score integer,
  duration_seconds integer,
  completed boolean DEFAULT false
);

-- Collections table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Saved items table
CREATE TABLE saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Reports table
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type content_type NOT NULL,
  content_id uuid NOT NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  additional_info text,
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_stages_activity_id ON stages(activity_id);
CREATE INDEX idx_stages_order ON stages(activity_id, order_index);
CREATE INDEX idx_questions_stage_id ON questions(stage_id);
CREATE INDEX idx_questions_order ON questions(stage_id, order_index);
CREATE INDEX idx_pending_invites_activity_id ON activity_pending_invites(activity_id);
CREATE INDEX idx_pending_invites_email ON activity_pending_invites(email);
CREATE INDEX idx_play_records_activity_id ON activity_play_records(activity_id);
CREATE INDEX idx_play_records_user_id ON activity_play_records(user_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_activity_id ON saved_items(activity_id);
CREATE INDEX idx_reports_content ON reports(content_type, content_id);
CREATE INDEX idx_reports_status ON reports(status);
