-- ============================================
-- v0.3B: 프로젝트 킥오프 + 일정 캘린더
-- ============================================

-- 1. project_kickoffs 테이블
CREATE TABLE IF NOT EXISTS project_kickoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  objective text,
  scope text,
  constraints text,
  success_criteria text,
  kickoff_date date,
  meeting_notes text,
  meeting_attendees uuid[] DEFAULT '{}',
  meeting_decisions jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_kickoffs_project ON project_kickoffs(project_id);

ALTER TABLE project_kickoffs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_kickoffs' AND policyname = 'kickoffs_select') THEN
    CREATE POLICY "kickoffs_select" ON project_kickoffs FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_kickoffs' AND policyname = 'kickoffs_insert') THEN
    CREATE POLICY "kickoffs_insert" ON project_kickoffs FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_kickoffs' AND policyname = 'kickoffs_update') THEN
    CREATE POLICY "kickoffs_update" ON project_kickoffs FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_kickoffs' AND policyname = 'kickoffs_delete') THEN
    CREATE POLICY "kickoffs_delete" ON project_kickoffs FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
  END IF;
END $$;

-- updated_at 트리거 (이미 있으면 무시)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_kickoffs_updated_at') THEN
    CREATE TRIGGER set_kickoffs_updated_at
      BEFORE UPDATE ON project_kickoffs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 2. kickoff_checklist_items 테이블
CREATE TABLE IF NOT EXISTS kickoff_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kickoff_id uuid NOT NULL REFERENCES project_kickoffs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_completed boolean DEFAULT false,
  due_date date,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_kickoff ON kickoff_checklist_items(kickoff_id);

ALTER TABLE kickoff_checklist_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kickoff_checklist_items' AND policyname = 'checklist_select') THEN
    CREATE POLICY "checklist_select" ON kickoff_checklist_items FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kickoff_checklist_items' AND policyname = 'checklist_insert') THEN
    CREATE POLICY "checklist_insert" ON kickoff_checklist_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kickoff_checklist_items' AND policyname = 'checklist_update') THEN
    CREATE POLICY "checklist_update" ON kickoff_checklist_items FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kickoff_checklist_items' AND policyname = 'checklist_delete') THEN
    CREATE POLICY "checklist_delete" ON kickoff_checklist_items FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 3. schedules 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('vacation', 'salary_review', 'birthday', 'holiday', 'company', 'meeting', 'other')),
  start_date date NOT NULL,
  end_date date,
  is_all_day boolean DEFAULT true,
  start_time time,
  end_time time,
  color text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  is_public boolean DEFAULT true,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_dates ON schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_schedules_category ON schedules(category);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_select') THEN
    CREATE POLICY "schedules_select" ON schedules FOR SELECT TO authenticated
      USING (is_public = true OR created_by = auth.uid() OR target_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_insert') THEN
    CREATE POLICY "schedules_insert" ON schedules FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_update') THEN
    CREATE POLICY "schedules_update" ON schedules FOR UPDATE TO authenticated
      USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_delete') THEN
    CREATE POLICY "schedules_delete" ON schedules FOR DELETE TO authenticated
      USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager')));
  END IF;
END $$;
