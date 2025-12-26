-- Simplify Saved & Collections Feature
-- Remove is_default column and make collection_id nullable
-- This allows items to be saved without a specific collection (virtual "All Saved")

-- 1. Drop the policy that depends on is_default FIRST
DROP POLICY IF EXISTS "Users can delete non-default collections" ON collections;

-- 2. Remove is_default column from collections (now safe to drop)
ALTER TABLE collections
  DROP COLUMN IF EXISTS is_default;

-- 3. Create new delete policy (no is_default check needed)
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- 4. Make collection_id nullable in saved_items FIRST (before updating data)
ALTER TABLE saved_items
  ALTER COLUMN collection_id DROP NOT NULL;

-- 5. Drop the foreign key constraint and recreate with ON DELETE SET NULL
ALTER TABLE saved_items
  DROP CONSTRAINT IF EXISTS saved_items_collection_id_fkey;

ALTER TABLE saved_items
  ADD CONSTRAINT saved_items_collection_id_fkey
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;

-- 6. Migrate existing data: Move items from "All Saved" default collection to null collection_id
UPDATE saved_items
SET collection_id = NULL
WHERE collection_id IN (
  SELECT id FROM collections WHERE name = 'All Saved'
);

-- 7. Delete old "All Saved" default collections (they're now virtual)
DELETE FROM collections WHERE name = 'All Saved';

-- 8. Update unique constraint to handle null collection_id
ALTER TABLE saved_items
  DROP CONSTRAINT IF EXISTS saved_items_collection_id_activity_id_key;

-- Create a unique index that handles NULL collection_id properly
-- This ensures (user_id, activity_id) is unique when collection_id is null
DROP INDEX IF EXISTS idx_saved_items_unique_activity;
CREATE UNIQUE INDEX idx_saved_items_unique_activity
  ON saved_items (user_id, activity_id, COALESCE(collection_id, '00000000-0000-0000-0000-000000000000'::uuid));
