-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_play_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Select profiles policy" ON profiles
FOR SELECT USING (
  ((SELECT auth.uid()) = id) OR (deleted_at IS NULL)
);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = id
);

CREATE POLICY "Update own profile policy" ON profiles
FOR UPDATE USING (
  ((SELECT auth.uid()) = id) AND (deleted_at IS NULL)
);

-- ============================================
-- ACTIVITIES POLICIES
-- ============================================
CREATE POLICY "Select activities policy" ON activities
FOR SELECT USING (
  ((SELECT auth.uid()) = user_id) OR
  ((status IN ('public', 'link')) AND (NOT is_profile_deleted(user_id)))
);

CREATE POLICY "Creators can insert activities" ON activities
FOR INSERT WITH CHECK (
  ((SELECT auth.uid()) = user_id) AND can_create_content()
);

CREATE POLICY "Users can update own activities" ON activities
FOR UPDATE USING (
  (SELECT auth.uid()) = user_id
);

CREATE POLICY "Users can delete own activities" ON activities
FOR DELETE USING (
  (SELECT auth.uid()) = user_id
);

-- ============================================
-- STAGES POLICIES
-- ============================================
CREATE POLICY "Users can view stages" ON stages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = stages.activity_id
    AND (activities.status IN ('public', 'link') OR activities.user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Creators can insert stages to own activities" ON stages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = stages.activity_id
    AND activities.user_id = (SELECT auth.uid())
  ) AND can_create_content()
);

CREATE POLICY "Users can update stages of own activities" ON stages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = stages.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete stages of own activities" ON stages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = stages.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

-- ============================================
-- QUESTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view questions" ON questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM stages
    JOIN activities ON activities.id = stages.activity_id
    WHERE stages.id = questions.stage_id
    AND (activities.status IN ('public', 'link') OR activities.user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Creators can insert questions to own activities" ON questions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM stages
    JOIN activities ON activities.id = stages.activity_id
    WHERE stages.id = questions.stage_id
    AND activities.user_id = (SELECT auth.uid())
  ) AND can_create_content()
);

CREATE POLICY "Users can update questions of own activities" ON questions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM stages
    JOIN activities ON activities.id = stages.activity_id
    WHERE stages.id = questions.stage_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete questions of own activities" ON questions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM stages
    JOIN activities ON activities.id = stages.activity_id
    WHERE stages.id = questions.stage_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

-- ============================================
-- ACTIVITY PENDING INVITES POLICIES
-- ============================================
CREATE POLICY "Owners can view invites" ON activity_pending_invites
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = activity_pending_invites.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Owners can insert invites" ON activity_pending_invites
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = activity_pending_invites.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Owners can update invites" ON activity_pending_invites
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = activity_pending_invites.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Owners can delete invites" ON activity_pending_invites
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = activity_pending_invites.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

-- ============================================
-- ACTIVITY PLAY RECORDS POLICIES
-- ============================================
CREATE POLICY "Users can view play records" ON activity_play_records
FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = activity_play_records.activity_id
    AND activities.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert own play records" ON activity_play_records
FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can update own play records" ON activity_play_records
FOR UPDATE USING (
  user_id = (SELECT auth.uid())
);

-- ============================================
-- COLLECTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own collections" ON collections
FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can insert own collections" ON collections
FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can update own collections" ON collections
FOR UPDATE TO authenticated USING (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can delete own collections" ON collections
FOR DELETE TO authenticated USING (
  user_id = (SELECT auth.uid())
);

-- ============================================
-- SAVED ITEMS POLICIES
-- ============================================
CREATE POLICY "Users can view own saved items" ON saved_items
FOR SELECT TO authenticated USING (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can insert own saved items" ON saved_items
FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can delete own saved items" ON saved_items
FOR DELETE TO authenticated USING (
  user_id = (SELECT auth.uid())
);

-- ============================================
-- REPORTS POLICIES
-- ============================================
CREATE POLICY "Anyone can create reports" ON reports
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view reports" ON reports
FOR SELECT USING (
  reporter_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update reports" ON reports
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'
  )
);
