-- Create Saved & Collections Feature

-- 1. Collections table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_collections_user_id ON collections(user_id);

-- 2. Saved Items table
CREATE TABLE saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, activity_id)
);

CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_collection_id ON saved_items(collection_id);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Collections Policies
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete non-default collections"
  ON collections FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) AND is_default = false);

-- Saved Items Policies
CREATE POLICY "Users can view own saved items"
  ON saved_items FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own saved items"
  ON saved_items FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own saved items"
  ON saved_items FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));
