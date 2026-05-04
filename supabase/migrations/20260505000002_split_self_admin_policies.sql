-- ============================================================
-- comments / posts UPDATE/SELECT 정책 — self / admin 분리
-- ============================================================
-- 사유:
--   기존 정책은 `auth.uid() = user_id OR is_admin()` 단일 식으로 OR 결합.
--   PostgreSQL RLS 평가 중 `is_admin()` (SECURITY DEFINER) 호출이 어떤 이유로
--   실패/예외가 나면 OR 단락 평가가 결정적으로 false 처리되어 WITH CHECK 위반
--   (`new row violates row-level security policy`)이 발생.
--
--   정책을 `_self` 와 `_admin` 두 PERMISSIVE 정책으로 분리하면 PostgreSQL 가
--   각 정책을 독립적으로 평가하고 union(OR) 함. self 정책이 단순 컬럼 비교
--   (`auth.uid() = user_id`)만 사용하므로 함수 호출 의존성이 사라짐.
--
--   Supabase Dashboard 가 자동 추가한 `Enable delete for users based on user_id`
--   는 본 정책 셋과 중복되므로 제거.

-- ----- comments -----------------------------------------------------

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.comments;
DROP POLICY IF EXISTS comments_update_self  ON public.comments;
DROP POLICY IF EXISTS comments_update_admin ON public.comments;
DROP POLICY IF EXISTS comments_delete_self  ON public.comments;
DROP POLICY IF EXISTS comments_delete_admin ON public.comments;
DROP POLICY IF EXISTS comments_select_visible ON public.comments;
DROP POLICY IF EXISTS comments_select_admin   ON public.comments;

CREATE POLICY comments_select_visible
  ON public.comments FOR SELECT
  USING (is_deleted = false);
CREATE POLICY comments_select_admin
  ON public.comments FOR SELECT
  USING (public.is_admin());

CREATE POLICY comments_update_self
  ON public.comments FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_update_admin
  ON public.comments FOR UPDATE
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY comments_delete_self
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY comments_delete_admin
  ON public.comments FOR DELETE
  USING (public.is_admin());

-- ----- posts --------------------------------------------------------

DROP POLICY IF EXISTS posts_update_self  ON public.posts;
DROP POLICY IF EXISTS posts_update_admin ON public.posts;
DROP POLICY IF EXISTS posts_delete_self  ON public.posts;
DROP POLICY IF EXISTS posts_delete_admin ON public.posts;
DROP POLICY IF EXISTS posts_select_visible ON public.posts;
DROP POLICY IF EXISTS posts_select_admin   ON public.posts;

CREATE POLICY posts_select_visible
  ON public.posts FOR SELECT
  USING (is_deleted = false);
CREATE POLICY posts_select_admin
  ON public.posts FOR SELECT
  USING (public.is_admin());

CREATE POLICY posts_update_self
  ON public.posts FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY posts_update_admin
  ON public.posts FOR UPDATE
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY posts_delete_self
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY posts_delete_admin
  ON public.posts FOR DELETE
  USING (public.is_admin());
