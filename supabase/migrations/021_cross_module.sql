-- ============================================
-- v0.3D: 크로스 모듈 연동 (회의록↔태스크, 회고↔프로젝트)
-- ============================================

-- 1. 회의록 액션아이템 ↔ 태스크 연결
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS linked_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_action_items_task ON action_items(linked_task_id);

-- 2. 회고 ↔ 프로젝트 연결
ALTER TABLE retrospectives ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_retrospectives_project ON retrospectives(project_id);
