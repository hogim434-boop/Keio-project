-- ============================================================
-- profiles SELECT — 인증 사용자에게 공개 (알림·댓글 작성자 표시 용)
-- ============================================================
-- 배경:
--   기존 profiles_select_own 정책은 본인 행만 SELECT 가능.
--   알림 시스템에서 다른 사용자의 nickname을 표시하려면 다른 사용자
--   profile을 SELECT할 수 있어야 함. 댓글·게시글 작성자 표시도 동일.
--
-- 보안 트레이드오프:
--   profiles 테이블에는 email·campus·department 등이 있으나, 같은 게이오
--   학생 사이에서 nickname 공유는 자연스러움. RLS는 익명 사용자(anon)는
--   여전히 차단하므로 외부 노출은 없음.
--
-- 정책 합산:
--   PostgreSQL 다중 SELECT 정책은 OR 조합 (PERMISSIVE 기본).
--   기존 profiles_select_own은 유지하되 본 정책으로 범위 확장.
-- ============================================================

CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
