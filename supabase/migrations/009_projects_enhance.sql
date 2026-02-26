-- ============================================
-- v0.2 P1/P4: 프로젝트 테이블 확장 + 회의록/견적서 연결
-- ============================================

-- projects 테이블 확장 (기존 retrospectives 전용에서 범용으로)
alter table public.projects add column if not exists status text default 'active' check (status in ('active', 'completed', 'on_hold'));
alter table public.projects add column if not exists start_date date;
alter table public.projects add column if not exists end_date date;
alter table public.projects add column if not exists lead_user_id uuid references public.users(id);
alter table public.projects add column if not exists description text default '';

-- 회의록에 project_id 연결
alter table public.meetings add column if not exists project_id uuid references public.projects(id);
create index if not exists idx_meetings_project_id on public.meetings(project_id);

-- 견적서에 project_id 연결
alter table public.estimates add column if not exists project_id uuid references public.projects(id);
create index if not exists idx_estimates_project_id on public.estimates(project_id);

-- 입금에 project_id 연결
alter table public.payments add column if not exists project_id uuid references public.projects(id);
create index if not exists idx_payments_project_id on public.payments(project_id);

-- Post-mortem 테이블
create table if not exists public.postmortems (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) not null,
  title text not null,
  incident_date date not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  timeline jsonb default '[]',
  root_cause text default '',
  lessons_learned jsonb default '[]',
  action_items jsonb default '[]',
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger postmortems_updated_at
  before update on public.postmortems
  for each row execute function update_updated_at();

alter table public.postmortems enable row level security;
create policy "postmortems_select" on public.postmortems for select to authenticated using (true);
create policy "postmortems_insert" on public.postmortems for insert to authenticated with check (auth.uid() = created_by);
create policy "postmortems_update" on public.postmortems for update to authenticated using (true);

create index idx_postmortems_project_id on public.postmortems(project_id);

-- 감사 로그 트리거 추가
create trigger audit_postmortems after insert or update or delete on public.postmortems
  for each row execute function log_audit();
create trigger audit_notifications after insert or update or delete on public.notifications
  for each row execute function log_audit();

-- 아바타 학습 데이터
create table if not exists public.avatar_training_data (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid references public.avatars(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  raw_content text not null,
  analysis_result jsonb,
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now()
);

alter table public.avatar_training_data enable row level security;
create policy "avatar_training_data_select" on public.avatar_training_data for select to authenticated using (true);
create policy "avatar_training_data_insert" on public.avatar_training_data for insert to authenticated with check (auth.uid() = created_by);
create index idx_avatar_training_avatar_id on public.avatar_training_data(avatar_id);

-- 견적서 템플릿
create table if not exists public.estimate_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now()
);

create table if not exists public.estimate_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.estimate_templates(id) on delete cascade not null,
  item_name text not null,
  quantity integer not null default 1,
  unit_price bigint not null default 0,
  note text default '',
  sort_order integer not null default 0
);

alter table public.estimate_templates enable row level security;
alter table public.estimate_template_items enable row level security;
create policy "estimate_templates_select" on public.estimate_templates for select to authenticated using (true);
create policy "estimate_templates_insert" on public.estimate_templates for insert to authenticated with check (auth.uid() = created_by);
create policy "estimate_templates_delete" on public.estimate_templates for delete to authenticated using (auth.uid() = created_by);
create policy "estimate_template_items_select" on public.estimate_template_items for select to authenticated using (true);
create policy "estimate_template_items_insert" on public.estimate_template_items for insert to authenticated with check (true);
create policy "estimate_template_items_delete" on public.estimate_template_items for delete to authenticated using (true);
