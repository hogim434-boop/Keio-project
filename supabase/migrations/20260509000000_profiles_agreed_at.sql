-- ============================================================
-- profiles 테이블 확장: 동의 timestamp 컬럼 추가 (F013)
-- ============================================================
-- 배경:
--   F013 회원가입 동의 체크박스(利用規約 + コミュニティガイドライン) 도입에 따라
--   사용자의 동의 시점을 DB에 영속화해야 함.
--   signup/setup 단계에서 supabase.auth.updateUser({ data: { agreed_terms_at, agreed_guidelines_at } })
--   호출 → 트리거(handle_user_metadata_update)가 profiles.*_at 컬럼에 동기화하는 구조.
--
-- 정책:
--   - 첫 동의 시점만 기록 (NULL 가드: WHERE agreed_*_at IS NULL)
--   - 동의 후 재동의 시 timestamp 를 덮어쓰지 않음
--
-- 영향 범위:
--   - 기존 가입자: agreed_terms_at / agreed_guidelines_at 모두 NULL 허용 (backward-compatible)
--   - 신규 가입자: setup 페이지에서 동의 체크 후 updateUser 호출 시 자동 기록
-- ============================================================

-- 1. agreed_terms_at, agreed_guidelines_at 컬럼 추가
--    TIMESTAMPTZ: 시간대 정보 포함 (UTC 기준 저장)
--    NULL 허용: 기존 가입자 backward-compat
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agreed_terms_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreed_guidelines_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.agreed_terms_at      IS '利用規約 同意 일시 (F013). 첫 동의 시점만 기록.';
COMMENT ON COLUMN public.profiles.agreed_guidelines_at IS 'コミュニティガイドライン 同意 일시 (F013). 첫 동의 시점만 기록.';

-- 2. handle_user_metadata_update 트리거 함수 확장
--    기존 IF 블록 2개(password_set / nickname) 그대로 유지하고
--    신규 IF 블록 2개(agreed_terms_at / agreed_guidelines_at) 추가
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- IF 블록 1: 계정 설정 완료(/signup/setup) 시 campus/grade/department 동기화
  IF NEW.raw_user_meta_data->>'password_set' = 'true' THEN
    UPDATE public.profiles
    SET
      campus     = NEW.raw_user_meta_data->>'campus',
      grade      = NEW.raw_user_meta_data->>'grade',
      department = NEW.raw_user_meta_data->>'department',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;

  -- IF 블록 2: nickname 동기화 (마이페이지·프로필 설정에서 변경 시)
  IF NEW.raw_user_meta_data ? 'nickname'
     AND COALESCE(OLD.raw_user_meta_data->>'nickname', '') IS DISTINCT FROM (NEW.raw_user_meta_data->>'nickname') THEN
    UPDATE public.profiles
    SET
      nickname   = NEW.raw_user_meta_data->>'nickname',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;

  -- IF 블록 3: 利用規約 同意 timestamp 동기화 (첫 동의 시점만 기록, NULL 가드)
  IF NEW.raw_user_meta_data ? 'agreed_terms_at' THEN
    UPDATE public.profiles
    SET agreed_terms_at = (NEW.raw_user_meta_data->>'agreed_terms_at')::timestamptz,
        updated_at = now()
    WHERE id = NEW.id AND agreed_terms_at IS NULL;
  END IF;

  -- IF 블록 4: コミュニティガイドライン 同意 timestamp 동기화 (첫 동의 시점만 기록, NULL 가드)
  IF NEW.raw_user_meta_data ? 'agreed_guidelines_at' THEN
    UPDATE public.profiles
    SET agreed_guidelines_at = (NEW.raw_user_meta_data->>'agreed_guidelines_at')::timestamptz,
        updated_at = now()
    WHERE id = NEW.id AND agreed_guidelines_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;
