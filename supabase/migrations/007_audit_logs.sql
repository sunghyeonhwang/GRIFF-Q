-- ============================================
-- P7: 감사 로그
-- ============================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- RLS
alter table public.audit_logs enable row level security;

create policy "audit_logs_select" on public.audit_logs
  for select to authenticated using (true);

create policy "audit_logs_insert" on public.audit_logs
  for insert to authenticated with check (true);

-- 인덱스
create index idx_audit_logs_table_name on public.audit_logs(table_name);
create index idx_audit_logs_changed_by on public.audit_logs(changed_by);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_audit_logs_row_id on public.audit_logs(row_id);

-- 감사 로그 트리거 함수
create or replace function log_audit()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.audit_logs (table_name, row_id, action, new_data, changed_by)
    values (TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW), auth.uid());
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    insert into public.audit_logs (table_name, row_id, action, old_data, new_data, changed_by)
    values (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    return NEW;
  elsif (TG_OP = 'DELETE') then
    insert into public.audit_logs (table_name, row_id, action, old_data, changed_by)
    values (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), auth.uid());
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

-- 주요 테이블에 감사 로그 트리거 적용
create trigger audit_estimates after insert or update or delete on public.estimates
  for each row execute function log_audit();
create trigger audit_estimate_items after insert or update or delete on public.estimate_items
  for each row execute function log_audit();
create trigger audit_payments after insert or update or delete on public.payments
  for each row execute function log_audit();
create trigger audit_meetings after insert or update or delete on public.meetings
  for each row execute function log_audit();
create trigger audit_retrospectives after insert or update or delete on public.retrospectives
  for each row execute function log_audit();
create trigger audit_avatars after insert or update or delete on public.avatars
  for each row execute function log_audit();
