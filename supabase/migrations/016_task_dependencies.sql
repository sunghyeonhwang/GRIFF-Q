-- ============================================
-- v0.3A: Task 의존성 관계
-- ============================================

CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish');

CREATE TABLE task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  created_at timestamptz DEFAULT now(),

  UNIQUE(task_id, depends_on_id),
  CHECK (task_id != depends_on_id)
);

CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON task_dependencies(depends_on_id);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deps_select" ON task_dependencies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "deps_modify" ON task_dependencies
  FOR ALL TO authenticated USING (true);
