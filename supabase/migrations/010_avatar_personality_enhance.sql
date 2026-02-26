-- ============================================
-- 010: 아바타 성격 프로필 강화
-- ============================================

-- avatars 테이블에 새 컬럼 3개 추가
alter table public.avatars
  add column if not exists common_phrases text[] default '{}';

alter table public.avatars
  add column if not exists response_style text default '';

alter table public.avatars
  add column if not exists emoji_usage text default '';
