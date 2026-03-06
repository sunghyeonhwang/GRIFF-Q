-- Supabase PostgREST schema cache 리로드
-- 마이그레이션 후 반드시 실행해야 새 컬럼/타입이 API에서 인식됨
NOTIFY pgrst, 'reload schema';
