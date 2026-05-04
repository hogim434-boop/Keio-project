-- ============================================================
-- posts — 게시글 (자유 게시판 본 테이블)
-- ============================================================
-- - user_id   FK → profiles.id ON DELETE CASCADE  (탈퇴 시 글 자동 삭제)
-- - category_id FK → categories.id ON DELETE RESTRICT (카테고리 삭제 전 archive 강제)
-- - soft delete: is_deleted=true 는 본인/admin 만 SELECT
-- - 부분 인덱스 (is_deleted=false) 로 일반 SELECT 성능 + 인덱스 크기 최소화
-- - pg_trgm GIN(title|body) 으로 F007 검색 지원

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.posts (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  category_id     UUID         NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title           TEXT         NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  body            TEXT         NOT NULL CHECK (char_length(body)  BETWEEN 10 AND 5000),
  is_anonymous    BOOLEAN      NOT NULL DEFAULT true,
  reaction_up     INTEGER      NOT NULL DEFAULT 0,
  reaction_down   INTEGER      NOT NULL DEFAULT 0,
  comment_count   INTEGER      NOT NULL DEFAULT 0,
  is_deleted      BOOLEAN      NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 부분 인덱스 (활성 게시글만, 인덱스 크기 최소화)
CREATE INDEX IF NOT EXISTS idx_posts_category_created
  ON public.posts (category_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_created
  ON public.posts (created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_popular
  ON public.posts (reaction_up DESC, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_user
  ON public.posts (user_id, created_at DESC);

-- F007 검색용 trgm GIN
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
  ON public.posts USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_body_trgm
  ON public.posts USING GIN (body  gin_trgm_ops);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_select_visible ON public.posts;
DROP POLICY IF EXISTS posts_insert_self    ON public.posts;
DROP POLICY IF EXISTS posts_update_self    ON public.posts;
DROP POLICY IF EXISTS posts_delete_self    ON public.posts;

CREATE POLICY posts_select_visible
  ON public.posts FOR SELECT
  USING (is_deleted = false OR public.is_admin());

CREATE POLICY posts_insert_self
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_update_self
  ON public.posts FOR UPDATE
  USING      (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY posts_delete_self
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.posts IS '자유 게시판 게시글. soft delete + 부분 인덱스 + trgm 검색';
