-- 환영 모달 1회 표시를 위한 컬럼
-- NULL = 아직 환영 모달 안 본 사용자
-- timestamptz = 환영 모달 닫은 시각

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

COMMENT ON COLUMN public.profiles.onboarded_at IS '환영 모달 최초 닫은 시각. NULL이면 모달 미표시 상태.';
