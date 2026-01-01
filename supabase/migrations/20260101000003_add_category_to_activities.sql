-- Add category_id to activities table
-- Migration: 20260101000003_add_category_to_activities.sql

-- Add category_id column to activities
ALTER TABLE activities
ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_activities_category_id ON activities(category_id);

-- Update categories table to track both posts and activities count
-- (This is done via queries, not stored in table)
