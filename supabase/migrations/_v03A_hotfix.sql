-- v0.3A 핫픽스: projects 테이블 누락 컬럼 추가
-- Supabase SQL Editor에서 실행

-- 1. updated_at 컬럼 추가 (트리거에서 참조하지만 테이블에 없음)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS set_projects_updated_at ON projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 3. title 컬럼이 존재하는 경우를 대비한 안전 처리
-- (DB에 title NOT NULL 컬럼이 있다면 이미 처리됨)

-- 4. Schema cache 리로드
NOTIFY pgrst, 'reload schema';
