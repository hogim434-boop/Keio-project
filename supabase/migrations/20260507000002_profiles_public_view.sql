-- ============================================================
-- profiles_public VIEW + 기존 광범위 정책 제거 (보안 강화)
-- ============================================================
-- 배경:
--   profiles_select_authenticated USING(true)는 인증 사용자가 다른 학생의
--   email/campus/grade/department까지 자유 조회 가능 → 과도한 권한.
--
-- 해결:
--   1) 광범위 정책 제거 → profiles 테이블은 본인 행만 SELECT (profiles_select_own)
--   2) profiles_public VIEW (id, nickname, role) 만 인증 사용자에게 SELECT GRANT
--   3) 알림 시스템 등 actor 표시 시 profiles_public 사용
--
-- 주의:
--   VIEW는 default로 owner 권한으로 실행 → base table RLS 우회.
--   따라서 view에 노출된 컬럼만 안전하게 모든 사용자에게 보임.
-- ============================================================

-- 1) 광범위 정책 제거
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;

-- 2) 공개 view 생성 — id, nickname, role 만
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, nickname, role
  FROM public.profiles;

-- 3) 인증 사용자에게 view SELECT 권한 부여
GRANT SELECT ON public.profiles_public TO authenticated;

-- 4) anon은 명시적으로 권한 없음 (default REVOKE)
REVOKE ALL ON public.profiles_public FROM anon;

COMMENT ON VIEW public.profiles_public IS
  '공개 가능한 프로필 정보 (id, nickname, role). 알림 actor 표시 등에서 사용.
   profiles 테이블은 본인 행만 SELECT 가능하지만 view는 모든 행 노출.';
