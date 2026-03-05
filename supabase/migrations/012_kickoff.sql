-- ============================================
-- v0.3: 프로젝트 킥오프 모듈
-- ============================================

-- 1) project_kickoffs: 프로젝트별 킥오프 정보
create table if not exists public.project_kickoffs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) not null unique,
  objective text default '',
  scope text default '',
  constraints text default '',
  success_criteria text default '',
  notes text default '',
  kickoff_date date,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed')),
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger project_kickoffs_updated_at
  before update on public.project_kickoffs
  for each row execute function update_updated_at();

alter table public.project_kickoffs enable row level security;
create policy "project_kickoffs_select" on public.project_kickoffs for select to authenticated using (true);
create policy "project_kickoffs_insert" on public.project_kickoffs for insert to authenticated with check (auth.uid() = created_by);
create policy "project_kickoffs_update" on public.project_kickoffs for update to authenticated using (true);

create index idx_project_kickoffs_project_id on public.project_kickoffs(project_id);

-- 2) kickoff_checklist_items: 킥오프 체크리스트
create table if not exists public.kickoff_checklist_items (
  id uuid primary key default gen_random_uuid(),
  kickoff_id uuid references public.project_kickoffs(id) on delete cascade not null,
  title text not null,
  description text default '',
  assignee_id uuid references public.users(id),
  is_completed boolean default false,
  completed_at timestamptz,
  completed_by uuid references public.users(id),
  due_date date,
  sort_order integer default 0,
  is_auto_generated boolean default false,
  created_at timestamptz default now()
);

alter table public.kickoff_checklist_items enable row level security;
create policy "kickoff_checklist_items_select" on public.kickoff_checklist_items for select to authenticated using (true);
create policy "kickoff_checklist_items_insert" on public.kickoff_checklist_items for insert to authenticated with check (true);
create policy "kickoff_checklist_items_update" on public.kickoff_checklist_items for update to authenticated using (true);
create policy "kickoff_checklist_items_delete" on public.kickoff_checklist_items for delete to authenticated using (true);

create index idx_kickoff_checklist_items_kickoff_id on public.kickoff_checklist_items(kickoff_id);

-- 3) kickoff_acknowledgments: 킥오프 숙지 확인
create table if not exists public.kickoff_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  kickoff_id uuid references public.project_kickoffs(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  acknowledged_at timestamptz default now(),
  unique(kickoff_id, user_id)
);

alter table public.kickoff_acknowledgments enable row level security;
create policy "kickoff_acknowledgments_select" on public.kickoff_acknowledgments for select to authenticated using (true);
create policy "kickoff_acknowledgments_insert" on public.kickoff_acknowledgments for insert to authenticated with check (auth.uid() = user_id);
create policy "kickoff_acknowledgments_delete" on public.kickoff_acknowledgments for delete to authenticated using (true);

create index idx_kickoff_acknowledgments_kickoff_id on public.kickoff_acknowledgments(kickoff_id);

-- 4) kickoff_ai_conversations: AI 대화 기록
create table if not exists public.kickoff_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  kickoff_id uuid references public.project_kickoffs(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  messages jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger kickoff_ai_conversations_updated_at
  before update on public.kickoff_ai_conversations
  for each row execute function update_updated_at();

alter table public.kickoff_ai_conversations enable row level security;
create policy "kickoff_ai_conversations_select" on public.kickoff_ai_conversations for select to authenticated using (true);
create policy "kickoff_ai_conversations_insert" on public.kickoff_ai_conversations for insert to authenticated with check (auth.uid() = user_id);
create policy "kickoff_ai_conversations_update" on public.kickoff_ai_conversations for update to authenticated using (auth.uid() = user_id);

create index idx_kickoff_ai_conversations_kickoff_id on public.kickoff_ai_conversations(kickoff_id);
