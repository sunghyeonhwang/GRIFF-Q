-- ============================================
-- P3: 회의록 관리
-- ============================================

-- 회의록
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  content text default '',
  attendees uuid[] default '{}',
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 액션아이템
create type public.action_item_status as enum ('pending', 'in_progress', 'completed');

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  title text not null,
  assignee_id uuid references public.users(id),
  due_date date,
  status public.action_item_status default 'pending',
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at 트리거
create trigger meetings_updated_at
  before update on public.meetings
  for each row execute function update_updated_at();

create trigger action_items_updated_at
  before update on public.action_items
  for each row execute function update_updated_at();

-- RLS
alter table public.meetings enable row level security;
alter table public.action_items enable row level security;

-- 로그인 사용자 전체 조회
create policy "meetings_select" on public.meetings
  for select to authenticated using (true);

create policy "meetings_insert" on public.meetings
  for insert to authenticated with check (auth.uid() = created_by);

create policy "meetings_update" on public.meetings
  for update to authenticated using (true);

create policy "action_items_select" on public.action_items
  for select to authenticated using (true);

create policy "action_items_insert" on public.action_items
  for insert to authenticated with check (true);

create policy "action_items_update" on public.action_items
  for update to authenticated using (true);

create policy "action_items_delete" on public.action_items
  for delete to authenticated using (true);
