-- ============================================
-- v0.3A: 프로젝트 멤버 (R&R)
-- ============================================

CREATE TYPE project_role AS ENUM ('pm', 'planner', 'designer', 'developer', 'video', 'operations', 'allrounder');

CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'allrounder',
  is_backup boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),

  UNIQUE(project_id, user_id, role)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select" ON project_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_insert" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
  );

CREATE POLICY "members_update" ON project_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
  );

CREATE POLICY "members_delete" ON project_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
  );
