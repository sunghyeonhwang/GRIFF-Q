-- ============================================
-- P5: 견적서 공동 작업
-- ============================================

create type public.estimate_status as enum ('draft', 'confirmed', 'sent');

-- 견적서 헤더
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  client_name text not null,
  estimate_date date not null default current_date,
  valid_until date,
  status public.estimate_status default 'draft',
  note text default '',
  -- 편집 잠금
  locked_by uuid references public.users(id),
  locked_at timestamptz,
  -- 메타
  created_by uuid references public.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger estimates_updated_at
  before update on public.estimates
  for each row execute function update_updated_at();

-- 견적서 항목
create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid references public.estimates(id) on delete cascade not null,
  item_name text not null,
  quantity integer not null default 1,
  unit_price bigint not null default 0,
  note text default '',
  highlight text default '',
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger estimate_items_updated_at
  before update on public.estimate_items
  for each row execute function update_updated_at();

-- RLS
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;

create policy "estimates_select" on public.estimates
  for select to authenticated using (true);
create policy "estimates_insert" on public.estimates
  for insert to authenticated with check (auth.uid() = created_by);
create policy "estimates_update" on public.estimates
  for update to authenticated using (true);
create policy "estimates_delete" on public.estimates
  for delete to authenticated using (auth.uid() = created_by);

create policy "estimate_items_select" on public.estimate_items
  for select to authenticated using (true);
create policy "estimate_items_insert" on public.estimate_items
  for insert to authenticated with check (true);
create policy "estimate_items_update" on public.estimate_items
  for update to authenticated using (true);
create policy "estimate_items_delete" on public.estimate_items
  for delete to authenticated using (true);

-- 인덱스
create index idx_estimates_created_by on public.estimates(created_by);
create index idx_estimates_status on public.estimates(status);
create index idx_estimate_items_estimate_id on public.estimate_items(estimate_id);
