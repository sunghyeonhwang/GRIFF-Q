-- ============================================
-- P6: 클라이언트 반응 예측
-- ============================================

-- 아바타
create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text default '',
  position text default '',
  icon text default 'user',
  -- 수동 인격 프로필
  tone_style text default '',
  personality_tags text[] default '{}',
  decision_pattern text default '',
  sensitive_topics text[] default '{}',
  memo text default '',
  -- 메타
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger avatars_updated_at
  before update on public.avatars
  for each row execute function update_updated_at();

-- 채팅 세션
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid references public.avatars(id) on delete cascade not null,
  title text default '',
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function update_updated_at();

-- 채팅 메시지
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.avatars enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "avatars_select" on public.avatars
  for select to authenticated using (true);
create policy "avatars_insert" on public.avatars
  for insert to authenticated with check (auth.uid() = created_by);
create policy "avatars_update" on public.avatars
  for update to authenticated using (true);
create policy "avatars_delete" on public.avatars
  for delete to authenticated using (auth.uid() = created_by);

create policy "chat_sessions_select" on public.chat_sessions
  for select to authenticated using (true);
create policy "chat_sessions_insert" on public.chat_sessions
  for insert to authenticated with check (auth.uid() = created_by);
create policy "chat_sessions_delete" on public.chat_sessions
  for delete to authenticated using (auth.uid() = created_by);

create policy "chat_messages_select" on public.chat_messages
  for select to authenticated using (true);
create policy "chat_messages_insert" on public.chat_messages
  for insert to authenticated with check (true);

-- 인덱스
create index idx_avatars_created_by on public.avatars(created_by);
create index idx_chat_sessions_avatar_id on public.chat_sessions(avatar_id);
create index idx_chat_messages_session_id on public.chat_messages(session_id);
