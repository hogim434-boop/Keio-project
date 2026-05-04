-- ============================================================
-- reports — 신고 (게시글·댓글 공용)
-- ============================================================
-- - reporter_id FK → profiles.id ON DELETE CASCADE
-- - target_type CHECK ('post', 'comment') — 표준 SQL multi-target FK 미지원
--   → target_id 의 존재성 검증은 application 레이어 책임
-- - reason CHECK (abuse | defamation | spam | illegal)
-- - description NULL 또는 ≤500자
-- - status CHECK (pending | processed | dismissed) DEFAULT pending
-- - UNIQUE(reporter_id, target_type, target_id) — 동일 신고자가 동일 대상 중복 신고 방지
-- - SELECT 는 admin 또는 본인(자기 신고 이력) 만 허용
-- - INSERT 는 본인만 (reporter_id = auth.uid())
-- - UPDATE / DELETE 는 admin 만 (status 전이는 어드민 큐에서 처리)
-- - updated_at 자동 갱신은 기존 public.set_updated_at() 재사용

CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type  TEXT         NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id    UUID         NOT NULL,
  reason       TEXT         NOT NULL CHECK (reason      IN ('abuse', 'defamation', 'spam', 'illegal')),
  description  TEXT                  CHECK (description IS NULL OR char_length(description) <= 500),
  status       TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'dismissed')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT reports_unique_per_reporter_target UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target
  ON public.reports (target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_select_admin_or_self ON public.reports;
DROP POLICY IF EXISTS reports_insert_self          ON public.reports;
DROP POLICY IF EXISTS reports_update_admin         ON public.reports;
DROP POLICY IF EXISTS reports_delete_admin         ON public.reports;

CREATE POLICY reports_select_admin_or_self
  ON public.reports FOR SELECT
  USING (public.is_admin() OR auth.uid() = reporter_id);

CREATE POLICY reports_insert_self
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY reports_update_admin
  ON public.reports FOR UPDATE
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY reports_delete_admin
  ON public.reports FOR DELETE
  USING (public.is_admin());

DROP TRIGGER IF EXISTS reports_set_updated_at ON public.reports;
CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.reports IS '신고 큐. UNIQUE(reporter_id,target_type,target_id) — admin 만 status 전이';
