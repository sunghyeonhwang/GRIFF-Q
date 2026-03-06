-- ============================================
-- v0.3A 전체 마이그레이션 통합 (012~017)
-- Supabase SQL Editor에서 한 번에 실행
-- ============================================

-- ====== 012: projects 테이블 확장 ======
DO $$ BEGIN
  CREATE TYPE project_type AS ENUM ('general', 'event', 'content', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type project_type DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS progress float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- priority CHECK constraint (safe add)
DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_priority_check CHECK (priority BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_progress_check CHECK (progress BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

-- ====== 013: project_members (R&R) ======
DO $$ BEGIN
  CREATE TYPE project_role AS ENUM ('pm', 'planner', 'designer', 'developer', 'video', 'operations', 'allrounder');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'allrounder',
  is_backup boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),

  UNIQUE(project_id, user_id, role)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "members_select" ON project_members FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "members_insert" ON project_members FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "members_update" ON project_members FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "members_delete" ON project_members FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ====== 014: project_milestones ======
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "milestones_select" ON project_milestones FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "milestones_modify" ON project_milestones FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ====== 015: tasks ======
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'review', 'completed', 'issue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_source AS ENUM ('manual', 'meeting', 'scrum', 'kickoff', 'template');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tasks (
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

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
    USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 진행률 자동 계산 함수
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

DROP TRIGGER IF EXISTS trigger_update_project_progress ON tasks;
CREATE TRIGGER trigger_update_project_progress
  AFTER INSERT OR UPDATE OF status, weight, project_id OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();

-- ====== 016: task_dependencies ======
DO $$ BEGIN
  CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type dependency_type DEFAULT 'finish_to_start',
  created_at timestamptz DEFAULT now(),

  UNIQUE(task_id, depends_on_id),
  CHECK (task_id != depends_on_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on_id);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "deps_select" ON task_dependencies FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "deps_modify" ON task_dependencies FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ====== 017: project_reviews + conversations ======
DO $$ BEGIN
  CREATE TYPE review_type AS ENUM ('weekly', 'monthly', 'on_demand');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  review_type review_type DEFAULT 'on_demand',
  generated_by text DEFAULT 'gemini-2.0-flash',
  summary text,
  report_content jsonb DEFAULT '{}',
  risk_level risk_level DEFAULT 'low',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_project ON project_reviews(project_id);

CREATE TABLE IF NOT EXISTS project_review_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_review_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "reviews_select" ON project_reviews FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "reviews_insert" ON project_reviews FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "convs_select" ON project_review_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "convs_insert" ON project_review_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "convs_update" ON project_review_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 완료! v0.3A 마이그레이션 전체 적용됨
-- ============================================
