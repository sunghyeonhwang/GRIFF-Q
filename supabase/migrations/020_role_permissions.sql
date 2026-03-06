-- ============================================
-- v0.3D: 역할별 권한 강화 + 프로젝트 소프트 삭제
-- ============================================

-- 1. 프로젝트 소프트 삭제 컬럼
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- 2. projects RLS 강화: 역할별 접근
-- 기존 정책 제거 후 역할별 재설정
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

-- SELECT: 역할별 분기
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated USING (
  deleted_at IS NULL AND (
    -- super/boss: 전체
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss'))
    OR
    -- manager: 본인 생성 + 멤버
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager') AND (
      created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    ))
    OR
    -- normal: 멤버만
    EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
  )
);

-- INSERT: 인증된 사용자
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: 생성자 + 관리자 이상
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss'))
  OR (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager')
      AND EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()))
);

-- DELETE: super만 (soft delete는 UPDATE로 처리)
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super')
);

-- 3. tasks RLS 강화: 역할별 접근
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;

-- SELECT: 역할별
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (
  -- super/boss: 전체
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss'))
  OR
  -- manager: 담당 프로젝트 + 본인
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'manager') AND (
    assignee_id = auth.uid() OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
  ))
  OR
  -- normal: 본인만
  assignee_id = auth.uid() OR created_by = auth.uid()
);

-- UPDATE: 담당자 + 생성자 + 관리자 이상
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (
  assignee_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super', 'boss', 'manager'))
);

-- 4. 삭제된 프로젝트 제외 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;
