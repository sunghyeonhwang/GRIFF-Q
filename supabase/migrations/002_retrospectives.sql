-- 프로젝트 테이블
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- 개인 회고 테이블
CREATE TABLE public.retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  -- KPT
  keep JSONB NOT NULL DEFAULT '[]',
  problem JSONB NOT NULL DEFAULT '[]',
  try JSONB NOT NULL DEFAULT '[]',
  -- SSC
  start_items JSONB NOT NULL DEFAULT '[]',
  stop JSONB NOT NULL DEFAULT '[]',
  continue_items JSONB NOT NULL DEFAULT '[]',
  -- 공유 메모
  team_share_note TEXT DEFAULT '',
  next_action_note TEXT DEFAULT '',
  -- 상태
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  UNIQUE(project_id, author_id)
);

-- 취합 뷰 합의사항 테이블
CREATE TABLE public.retrospective_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  facilitator TEXT DEFAULT '',
  summary_date DATE DEFAULT CURRENT_DATE,
  -- 통합 인사이트
  keep_continue JSONB NOT NULL DEFAULT '[]',
  problem_stop JSONB NOT NULL DEFAULT '[]',
  try_start JSONB NOT NULL DEFAULT '[]',
  -- 역할별 핵심 요약
  role_summaries JSONB NOT NULL DEFAULT '{}',
  -- 최종 합의
  immediate_actions JSONB NOT NULL DEFAULT '[]',
  experiment_items JSONB NOT NULL DEFAULT '[]',
  assignee_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 트리거
CREATE TRIGGER retrospectives_updated_at
  BEFORE UPDATE ON public.retrospectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER retrospective_summaries_updated_at
  BEFORE UPDATE ON public.retrospective_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospective_summaries ENABLE ROW LEVEL SECURITY;

-- projects: 인증된 사용자 전체 조회, manager 이상 생성
CREATE POLICY "Authenticated can view projects" ON public.projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manager+ can create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super','boss','manager'))
  );

-- retrospectives: 본인 것 CRUD, 전체 조회 가능
CREATE POLICY "Authenticated can view all retrospectives" ON public.retrospectives
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own retrospective" ON public.retrospectives
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own draft" ON public.retrospectives
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super','boss'))
  );

-- retrospective_summaries: 전체 조회, manager 이상 편집
CREATE POLICY "Authenticated can view summaries" ON public.retrospective_summaries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manager+ can manage summaries" ON public.retrospective_summaries
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super','boss','manager'))
  );

-- 인덱스
CREATE INDEX idx_retrospectives_project ON public.retrospectives(project_id);
CREATE INDEX idx_retrospectives_author ON public.retrospectives(author_id);
CREATE INDEX idx_retrospectives_status ON public.retrospectives(status);
