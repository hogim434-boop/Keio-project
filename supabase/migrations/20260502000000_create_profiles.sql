-- ============================================================
-- 회원 프로필 테이블 및 연동 트리거
-- 적용 방법: Supabase 대시보드 → SQL Editor에 붙여넣기 후 실행
-- ============================================================

-- 1. profiles 테이블 생성
--    auth.users 와 1:1 로 연결. 가입 완료 시 campus/grade/department 저장
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  campus      TEXT,
  grade       TEXT,
  department  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Row Level Security 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 본인 프로필 조회 허용 (로그인한 사용자 본인만)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 4. 본인 프로필 수정 허용
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. profiles 수정 시 updated_at 자동 갱신 트리거
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. 신규 사용자 가입 시 profiles 레코드 자동 생성 함수
--    Google OAuth 완료 직후 auth.users 에 INSERT 되면 실행됨
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 8. auth.users INSERT 트리거 (신규 가입 감지)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. 계정 설정 완료(/signup/setup) 시 campus/grade/department 동기화 함수
--    setup 페이지에서 supabase.auth.updateUser({ data: { password_set: true, campus, ... } }) 호출 시 실행됨
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'password_set' = 'true' THEN
    UPDATE public.profiles
    SET
      campus     = NEW.raw_user_meta_data->>'campus',
      grade      = NEW.raw_user_meta_data->>'grade',
      department = NEW.raw_user_meta_data->>'department',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 10. auth.users user_metadata 변경 트리거
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_metadata_update();

-- 11. 관리자 확인용 뷰 (Supabase 대시보드 Table Editor → Views 에서 확인 가능)
--     auth.users + profiles 를 합쳐 한눈에 회원 목록을 볼 수 있음
CREATE OR REPLACE VIEW public.user_list AS
SELECT
  u.id,
  u.email,
  p.campus,
  p.grade,
  p.department,
  (u.raw_user_meta_data->>'password_set')::boolean AS setup_complete,
  u.created_at       AS joined_at,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
