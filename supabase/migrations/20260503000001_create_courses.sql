-- ============================================================
-- courses 테이블 신규 생성 (강의 정보)
-- ============================================================
-- 목적:
--   ROADMAP Task 003 — 강의 정보 영구 저장소
--   PRD 14컬럼 + day_period/classroom 추가 (PDF 추출 데이터 호환)
--
-- 검색·필터 성능:
--   - pg_trgm 확장 활성화 → name/professor ILIKE 검색을 GIN 인덱스로 가속 (Task 009)
--   - campus/faculty/semester 단일 인덱스 → 필터 쿼리 최적화 (Task 007)
--
-- RLS:
--   - 누구나 SELECT 가능 (비로그인 포함, MVP에서 강의 목록은 공개)
--   - INSERT/UPDATE/DELETE 는 어드민(profiles.role='admin')만 허용
--
-- 캐시 컬럼:
--   - avg_rating, review_count 는 reviews 트리거(Sub 4)가 자동 갱신
-- ============================================================

-- 1. pg_trgm 확장 (ILIKE 검색 가속용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. courses 테이블 생성
CREATE TABLE IF NOT EXISTS public.courses (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 강의 기본 정보
  name              TEXT         NOT NULL,                -- 강의명 (일본어)
  name_en           TEXT,                                 -- 강의명 (영어, 선택)
  professor         TEXT         NOT NULL,                -- 교수명

  -- 분류
  campus            TEXT         NOT NULL,                -- 캠퍼스 (CHECK 제약 별도 추가)
  faculty           TEXT         NOT NULL,                -- 학부/학과 (예: '경제학부', '理工学部')
  semester          TEXT         NOT NULL,                -- 학기 코드 (예: '2026-spring')
  language          TEXT         NOT NULL DEFAULT 'ja',   -- 강의 언어 (ja/en)

  -- 학사 메타
  requirement_type  TEXT,                                 -- 이수 구분 (필수/선택/자유) — 데이터 부재 시 nullable
  has_textbook      BOOLEAN      NOT NULL DEFAULT FALSE,  -- 교재 사용 여부
  enrollment_size   TEXT,                                 -- 수강 인원 규모 (소/중/대) — 미정 데이터 많아 nullable

  -- 시간·장소 (PDF 추출 데이터)
  day_period        TEXT,                                 -- 요일·시한 (예: '月1', '火2,3')
  classroom         TEXT,                                 -- 교실 (예: 'D401')

  -- 캐시 (reviews 트리거가 자동 갱신)
  avg_rating        DECIMAL(3, 2),                        -- 종합 평점 평균 (0.00~5.00)
  review_count      INTEGER      NOT NULL DEFAULT 0,      -- 리뷰 수

  -- 메타
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 3. CHECK 제약 (DO 블록으로 idempotent 보장)
DO $$
BEGIN
  -- 캠퍼스 CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_campus_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_campus_check
      CHECK (campus IN ('미타', '히요시', 'SFC', '야가미', '시나노마치', '시바공립'));
  END IF;

  -- 강의 언어 CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_language_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_language_check
      CHECK (language IN ('ja', 'en'));
  END IF;

  -- 이수 구분 CHECK (nullable, 값이 있을 때만 검증)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_requirement_type_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_requirement_type_check
      CHECK (requirement_type IS NULL OR requirement_type IN ('필수', '선택', '자유'));
  END IF;

  -- 수강 인원 규모 CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_enrollment_size_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_enrollment_size_check
      CHECK (enrollment_size IS NULL OR enrollment_size IN ('소', '중', '대'));
  END IF;

  -- avg_rating 범위 CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_avg_rating_check' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_avg_rating_check
      CHECK (avg_rating IS NULL OR (avg_rating >= 0 AND avg_rating <= 5));
  END IF;
END $$;

-- 4. 인덱스 — 필터 쿼리 (Task 007 강의 목록)
CREATE INDEX IF NOT EXISTS idx_courses_campus    ON public.courses (campus);
CREATE INDEX IF NOT EXISTS idx_courses_faculty   ON public.courses (faculty);
CREATE INDEX IF NOT EXISTS idx_courses_semester  ON public.courses (semester);
CREATE INDEX IF NOT EXISTS idx_courses_language  ON public.courses (language);

-- 5. GIN 인덱스 — ILIKE 검색 가속 (Task 009 검색)
CREATE INDEX IF NOT EXISTS idx_courses_name_trgm
  ON public.courses USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courses_professor_trgm
  ON public.courses USING GIN (professor gin_trgm_ops);

-- 6. RLS 활성화
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 — SELECT 전체 공개
DROP POLICY IF EXISTS courses_select_all ON public.courses;
CREATE POLICY courses_select_all
  ON public.courses
  FOR SELECT
  USING (true);

-- 8. RLS 정책 — INSERT 어드민만
DROP POLICY IF EXISTS courses_insert_admin ON public.courses;
CREATE POLICY courses_insert_admin
  ON public.courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. RLS 정책 — UPDATE 어드민만
DROP POLICY IF EXISTS courses_update_admin ON public.courses;
CREATE POLICY courses_update_admin
  ON public.courses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. RLS 정책 — DELETE 어드민만
DROP POLICY IF EXISTS courses_delete_admin ON public.courses;
CREATE POLICY courses_delete_admin
  ON public.courses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 11. updated_at 자동 갱신 트리거 (기존 set_updated_at 함수 재사용)
DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. 코멘트
COMMENT ON TABLE  public.courses IS '게이오 대학 강의 정보 (PRD 14컬럼 + day_period/classroom)';
COMMENT ON COLUMN public.courses.semester IS '학기 코드 형식: YYYY-(spring|fall|spring-first|spring-second|fall-first|fall-second|intensive|year-long)';
COMMENT ON COLUMN public.courses.day_period IS '요일·시한 (예: 月1, 火2,3) — PDF 추출 데이터';
COMMENT ON COLUMN public.courses.avg_rating IS '종합 평점 평균 (0.00~5.00) — reviews 트리거가 자동 갱신';
COMMENT ON COLUMN public.courses.review_count IS '리뷰 수 — reviews 트리거가 자동 갱신';
