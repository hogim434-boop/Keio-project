-- ============================================================
-- bookmarks — 북마크 / 스크랩
-- ============================================================
-- - user_id FK → profiles.id ON DELETE CASCADE
-- - post_id FK → posts.id    ON DELETE CASCADE  (게시글 삭제 시 북마크 자동 제거)
-- - UNIQUE(user_id, post_id) — 동일 게시글 중복 북마크 방지
-- - 토글-only 운영 (INSERT / DELETE) — UPDATE 정책 없음
-- - 마이페이지 북마크 목록 최신순 인덱스

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     UUID         NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_unique_per_user_post UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
  ON public.bookmarks (user_id, created_at DESC);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookmarks_select_self ON public.bookmarks;
DROP POLICY IF EXISTS bookmarks_insert_self ON public.bookmarks;
DROP POLICY IF EXISTS bookmarks_delete_self ON public.bookmarks;

CREATE POLICY bookmarks_select_self
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY bookmarks_insert_self
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY bookmarks_delete_self
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.bookmarks IS '게시글 북마크. UNIQUE(user_id,post_id) — 토글-only (INSERT/DELETE)';
