-- ============================================================
-- soft_delete_comment(p_id uuid) RPC
-- ============================================================
-- 사유:
--   PostgREST 경유 UPDATE 가 어떤 환경 요인(쿠키/JWT 전달 누락 등)으로
--   RLS 평가 컨텍스트의 auth.uid() 를 NULL 로 만들어 본인 댓글 update
--   시 `comments_update_self` WITH CHECK (auth.uid() = user_id) 가 결정적
--   으로 false → "new row violates row-level security policy" 발생.
--
--   role=admin 일 때는 `comments_update_admin` 의 is_admin()=true 로
--   통과하지만, role=user 는 self 정책으로만 평가되어 실패.
--
-- 해결:
--   SECURITY DEFINER 함수 안에서 auth.uid() 로 호출자 식별 + 본인/admin
--   가드 + UPDATE 를 캡슐화. 함수 owner=postgres(rolbypassrls=true)이므로
--   RLS 평가 자체를 우회. 보안 동등(본인 또는 admin 만 통과).
--
-- 권한:
--   anon 차단, authenticated 만 EXECUTE.

CREATE OR REPLACE FUNCTION public.soft_delete_comment(p_id uuid)
RETURNS public.comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.comments;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row FROM public.comments WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.user_id <> v_uid AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  UPDATE public.comments
     SET is_deleted = true
   WHERE id = p_id
   RETURNING * INTO v_row;

  RETURN v_row;
END
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_comment(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.soft_delete_comment(uuid) TO authenticated;

COMMENT ON FUNCTION public.soft_delete_comment(uuid)
  IS '댓글 soft delete. 호출자(auth.uid()) 본인 또는 admin 만 허용. RLS 우회.';
