-- =====================================================
-- 어드민의 profiles SELECT 권한 부여
--   목적:
--     /admin/posts/new 에서 시드 계정 목록을 조회하려면
--     어드민이 다른 사용자의 profiles (특히 email) 를 볼 수 있어야 한다.
--   현재 상태:
--     profiles 에는 profiles_select_own (auth.uid() = id) 정책뿐 → 본인 외 차단.
--   변경:
--     profiles_select_admin (is_admin()) 추가.
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_admin());
