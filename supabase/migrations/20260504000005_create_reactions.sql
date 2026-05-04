-- ============================================================
-- reactions — 추천/비추천 (게시글·댓글 공용)
-- ============================================================
-- - user_id   FK → profiles.id ON DELETE CASCADE
-- - target_type CHECK ('post', 'comment') — 표준 SQL 의 multi-target FK 미지원
--   → target_id 의 존재성 검증은 application 레이어 책임 (MVP)
-- - reaction CHECK ('up', 'down') — up↔down 토글은 reaction 컬럼 UPDATE
-- - UNIQUE(user_id, target_type, target_id) — 1인 1회 반응 보장
-- - SELECT 는 집계용 anon 포함 모두 허용 (PRD 데이터 모델 노트)
-- - INSERT / UPDATE 는 본인만, DELETE 는 본인 또는 admin
-- - posts.reaction_up / reaction_down 카운터 자동 갱신은 Task 009-4 트리거에서 처리

CREATE TABLE IF NOT EXISTS public.reactions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type  TEXT         NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id    UUID         NOT NULL,
  reaction     TEXT         NOT NULL CHECK (reaction    IN ('up',   'down')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT reactions_unique_per_user_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target
  ON public.reactions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user
  ON public.reactions (user_id, created_at DESC);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reactions_select_all  ON public.reactions;
DROP POLICY IF EXISTS reactions_insert_self ON public.reactions;
DROP POLICY IF EXISTS reactions_update_self ON public.reactions;
DROP POLICY IF EXISTS reactions_delete_self ON public.reactions;

CREATE POLICY reactions_select_all
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY reactions_insert_self
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reactions_update_self
  ON public.reactions FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reactions_delete_self
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

COMMENT ON TABLE public.reactions IS '추천/비추천. (user_id,target_type,target_id) UNIQUE — up/down 토글은 UPDATE';
