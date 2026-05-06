-- ============================================================
-- user_list view 권한 명시적 잠금 (보안 강화)
-- ============================================================
-- 배경:
--   user_list view는 auth.users를 조인하여 email, last_sign_in_at 등을 노출.
--   기본 PUBLIC GRANT 상태에서 인증 사용자가 view 통해 다른 회원 정보 조회 가능성.
--
-- 정책:
--   - PUBLIC, anon, authenticated 에게서 모든 권한 회수
--   - service_role 만 SELECT 가능 (default로 superuser-like 권한 보유)
--   - admin UI 등에서 회원 목록이 필요하면 server-side에서 service_role 클라이언트 사용,
--     또는 별도 admin 전용 RPC 함수로 노출
-- ============================================================

REVOKE ALL ON public.user_list FROM PUBLIC;
REVOKE ALL ON public.user_list FROM anon;
REVOKE ALL ON public.user_list FROM authenticated;

COMMENT ON VIEW public.user_list IS
  '회원 목록 (auth.users 조인). admin/service_role 전용. 일반 사용자 노출 금지.';
