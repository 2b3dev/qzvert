-- Create Blog/CMS tables for QzVert
-- Migration: 20260101000001_create_blog_tables.sql

-- Create post status enum
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'archived');

-- Create comment status enum
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'spam');

-- Categories table (hierarchical)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Content
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  body text, -- TipTap JSON or HTML
  thumbnail text,

  -- Taxonomy
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  tags text[],

  -- Publishing
  status post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,

  -- SEO
  meta_title text,
  meta_description text,

  -- Stats
  view_count integer DEFAULT 0,

  -- Flags
  featured boolean DEFAULT false,
  pinned boolean DEFAULT false,
  allow_comments boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table (nested/threaded)
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  status comment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order ON categories(parent_id, order_index);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_featured ON posts(featured) WHERE featured = true;
CREATE INDEX idx_posts_pinned ON posts(pinned) WHERE pinned = true;

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get category with ancestors (breadcrumb)
CREATE OR REPLACE FUNCTION get_category_ancestors(category_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  level integer
) AS $$
WITH RECURSIVE ancestors AS (
  SELECT c.id, c.name, c.slug, c.parent_id, 0 as level
  FROM categories c
  WHERE c.id = category_id

  UNION ALL

  SELECT c.id, c.name, c.slug, c.parent_id, a.level + 1
  FROM categories c
  INNER JOIN ancestors a ON c.id = a.parent_id
)
SELECT ancestors.id, ancestors.name, ancestors.slug, ancestors.level
FROM ancestors
ORDER BY level DESC;
$$ LANGUAGE sql STABLE;

-- Function to get category with all descendants
CREATE OR REPLACE FUNCTION get_category_descendants(category_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  level integer
) AS $$
WITH RECURSIVE descendants AS (
  SELECT c.id, c.name, c.slug, c.parent_id, 0 as level
  FROM categories c
  WHERE c.id = category_id

  UNION ALL

  SELECT c.id, c.name, c.slug, c.parent_id, d.level + 1
  FROM categories c
  INNER JOIN descendants d ON c.parent_id = d.id
)
SELECT descendants.id, descendants.name, descendants.slug, descendants.level
FROM descendants
ORDER BY level ASC;
$$ LANGUAGE sql STABLE;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
