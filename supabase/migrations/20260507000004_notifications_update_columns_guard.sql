-- ============================================================
-- notifications UPDATE 시 변경 가능 컬럼을 is_read 만으로 제한 (보안 강화)
-- ============================================================
-- 배경:
--   notif_update_own RLS는 row 단위 제어만 가능 → 사용자가 본인 알림의
--   type, actor_id, post_id 등 메타 필드까지 자유롭게 변조 가능했음.
--
-- 해결:
--   BEFORE UPDATE 트리거에서 OLD/NEW 비교, is_read 외 컬럼 변경 시 RAISE.
--   트리거는 RLS 통과한 행에 대해서만 호출되므로 본인 알림에 한정됨.
--
-- 영향:
--   - 정상 사용 (markRead/markAllRead via PATCH /api/notifications)는 영향 없음
--   - 트리거가 발화하는 시나리오는 다른 컬럼을 동시 변경 시도할 때만
-- ============================================================

CREATE OR REPLACE FUNCTION public.notifications_only_is_read_can_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- recipient_id, actor_id, type, post_id, comment_id, reaction_kind, created_at 변경 차단
  IF NEW.recipient_id  IS DISTINCT FROM OLD.recipient_id  OR
     NEW.actor_id      IS DISTINCT FROM OLD.actor_id      OR
     NEW.type          IS DISTINCT FROM OLD.type          OR
     NEW.post_id       IS DISTINCT FROM OLD.post_id       OR
     NEW.comment_id    IS DISTINCT FROM OLD.comment_id    OR
     NEW.reaction_kind IS DISTINCT FROM OLD.reaction_kind OR
     NEW.created_at    IS DISTINCT FROM OLD.created_at    THEN
    RAISE EXCEPTION 'notifications: is_read 외 컬럼은 UPDATE 할 수 없습니다 (column %)',
      CASE
        WHEN NEW.recipient_id  IS DISTINCT FROM OLD.recipient_id  THEN 'recipient_id'
        WHEN NEW.actor_id      IS DISTINCT FROM OLD.actor_id      THEN 'actor_id'
        WHEN NEW.type          IS DISTINCT FROM OLD.type          THEN 'type'
        WHEN NEW.post_id       IS DISTINCT FROM OLD.post_id       THEN 'post_id'
        WHEN NEW.comment_id    IS DISTINCT FROM OLD.comment_id    THEN 'comment_id'
        WHEN NEW.reaction_kind IS DISTINCT FROM OLD.reaction_kind THEN 'reaction_kind'
        ELSE 'created_at'
      END
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;
  RETURN NEW;
END;
$$;

-- 트리거 함수 직접 호출 차단 (트리거 엔진 경유만 허용)
REVOKE EXECUTE ON FUNCTION public.notifications_only_is_read_can_change() FROM PUBLIC;

-- 기존 트리거가 있으면 교체
DROP TRIGGER IF EXISTS trg_notifications_only_is_read_can_change ON public.notifications;
CREATE TRIGGER trg_notifications_only_is_read_can_change
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_only_is_read_can_change();
