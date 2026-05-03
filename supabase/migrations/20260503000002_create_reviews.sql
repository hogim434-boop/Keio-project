-- ============================================================
-- reviews 테이블 신규 생성 (5축 강의 리뷰)
-- ============================================================
-- 목적:
--   ROADMAP Task 003 — 5축 평점 리뷰 영구 저장소
--   PRD 13컬럼 (id + 12 + updated_at = 14)
--
-- 핵심 설계:
--   - 5축 평점은 INT NOT NULL CHECK BETWEEN 1 AND 5
--   - UNIQUE(course_id, user_id) — 한 사용자는 한 강의당 1개 리뷰만
--   - body 1000자 제한 (length() 함수, 일본어 글자 수 기준)
--   - is_anonymous 항상 TRUE (MVP 고정, F006 익명 리뷰)
--
-- 트리거:
--   - AFTER INSERT/UPDATE/DELETE → courses.avg_rating, review_count 자동 갱신
--   - 트리거 함수: SECURITY DEFINER + search_path = public (기존 패턴 따름)
--
-- RLS:
--   - SELECT: 누구나 (강의 상세 페이지에서 모든 리뷰 표시)
--   - INSERT/UPDATE/DELETE: auth.uid() = user_id (본인만)
-- ============================================================

-- 1. reviews 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 외래키
  course_id                UUID         NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id                  UUID         NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,

  -- 수강 정보
  taken_semester           TEXT         NOT NULL,            -- 사용자가 수강한 학기 (예: '2024-fall')

  -- 5축 평점 (1~5 정수, NOT NULL)
  rating_overall           INTEGER      NOT NULL,            -- 종합 평점
  rating_attendance        INTEGER      NOT NULL,            -- 출석 체크 빈도
  rating_exam_difficulty   INTEGER      NOT NULL,            -- 시험·과제 난이도
  rating_grading_ease      INTEGER      NOT NULL,            -- 학점 취득 용이도
  rating_teaching_style    INTEGER      NOT NULL,            -- 강의 스타일 만족도

  -- 강의 스타일 태그 (멀티 선택)
  teaching_style_tags      TEXT[]       NOT NULL DEFAULT '{}',

  -- 본문
  body                     TEXT,                              -- 리뷰 텍스트 (선택, 최대 1000자)
  is_anonymous             BOOLEAN      NOT NULL DEFAULT TRUE, -- 익명 표시 (MVP 고정 TRUE)

  -- 메타
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),

  -- 중복 리뷰 차단
  CONSTRAINT reviews_unique_course_user UNIQUE (course_id, user_id)
);

-- 2. CHECK 제약 (5축 평점 + body 길이) — DO 블록으로 idempotent 보장
DO $$
BEGIN
  -- 5축 평점 1~5 정수 검증 (배열로 묶어서 5건 생성)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_overall_check' AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_overall_check
      CHECK (rating_overall BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_attendance_check' AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_attendance_check
      CHECK (rating_attendance BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_exam_difficulty_check' AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_exam_difficulty_check
      CHECK (rating_exam_difficulty BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_grading_ease_check' AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_grading_ease_check
      CHECK (rating_grading_ease BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_rating_teaching_style_check' AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_rating_teaching_style_check
      CHECK (rating_teaching_style BETWEEN 1 AND 5);
  END IF;

  -- 본문 길이 제한 (1000자, 일본어 기준)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_body_length_check' AND conrelid = 'public.reviews'::regclass
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_body_length_check
      CHECK (body IS NULL OR length(body) <= 1000);
  END IF;
END $$;

-- 3. 인덱스 — 강의별·사용자별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reviews_course_id  ON public.reviews (course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);

-- 4. RLS 활성화
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 — SELECT 전체 공개
DROP POLICY IF EXISTS reviews_select_all ON public.reviews;
CREATE POLICY reviews_select_all
  ON public.reviews
  FOR SELECT
  USING (true);

-- 6. RLS 정책 — INSERT 본인만
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS 정책 — UPDATE 본인만
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS 정책 — DELETE 본인만
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
CREATE POLICY reviews_delete_own
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- 9. courses.avg_rating, review_count 자동 갱신 트리거 함수
--    - rating_overall 평균만 캐시 (단순화, 5축 전체 평균은 SELECT 시 계산)
--    - INSERT/UPDATE/DELETE 모두 처리: NEW 또는 OLD 의 course_id 사용
CREATE OR REPLACE FUNCTION public.refresh_course_avg_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_id UUID;
BEGIN
  -- DELETE 시에는 NEW 가 NULL → OLD 사용
  target_id := COALESCE(NEW.course_id, OLD.course_id);

  UPDATE public.courses
  SET
    avg_rating = (
      SELECT ROUND(AVG(rating_overall)::numeric, 2)
      FROM public.reviews
      WHERE course_id = target_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE course_id = target_id
    ),
    updated_at = now()
  WHERE id = target_id;

  -- AFTER 트리거 → 반환값은 무시되지만 표준 패턴
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 10. 리뷰 변경 트리거 (INSERT/UPDATE/DELETE 모두)
DROP TRIGGER IF EXISTS reviews_refresh_course_avg ON public.reviews;
CREATE TRIGGER reviews_refresh_course_avg
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_course_avg_rating();

-- 11. updated_at 자동 갱신 트리거 (기존 set_updated_at 함수 재사용)
DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. 코멘트
COMMENT ON TABLE  public.reviews IS '강의 5축 평점 리뷰 — UNIQUE(course_id, user_id)로 중복 차단';
COMMENT ON COLUMN public.reviews.taken_semester IS '사용자가 수강한 학기 (예: 2024-fall) — 평점 신뢰도 가중치 산정용';
COMMENT ON COLUMN public.reviews.rating_overall IS '종합 평점 (1~5) — courses.avg_rating 캐시 대상';
COMMENT ON COLUMN public.reviews.body IS '리뷰 텍스트 (선택, 최대 1000자)';
COMMENT ON COLUMN public.reviews.is_anonymous IS '익명 표시 여부 (MVP에서 항상 TRUE 고정)';
COMMENT ON FUNCTION public.refresh_course_avg_rating IS 'reviews INSERT/UPDATE/DELETE 시 courses.avg_rating, review_count 자동 갱신';
