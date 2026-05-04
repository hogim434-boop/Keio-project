-- ============================================================
-- is_admin() 강화 — SECURITY DEFINER 로 전환 + DELETE 정책 정합화
-- ============================================================
-- 사유:
--   SECURITY INVOKER 일 때 profiles_select_own RLS 가 본인 row 만 노출하여
--   `auth.uid()=user_id OR is_admin()` 의 OR 단락 평가가 결정적이지 않음 →
--   본인 댓글 soft delete (UPDATE is_deleted=true) 시 WITH CHECK 위반
--   (`new row violates row-level security policy for table "comments"`) 발생.
--
--   SECURITY DEFINER 로 전환하면 함수가 함수 정의자(postgres) 권한으로 실행되어
--   profiles RLS 영향 없이 EXISTS 평가가 결정적으로 동작.
--   함수 본문은 단순 EXISTS SELECT 1 만 수행 → escalation 위험 없음.
--
--   추가로 anon/authenticated 의 RPC 직접 실행을 차단하여 RLS 정책 안에서만
--   호출되도록 EXECUTE 권한을 정리.
--
--   supabase dashboard 가 자동 생성한 hard DELETE 정책
--   `Enable delete for users based on user_id` 는 admin 우회를 빠뜨려 향후
--   admin 모더레이션 시 차단되므로 마이그레이션 정의의 `comments_delete_self`
--   (auth.uid()=user_id OR is_admin()) 로 교체.

-- ----- is_admin() 재정의 -----------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO postgres, service_role;

COMMENT ON FUNCTION public.is_admin()
  IS '현재 세션 사용자가 profiles.role=admin 인지 판정. SECURITY DEFINER 로 RLS 우회.';

-- ----- comments DELETE 정책 정합화 ------------------------------------

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.comments;
DROP POLICY IF EXISTS comments_delete_self ON public.comments;

CREATE POLICY comments_delete_self
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());
