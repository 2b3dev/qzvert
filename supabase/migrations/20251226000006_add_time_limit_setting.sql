-- Migration: Add time limit setting for activities
-- This adds a time_limit_minutes column for overall activity time limits

-- Time limit in minutes: null = unlimited, number = max minutes to complete
ALTER TABLE activities ADD COLUMN time_limit_minutes integer DEFAULT NULL;
