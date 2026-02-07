-- ============================================
-- Supabase Local Development Seed Data (OPTIONAL)
-- ============================================
-- ⚠️ This seed is DISABLED by default (see supabase/config.toml)
--
-- WHY: 
-- - We don't provide email/password login in production
-- - Adding dev-only UI breaks SSOT principles
-- - Developers should use Google OAuth (same as production)
-- - processUserRegistrationAction automatically creates all necessary data
--
-- WHEN TO USE:
-- - E2E testing that needs pre-existing accounts
-- - Specific test scenarios requiring known data
-- - Manual testing of multi-user features
--
-- TO ENABLE:
-- supabase db reset --seed
-- ============================================

-- Edge Function cron 설정 (로컬 전용). base_url·anon_key 둘 다 있을 때만 cron이 HTTP 호출함.
-- 로컬에서 cron 동작시키려면: anon_key를 채워야 함 (supabase status 또는 start 출력에서 확인 후 UPDATE).
-- 배포 환경은 마이그레이션에 INSERT 없음 → 배포 후 한 번 INSERT( base_url, anon_key ) 해주면 됨.
INSERT INTO config.edge_function_cron_config (id, base_url, anon_key)
VALUES (1, 'http://kong:8000', null)
ON CONFLICT (id) DO UPDATE SET base_url = EXCLUDED.base_url, anon_key = EXCLUDED.anon_key;

-- Clean existing data (for idempotency)