-- ============================================================
-- comments — 게시글 댓글 + 1단계 대댓글
-- ============================================================
-- - post_id   FK → posts.id    ON DELETE CASCADE
-- - user_id   FK → profiles.id ON DELETE CASCADE
-- - parent_id self-FK (NULL 허용, 1단계 대댓글)
-- - 자기 자신 참조 방지 CHECK
-- - 1단계 깊이 강제는 application 레이어에서 (DB CHECK 로 재귀 깊이 제한 불가)
-- - comment_count 갱신 트리거는 Task 009 에서 추가

CREATE TABLE IF NOT EXISTS public.comments (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID         NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  user_id       UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id     UUID                  REFERENCES public.comments(id) ON DELETE CASCADE,
  body          TEXT         NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  is_anonymous  BOOLEAN      NOT NULL DEFAULT true,
  is_deleted    BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT comments_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON public.comments (post_id, created_at) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON public.comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user
  ON public.comments (user_id, created_at DESC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select_visible ON public.comments;
DROP POLICY IF EXISTS comments_insert_self    ON public.comments;
DROP POLICY IF EXISTS comments_update_self    ON public.comments;
DROP POLICY IF EXISTS comments_delete_self    ON public.comments;

CREATE POLICY comments_select_visible
  ON public.comments FOR SELECT
  USING (is_deleted = false OR public.is_admin());

CREATE POLICY comments_insert_self
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY comments_update_self
  ON public.comments FOR UPDATE
  USING      (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY comments_delete_self
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

DROP TRIGGER IF EXISTS comments_set_updated_at ON public.comments;
CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.comments IS '게시글 댓글 + 1단계 대댓글. soft delete + parent_id self-FK + 자기참조 방지 CHECK';
