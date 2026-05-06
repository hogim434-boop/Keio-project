-- ============================================================
-- admin_resolve_report(p_report_id uuid, p_action text) RPC
-- ============================================================
-- 배경:
--   어드민 큐 페이지에서 신고(reports)를 검토·처리할 때 원자성과 일관성이
--   필요함. 단순 PostgREST UPDATE 로는 아래 두 가지를 보장할 수 없음:
--     1) 같은 target(post/comment)에 쌓인 모든 pending 신고를 동시에 처리
--     2) 동시 요청이 들어왔을 때 이중 처리(double-resolve) 방지
--
-- 해결:
--   SECURITY DEFINER 함수 내부에서 FOR UPDATE 로 낙관적 잠금을 획득,
--   트랜잭션 단위로 target soft-delete + 연관 신고 일괄 status 전이를 수행.
--   함수 owner=postgres(rolbypassrls=true)이므로 UPDATE/RLS 평가 우회.
--
-- 정책:
--   - 호출자는 반드시 role='admin' (is_admin() 가드)
--   - p_action: 'delete' → target soft-delete + 동일 target pending 전부 processed
--              'dismiss' → 동일 target pending 전부 dismissed
--   - 이미 pending 이 아닌 신고는 재처리 차단 (22023)
--
-- ERRCODE 매핑:
--   42501  insufficient_privilege — admin 이 아닌 호출자
--   P0002  no_data_found         — report_id 가 존재하지 않음
--   22023  invalid_parameter_value
--            └ p_action 이 'delete'/'dismiss' 이외의 값일 때
--            └ 이미 처리된(status <> 'pending') 신고를 재처리 시도할 때
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_resolve_report(
  p_report_id uuid,
  p_action    text  -- 'delete' | 'dismiss'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_type text;
  v_target_id   uuid;
  v_status      text;
BEGIN
  -- 1) admin 가드 — is_admin() 은 auth.uid() 기반이므로 NULL 세션도 차단됨
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only' USING ERRCODE = '42501';
  END IF;

  -- 2) action 유효성 검증
  IF p_action NOT IN ('delete', 'dismiss') THEN
    RAISE EXCEPTION 'invalid action: %. must be ''delete'' or ''dismiss''', p_action
      USING ERRCODE = '22023';
  END IF;

  -- 3) 신고 row 잠금 획득 + 존재 확인
  --    FOR UPDATE: 동시 요청이 같은 report 를 이중 처리하는 것을 방지
  SELECT target_type, target_id, status
    INTO v_target_type, v_target_id, v_status
  FROM public.reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'report not found: %', p_report_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 4) 이미 처리된 신고 재처리 차단 (낙관적 잠금)
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'already resolved (current status: %)', v_status
      USING ERRCODE = '22023';
  END IF;

  -- 5) action 분기
  IF p_action = 'delete' THEN
    -- 5-a) 대상 soft-delete
    --      is_deleted = false 조건: 이미 삭제된 경우엔 UPDATE 를 생략(무해)
    IF v_target_type = 'post' THEN
      UPDATE public.posts
        SET is_deleted = true
      WHERE id = v_target_id AND is_deleted = false;
    ELSIF v_target_type = 'comment' THEN
      UPDATE public.comments
        SET is_deleted = true
      WHERE id = v_target_id AND is_deleted = false;
    END IF;

    -- 5-b) 같은 target 에 쌓인 모든 pending 신고 → processed
    --      큐 재오염 방지: 삭제 처리 후 동일 target 이 다시 pending 으로 남아 있으면
    --      어드민 큐에 중복 노출되는 문제를 제거
    UPDATE public.reports
      SET status = 'processed', updated_at = now()
    WHERE target_type = v_target_type
      AND target_id   = v_target_id
      AND status      = 'pending';

  ELSE  -- dismiss
    -- 동일 target 의 모든 pending 신고 → dismissed
    UPDATE public.reports
      SET status = 'dismissed', updated_at = now()
    WHERE target_type = v_target_type
      AND target_id   = v_target_id
      AND status      = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'ok',         true,
    'targetType', v_target_type,
    'targetId',   v_target_id,
    'action',     p_action
  );
END;
$$;

-- PUBLIC·anon 차단 후 authenticated 만 허용
-- (SECURITY DEFINER 내부의 is_admin() 가드가 실질적 권한 제어 담당)
-- anon 을 명시적으로 차단: Supabase 는 PUBLIC REVOKE 후에도 anon 이 잔류하는 경우가 있음
REVOKE EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.admin_resolve_report(uuid, text) IS
  'admin 신고 처리 RPC. SECURITY DEFINER + is_admin() 가드 + 같은 target 일괄 갱신 + FOR UPDATE 낙관적 잠금. ERRCODE 컨벤션: 42501(미권한) / P0002(미존재) / 22023(invalid action 또는 이미 처리됨)';
