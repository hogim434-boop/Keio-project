-- ============================================================
-- categories — 게시판 갤러리/카테고리 분류
-- ============================================================
-- type: 'topic' (주제별 갤러리) | 'campus' (캠퍼스별 갤러리)
-- 시드 9건(자유/연애/학업/취업/일상/질문 + 미타/히요시/SFC) 은 Task 010 에서 INSERT.

CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT         NOT NULL UNIQUE,
  name        TEXT         NOT NULL,
  type        TEXT         NOT NULL CHECK (type IN ('topic', 'campus')),
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_type_sort
  ON public.categories (type, sort_order);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS 4정책 (DROP+CREATE 로 idempotent)
DROP POLICY IF EXISTS categories_select_all   ON public.categories;
DROP POLICY IF EXISTS categories_insert_admin ON public.categories;
DROP POLICY IF EXISTS categories_update_admin ON public.categories;
DROP POLICY IF EXISTS categories_delete_admin ON public.categories;

CREATE POLICY categories_select_all
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY categories_insert_admin
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY categories_update_admin
  ON public.categories FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_delete_admin
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- updated_at 자동 갱신 트리거 (profiles 의 set_updated_at 함수 재사용)
DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.categories IS '게시판 갤러리/카테고리 분류 (topic|campus). SELECT 모두 허용, 변경은 admin 만';
COMMENT ON COLUMN public.categories.slug IS 'URL 식별자 (예: free, love, mita). UNIQUE';
COMMENT ON COLUMN public.categories.type IS 'topic(주제별) | campus(캠퍼스별)';
