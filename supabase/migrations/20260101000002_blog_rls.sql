-- Enable Row Level Security for Blog tables
-- Migration: 20260101000002_blog_rls.sql

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

-- Everyone can view categories
CREATE POLICY "Anyone can view categories" ON categories
FOR SELECT USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories" ON categories
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update categories" ON categories
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete categories" ON categories
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- POSTS POLICIES
-- ============================================

-- Public can view published posts, authors can view their own
CREATE POLICY "View posts policy" ON posts
FOR SELECT USING (
  (status = 'published' AND published_at <= now()) OR
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Authenticated users can create posts (admin only for now)
CREATE POLICY "Admins can insert posts" ON posts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Authors and admins can update posts
CREATE POLICY "Authors and admins can update posts" ON posts
FOR UPDATE USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Authors and admins can delete posts
CREATE POLICY "Authors and admins can delete posts" ON posts
FOR DELETE USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Anyone can view approved comments on published posts
CREATE POLICY "View approved comments" ON comments
FOR SELECT USING (
  (status = 'approved' AND EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = comments.post_id
    AND posts.status = 'published'
  )) OR
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Authenticated users can create comments on published posts that allow comments
CREATE POLICY "Authenticated users can comment" ON comments
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND
  user_id = (SELECT auth.uid()) AND
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = comments.post_id
    AND posts.status = 'published'
    AND posts.allow_comments = true
  )
);

-- Users can update their own comments, admins can update any
CREATE POLICY "Users can update own comments" ON comments
FOR UPDATE USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete own comments" ON comments
FOR DELETE USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);
