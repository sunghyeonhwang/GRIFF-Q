-- ============================================
-- v0.3A: 프로젝트 마일스톤
-- ============================================

CREATE TABLE project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_select" ON project_milestones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "milestones_modify" ON project_milestones
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
  );
