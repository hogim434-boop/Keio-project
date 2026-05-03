-- ============================================================
-- profiles.email keio.jp 도메인 CHECK 제약 (서버 사이드 이중 검증)
-- ============================================================
-- 목적:
--   ROADMAP Task 006 — types/auth.ts KEIO_EMAIL_DOMAINS와 동기화된 DB 보호 장치.
--   클라이언트 zod 검증을 우회한 INSERT(악의적 RPC, 잘못된 OAuth 콜백)도 차단.
--
-- 도메인 화이트리스트:
--   @keio.jp / @g.keio.ac.jp / @sfc.keio.ac.jp
--   (types/auth.ts의 KEIO_EMAIL_DOMAINS 와 정확히 일치)
--
-- 안전장치:
--   - 사전 검증: 적용 전 SELECT 로 위반 row 0건 확인 완료 (2026-05-04)
--   - idempotent: pg_constraint IF NOT EXISTS 패턴
--   - 기존 데이터(tatuya128@keio.jp) @keio.jp 종료 → 통과 보장
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_keio_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_email_keio_check
      CHECK (email ~ '@(keio\.jp|g\.keio\.ac\.jp|sfc\.keio\.ac\.jp)$');
  END IF;
END $$;

COMMENT ON CONSTRAINT profiles_email_keio_check ON public.profiles
  IS '게이오 도메인 이메일만 허용 — types/auth.ts KEIO_EMAIL_DOMAINS 와 동기화 (Task 006)';
