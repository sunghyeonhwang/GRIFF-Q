-- 회고 시스템 고도화: 점수 평가 + 종합 의견 추가

-- 1. retrospectives 테이블에 점수 평가 컬럼 추가

-- 프로젝트 전체 만족도 (1~5점, 6항목)
-- { "client": 4, "team": 3, "schedule": 5, "budget": 1, "quality": 4, "communication": 3 }
ALTER TABLE public.retrospectives
  ADD COLUMN IF NOT EXISTS satisfaction_scores JSONB DEFAULT '{}';

-- 파트별 평가 (역할 기반 점수+의견)
-- [{ "part": "디자인", "score": 4, "good": "...", "bad": "...", "reason": "...", "improvement": "..." }]
ALTER TABLE public.retrospectives
  ADD COLUMN IF NOT EXISTS part_evaluations JSONB DEFAULT '[]';

-- 종합 의견 (4개 텍스트)
ALTER TABLE public.retrospectives
  ADD COLUMN IF NOT EXISTS overall_best TEXT DEFAULT '';
ALTER TABLE public.retrospectives
  ADD COLUMN IF NOT EXISTS overall_worst TEXT DEFAULT '';
ALTER TABLE public.retrospectives
  ADD COLUMN IF NOT EXISTS overall_improvement TEXT DEFAULT '';
ALTER TABLE public.retrospectives
  ADD COLUMN IF NOT EXISTS overall_message TEXT DEFAULT '';

-- 2. retrospective_summaries 테이블에 종합 집계 컬럼 추가

-- 주요 이슈 사항
-- [{ "content": "...", "part": "...", "impact": "high", "cause": "...", "resolution": "...", "result": "..." }]
ALTER TABLE public.retrospective_summaries
  ADD COLUMN IF NOT EXISTS major_issues JSONB DEFAULT '[]';

-- 액션 아이템
-- [{ "title": "...", "part": "...", "assignee": "...", "priority": "high", "due_date": "...", "status": "open" }]
ALTER TABLE public.retrospective_summaries
  ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]';

-- 종합 교훈
ALTER TABLE public.retrospective_summaries
  ADD COLUMN IF NOT EXISTS lessons_best JSONB DEFAULT '[]';
ALTER TABLE public.retrospective_summaries
  ADD COLUMN IF NOT EXISTS lessons_worst JSONB DEFAULT '[]';
ALTER TABLE public.retrospective_summaries
  ADD COLUMN IF NOT EXISTS final_remarks TEXT DEFAULT '';
