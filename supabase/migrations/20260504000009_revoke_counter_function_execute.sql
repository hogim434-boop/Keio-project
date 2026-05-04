-- ============================================================
-- 카운터 트리거 함수의 anon / authenticated EXECUTE 권한 회수
-- ============================================================
-- advisor lint 0028 (anon_security_definer_function_executable)
--          0029 (authenticated_security_definer_function_executable)
-- 회피 — 본 함수들은 AFTER 트리거 전용이며 PostgREST RPC 로 호출되어선 안 됨.
-- public 스키마에 위치하나 EXECUTE 를 회수하여 RPC 노출 차단.

REVOKE EXECUTE ON FUNCTION public.reactions_apply_post_counter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.comments_apply_post_counter()  FROM PUBLIC, anon, authenticated;
