-- ============================================
-- v0.3A: projects 테이블 확장 (종류, 우선순위, 진행률 등)
-- ============================================

CREATE TYPE project_type AS ENUM ('general', 'event', 'content', 'maintenance');

ALTER TABLE projects
  ADD COLUMN project_type project_type DEFAULT 'general',
  ADD COLUMN priority integer DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  ADD COLUMN progress float DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  ADD COLUMN color text DEFAULT '#3B82F6',
  ADD COLUMN archived boolean DEFAULT false;

CREATE INDEX idx_projects_archived ON projects(archived) WHERE archived = false;
CREATE INDEX idx_projects_type ON projects(project_type);
