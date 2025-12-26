-- Migration: Add started_at column for time limit enforcement
-- This allows tracking when user actually started playing for anti-cheat

-- Add started_at column (defaults to now() when record is created)
ALTER TABLE activity_play_records ADD COLUMN started_at timestamptz DEFAULT now();

-- Create index for efficient time-based queries
CREATE INDEX idx_play_records_started_at ON activity_play_records(started_at);
