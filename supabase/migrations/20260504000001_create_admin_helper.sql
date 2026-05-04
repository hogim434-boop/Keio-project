-- ============================================================
-- is_admin() 헬퍼 함수 (RLS 정책에서 재사용)
-- ============================================================
-- profiles.role = 'admin' 인지 현재 세션 사용자에 대해 판정.
-- categories / posts / comments / reactions / reports / bookmarks 의
-- RLS 정책에서 admin 분기를 단일 출처로 관리하기 위함.
--
-- 보안 옵션:
--  - SECURITY INVOKER  : 호출자의 권한으로 실행 (profiles RLS 적용됨)
--  - STABLE            : 동일 트랜잭션 내 결과 캐싱
--  - search_path=public: advisor function_search_path_mutable 회피

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

COMMENT ON FUNCTION public.is_admin()
  IS '현재 세션 사용자가 profiles.role = admin 인지 판정. RLS 정책에서 재사용';
