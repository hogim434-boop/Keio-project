-- ============================================================
-- is_admin() EXECUTE 권한 복구
-- ============================================================
-- 사유:
--   직전 마이그레이션 20260505000000_harden_is_admin.sql 에서
--   anon/authenticated 의 EXECUTE 권한을 회수했는데, RLS 정책
--   (categories/posts/comments/reactions/reports/bookmarks 의 12개 정책)
--   안에서 `public.is_admin()` 호출 시 호출자가 인증된 사용자
--   (authenticated)인 경우 함수 실행 권한 부족(42501 insufficient_privilege)
--   이 발생하여 조회/수정/삭제가 모두 차단됨.
--
--   SECURITY DEFINER 라도 호출자에게 EXECUTE 권한이 있어야 호출 가능.
--   따라서 anon/authenticated 에게 EXECUTE 권한 복구.
--   함수 본문은 단순 EXISTS SELECT 1 만 수행 + SECURITY DEFINER 라
--   profiles RLS 영향 없이 결정적 평가 → escalation 위험 없음.

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
