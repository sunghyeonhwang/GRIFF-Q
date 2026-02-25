-- ============================================
-- P4: 입금/결제 요청
-- ============================================

create type public.payment_status as enum ('pending', 'completed');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount bigint not null,
  bank text not null,
  account_number text not null,
  depositor_name text not null default '',
  due_date date,
  note text default '',
  status public.payment_status default 'pending',
  created_by uuid references public.users(id) not null,
  completed_at timestamptz,
  completed_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at 트리거
create trigger payments_updated_at
  before update on public.payments
  for each row execute function update_updated_at();

-- RLS
alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select to authenticated using (true);

create policy "payments_insert" on public.payments
  for insert to authenticated with check (auth.uid() = created_by);

create policy "payments_update" on public.payments
  for update to authenticated using (true);
