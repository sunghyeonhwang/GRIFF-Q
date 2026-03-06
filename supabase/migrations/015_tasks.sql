-- ============================================
-- v0.3A: Task 테이블 + 진행률 자동 계산 트리거
-- ============================================

-- Enum 타입 정의
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'review', 'completed', 'issue');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'normal', 'low');
CREATE TYPE task_source AS ENUM ('manual', 'meeting', 'scrum', 'kickoff', 'template');

-- Task 테이블
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'normal',
  weight integer DEFAULT 1 CHECK (weight BETWEEN 1 AND 3),
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  due_date date,
  estimated_hours float,
  actual_hours float,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  milestone_id uuid REFERENCES project_milestones(id) ON DELETE SET NULL,
  source task_source DEFAULT 'manual',
  source_id uuid,
  labels text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  node_position_x float DEFAULT 0,
  node_position_y float DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
  );

-- updated_at 자동 갱신 트리거 (기존 update_updated_at 함수 재사용)
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 진행률 자동 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id uuid)
RETURNS float AS $$
DECLARE
  total_weight integer;
  completed_weight integer;
BEGIN
  SELECT
    COALESCE(SUM(weight), 0),
    COALESCE(SUM(CASE WHEN status = 'completed' THEN weight ELSE 0 END), 0)
  INTO total_weight, completed_weight
  FROM tasks
  WHERE project_id = p_project_id
    AND parent_task_id IS NULL;

  IF total_weight = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((completed_weight::float / total_weight * 100)::numeric, 1);
END;
$$ LANGUAGE plpgsql;

-- Task 상태 변경 시 프로젝트 진행률 자동 업데이트
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS trigger AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    UPDATE projects
    SET progress = calculate_project_progress(NEW.project_id),
        updated_at = now()
    WHERE id = NEW.project_id;
  END IF;

  IF OLD.project_id IS NOT NULL AND OLD.project_id != COALESCE(NEW.project_id, '00000000-0000-0000-0000-000000000000') THEN
    UPDATE projects
    SET progress = calculate_project_progress(OLD.project_id),
        updated_at = now()
    WHERE id = OLD.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_progress
  AFTER INSERT OR UPDATE OF status, weight, project_id OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();
