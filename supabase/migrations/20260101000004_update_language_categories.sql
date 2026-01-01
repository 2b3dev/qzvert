-- Update language categories
-- Migration: 20260101000004_update_language_categories.sql

-- First, update any posts/activities that reference English or Thai to point to the parent category
-- Get the parent category ID (Other Languages -> Languages)
DO $$
DECLARE
    parent_cat_id uuid;
    english_cat_id uuid;
    thai_cat_id uuid;
BEGIN
    -- Get the "Other Languages" category ID
    SELECT id INTO parent_cat_id FROM categories WHERE slug = 'other-languages';

    -- Get English and Thai category IDs
    SELECT id INTO english_cat_id FROM categories WHERE slug = 'english';
    SELECT id INTO thai_cat_id FROM categories WHERE slug = 'thai';

    -- Update posts that reference English or Thai to use the parent category
    IF english_cat_id IS NOT NULL THEN
        UPDATE posts SET category_id = parent_cat_id WHERE category_id = english_cat_id;
    END IF;

    IF thai_cat_id IS NOT NULL THEN
        UPDATE posts SET category_id = parent_cat_id WHERE category_id = thai_cat_id;
    END IF;

    -- Update activities that reference English or Thai to use the parent category
    IF english_cat_id IS NOT NULL THEN
        UPDATE activities SET category_id = parent_cat_id WHERE category_id = english_cat_id;
    END IF;

    IF thai_cat_id IS NOT NULL THEN
        UPDATE activities SET category_id = parent_cat_id WHERE category_id = thai_cat_id;
    END IF;

    -- Delete English and Thai categories
    DELETE FROM categories WHERE slug IN ('english', 'thai');

    -- Rename "Other Languages" to "Languages"
    UPDATE categories
    SET name = 'Languages', slug = 'languages'
    WHERE slug = 'other-languages';
END $$;
