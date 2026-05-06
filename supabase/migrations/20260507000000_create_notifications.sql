-- ============================================================
-- 알림(notifications) 시스템 — 테이블 + RLS + 트리거 (Phase 1)
-- ============================================================
-- 학생들이 자기 글/댓글에 달린 댓글·답글·좋아요(👍)를 헤더 벨에서 확인할 수 있도록
-- 알림 데이터를 자동 생성하는 DB 기반.
--
-- 정책
--   - 다운보트(reaction='down')는 알림 생성 제외 (부정 피드백 루프 방지)
--   - 자기 자신의 행동은 알림 제외 (recipient <> actor)
--   - 클라이언트는 INSERT 불가 (트리거 SECURITY DEFINER만 INSERT 가능)
--   - 익명 표시는 UI 레이어 책임 (DB는 user_id 그대로 저장)
--
-- 참고 패턴: 20260504000008_create_counter_triggers.sql
-- ============================================================

-- ============================================================
-- 1) 테이블 생성
-- ============================================================
CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('comment','reply','reaction_post','reaction_comment')),
  post_id         uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id      uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reaction_kind   text CHECK (reaction_kind IN ('up','down')),
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- 자기 자신에게 알림 금지
  CONSTRAINT notif_no_self CHECK (recipient_id <> actor_id),

  -- type 별 페이로드 일관성 보장
  CONSTRAINT notif_payload_check CHECK (
       (type IN ('comment','reply')   AND comment_id IS NOT NULL AND post_id IS NOT NULL)
    OR (type = 'reaction_post'         AND post_id    IS NOT NULL AND reaction_kind IS NOT NULL)
    OR (type = 'reaction_comment'      AND comment_id IS NOT NULL AND reaction_kind IS NOT NULL)
  )
);

COMMENT ON TABLE public.notifications IS '사용자 알림 (댓글·답글·좋아요). 트리거가 자동 생성.';

-- ============================================================
-- 2) 인덱스
-- ============================================================
-- 헤더 패널 최신순 조회용
CREATE INDEX idx_notif_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

-- 미읽음 카운트(벨 배지)용 partial index
CREATE INDEX idx_notif_recipient_unread
  ON public.notifications (recipient_id)
  WHERE is_read = false;

-- 토글 중복 방지: 같은 사람이 같은 게시글에 up 토글 반복해도 1행만 유지
CREATE UNIQUE INDEX uniq_notif_reaction_post
  ON public.notifications (recipient_id, actor_id, post_id)
  WHERE type = 'reaction_post';

CREATE UNIQUE INDEX uniq_notif_reaction_comment
  ON public.notifications (recipient_id, actor_id, comment_id)
  WHERE type = 'reaction_comment';

-- 댓글 1건당 알림 1건 (트리거 재발화 방지 안전장치)
CREATE UNIQUE INDEX uniq_notif_comment
  ON public.notifications (comment_id)
  WHERE type IN ('comment','reply');

-- ============================================================
-- 3) RLS 정책 — INSERT 정책은 일부러 만들지 않음 (클라이언트 차단)
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE
  USING      (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY notif_delete_own ON public.notifications
  FOR DELETE USING (recipient_id = auth.uid());

-- ============================================================
-- 4) 트리거 함수 1: 댓글 INSERT → 알림 생성
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_comment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_user    uuid;
  v_post_deleted boolean;
  v_parent_user  uuid;
  v_parent_del   boolean;
BEGIN
  -- 게시글 정보 조회
  SELECT user_id, is_deleted
    INTO v_post_user, v_post_deleted
    FROM public.posts WHERE id = NEW.post_id;

  -- 삭제된 게시글이면 알림 생성 안 함
  IF v_post_deleted THEN
    RETURN NEW;
  END IF;

  -- 일반 댓글: 게시글 작성자에게 알림
  IF NEW.parent_id IS NULL THEN
    IF NEW.user_id <> v_post_user THEN
      INSERT INTO public.notifications
        (recipient_id, actor_id, type, post_id, comment_id)
      VALUES
        (v_post_user, NEW.user_id, 'comment', NEW.post_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;

  -- 답글: 부모 댓글 작성자에게만 알림 (게시글 작성자에게는 보내지 않음)
  ELSE
    SELECT user_id, is_deleted
      INTO v_parent_user, v_parent_del
      FROM public.comments WHERE id = NEW.parent_id;

    IF NOT v_parent_del AND NEW.user_id <> v_parent_user THEN
      INSERT INTO public.notifications
        (recipient_id, actor_id, type, post_id, comment_id)
      VALUES
        (v_parent_user, NEW.user_id, 'reply', NEW.post_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public.notify_on_comment_insert() FROM PUBLIC;

-- ============================================================
-- 5) 트리거 함수 2: 리액션 INSERT → 알림 생성 (다운보트 제외)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_reaction_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_user    uuid;
  v_target_deleted boolean;
  v_post_id        uuid;
BEGIN
  -- 다운보트는 알림 생성 안 함
  IF NEW.reaction = 'down' THEN
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'post' THEN
    SELECT user_id, is_deleted
      INTO v_target_user, v_target_deleted
      FROM public.posts WHERE id = NEW.target_id;

    -- 삭제된 게시글 또는 자기 자신 행동은 skip
    IF v_target_deleted OR v_target_user = NEW.user_id THEN
      RETURN NEW;
    END IF;

    -- UPSERT — 토글 시 created_at 갱신 + is_read 리셋
    INSERT INTO public.notifications
      (recipient_id, actor_id, type, post_id, reaction_kind)
    VALUES
      (v_target_user, NEW.user_id, 'reaction_post', NEW.target_id, NEW.reaction)
    ON CONFLICT (recipient_id, actor_id, post_id) WHERE type = 'reaction_post'
    DO UPDATE SET created_at = now(), is_read = false;

  ELSIF NEW.target_type = 'comment' THEN
    SELECT user_id, is_deleted, post_id
      INTO v_target_user, v_target_deleted, v_post_id
      FROM public.comments WHERE id = NEW.target_id;

    IF v_target_deleted OR v_target_user = NEW.user_id THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications
      (recipient_id, actor_id, type, post_id, comment_id, reaction_kind)
    VALUES
      (v_target_user, NEW.user_id, 'reaction_comment', v_post_id, NEW.target_id, NEW.reaction)
    ON CONFLICT (recipient_id, actor_id, comment_id) WHERE type = 'reaction_comment'
    DO UPDATE SET created_at = now(), is_read = false;
  END IF;

  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public.notify_on_reaction_insert() FROM PUBLIC;

-- ============================================================
-- 6) 트리거 부착
-- ============================================================
DROP TRIGGER IF EXISTS trg_notify_on_comment_insert ON public.comments;
CREATE TRIGGER trg_notify_on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment_insert();

DROP TRIGGER IF EXISTS trg_notify_on_reaction_insert ON public.reactions;
CREATE TRIGGER trg_notify_on_reaction_insert
  AFTER INSERT ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction_insert();
