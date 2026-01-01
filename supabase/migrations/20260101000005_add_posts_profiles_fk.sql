-- Add foreign key from posts.user_id to profiles.id
-- This enables PostgREST to join posts with profiles for author info

ALTER TABLE posts
ADD CONSTRAINT posts_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
