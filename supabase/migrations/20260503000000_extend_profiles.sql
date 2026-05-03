-- ============================================================
-- profiles 테이블 확장: role(어드민 권한) + nickname(닉네임 정규화)
-- ============================================================
-- 목적:
--   1) ROADMAP Task 003에서 정의한 어드민/일반 사용자 권한 체계 도입
--   2) 기존 raw_user_meta_data.nickname 을 profiles.nickname 으로 정규화
--      → 강의 검색·리뷰 작성 등에서 user_metadata 직접 접근 없이 profiles 만 조회하도록
--
-- 안전장치:
--   - DROP/CREATE 절대 사용하지 않음 (운영 중인 데이터 보호)
--   - ADD COLUMN IF NOT EXISTS 패턴 → 재실행 안전 (idempotent)
--   - 기존 RLS 정책 변경 없음 (profiles_select_own / profiles_update_own 그대로)
-- ============================================================

-- 1. role 컬럼 추가 (어드민 권한)
--    DEFAULT 'user' 로 기존 row 모두 자동 채움
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. role CHECK 제약 (별도 ALTER 로 분리 → IF NOT EXISTS 호환)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- 3. nickname 컬럼 추가 (닉네임 정규화)
--    기존 raw_user_meta_data.nickname 값은 아래 5번 트리거가 동기화
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 4. 어드민 조회 성능 최적화 인덱스 (부분 인덱스 — 'admin' 만 인덱싱)
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin
  ON public.profiles (role)
  WHERE role = 'admin';

-- 5. handle_user_metadata_update 트리거 함수 확장
--    기존: campus/grade/department 동기화
--    추가: nickname 동기화 (raw_user_meta_data.nickname → profiles.nickname)
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 계정 설정 완료(/signup/setup) 시 campus/grade/department 동기화
  IF NEW.raw_user_meta_data->>'password_set' = 'true' THEN
    UPDATE public.profiles
    SET
      campus     = NEW.raw_user_meta_data->>'campus',
      grade      = NEW.raw_user_meta_data->>'grade',
      department = NEW.raw_user_meta_data->>'department',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;

  -- 닉네임 동기화 (마이페이지·프로필 설정에서 변경 시)
  IF NEW.raw_user_meta_data ? 'nickname'
     AND COALESCE(OLD.raw_user_meta_data->>'nickname', '') IS DISTINCT FROM (NEW.raw_user_meta_data->>'nickname') THEN
    UPDATE public.profiles
    SET
      nickname   = NEW.raw_user_meta_data->>'nickname',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. 마이그레이션 코멘트
COMMENT ON COLUMN public.profiles.role IS '사용자 권한: user(일반) | admin(어드민, 강의 등록·관리 가능)';
COMMENT ON COLUMN public.profiles.nickname IS '익명 리뷰 표시용 닉네임 (auth.users.raw_user_meta_data 와 동기화)';
