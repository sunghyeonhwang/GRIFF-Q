-- ============================================
-- v0.2 P0: 알림 시스템
-- ============================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications
  for insert to authenticated with check (true);
create policy "notifications_update" on public.notifications
  for update to authenticated using (auth.uid() = user_id);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(user_id, is_read);
create index idx_notifications_created_at on public.notifications(created_at desc);
