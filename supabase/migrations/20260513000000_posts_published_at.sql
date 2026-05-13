-- =====================================================
-- 게시글 예약 발행(published_at) 기능 도입
--   목적:
--     - 어드민이 시드 글을 미래 시각으로 예약 가능하게 한다.
--     - cron 없이 `published_at <= now()` 필터만으로 자동 노출.
--   변경 요약:
--     1) posts.published_at TIMESTAMPTZ 컬럼 추가
--     2) 정렬/필터용 인덱스 2개 추가
--     3) SELECT RLS 강화: 미래 published_at 비공개
--     4) INSERT RLS 추가: 어드민은 시드 계정 명의로 대리 게시 가능
-- =====================================================

-- 1. 컬럼 추가 (기본값 now() → 기존 즉시 게시 동작과 동일)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.posts.published_at IS
  '일반 사용자에게 노출되는 시각. 미래로 설정 시 예약 게시. 기본값 now() = 즉시 발행.';

-- 2. 과거 데이터 백필: 기존 게시글은 created_at 시점에 발행된 것으로 간주
UPDATE public.posts
   SET published_at = created_at
 WHERE published_at <> created_at;

-- 3. 인덱스 추가 (latest 정렬 + 카테고리별 정렬용)
CREATE INDEX IF NOT EXISTS idx_posts_published_desc
  ON public.posts USING btree (published_at DESC, id DESC)
  WHERE (is_deleted = false);

CREATE INDEX IF NOT EXISTS idx_posts_category_published
  ON public.posts USING btree (category_id, published_at DESC)
  WHERE (is_deleted = false);

-- 4. SELECT RLS 강화
-- 기존: is_deleted = false 만 체크 → 미래 시각 게시물도 노출됨
-- 변경: published_at <= now() 조건 추가
DROP POLICY IF EXISTS "posts_select_visible" ON public.posts;
CREATE POLICY "posts_select_visible"
  ON public.posts FOR SELECT
  USING (is_deleted = false AND published_at <= now());

-- posts_select_admin (is_admin()) 은 그대로 유지
-- → 어드민은 미래 시각 미발행 게시물도 볼 수 있음 (예약 목록 페이지용)

-- 5. INSERT RLS: 어드민이 다른 user_id(시드 계정)로 대리 게시 허용
DROP POLICY IF EXISTS "posts_insert_admin" ON public.posts;
CREATE POLICY "posts_insert_admin"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- posts_insert_self (auth.uid() = user_id) 는 그대로 유지
-- → 일반 사용자는 본인 명의로만 게시 가능
