-- ============================================================
-- posts 캐시 컬럼 자동 갱신 트리거
-- ============================================================
-- - reactions  INSERT / UPDATE / DELETE → posts.reaction_up / reaction_down 증감
-- - comments   INSERT / UPDATE / DELETE → posts.comment_count            증감
--
-- 보안 옵션:
--  - SECURITY DEFINER : 함수 정의자(보통 postgres) 권한으로 posts UPDATE
--    (일반 사용자는 posts_update_self 정책으로 타인 posts UPDATE 불가)
--    함수 본문은 단순 UPDATE 만 수행, 동적 SQL 미사용 → escalation 위험 없음
--  - SET search_path = public : advisor function_search_path_mutable 회피
--  - GREATEST(0, ...) : 정합 깨졌을 때 음수 방지 floor
--
-- 가정 / 한계:
--  - reaction UPDATE 는 reaction 컬럼만 변경 (target_type/target_id 변경 차단은 application 책임)
--  - comments 대상 reactions 카운터는 별도 컬럼 미보유로 본 트리거 범위 밖

-- ----- reactions → posts.reaction_up / reaction_down ------------------

CREATE OR REPLACE FUNCTION public.reactions_apply_post_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE public.posts
       SET reaction_up   = reaction_up   + (NEW.reaction = 'up')::int,
           reaction_down = reaction_down + (NEW.reaction = 'down')::int
     WHERE id = NEW.target_id;

  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE public.posts
       SET reaction_up   = GREATEST(0, reaction_up   - (OLD.reaction = 'up')::int),
           reaction_down = GREATEST(0, reaction_down - (OLD.reaction = 'down')::int)
     WHERE id = OLD.target_id;

  ELSIF TG_OP = 'UPDATE' AND NEW.target_type = 'post' AND OLD.reaction <> NEW.reaction THEN
    UPDATE public.posts
       SET reaction_up   = GREATEST(0, reaction_up   + (NEW.reaction = 'up')::int   - (OLD.reaction = 'up')::int),
           reaction_down = GREATEST(0, reaction_down + (NEW.reaction = 'down')::int - (OLD.reaction = 'down')::int)
     WHERE id = NEW.target_id;
  END IF;

  RETURN NULL;
END
$$;

COMMENT ON FUNCTION public.reactions_apply_post_counter()
  IS 'reactions 변경 시 posts.reaction_up/reaction_down 자동 갱신. SECURITY DEFINER 로 RLS 우회';

DROP TRIGGER IF EXISTS reactions_after_change ON public.reactions;
CREATE TRIGGER reactions_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.reactions_apply_post_counter();

-- ----- comments → posts.comment_count ---------------------------------

CREATE OR REPLACE FUNCTION public.comments_apply_post_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE public.posts
       SET comment_count = comment_count + 1
     WHERE id = NEW.post_id;

  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
    UPDATE public.posts
       SET comment_count = GREATEST(0, comment_count - 1)
     WHERE id = OLD.post_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted IS DISTINCT FROM NEW.is_deleted THEN
    IF NEW.is_deleted = true THEN
      UPDATE public.posts
         SET comment_count = GREATEST(0, comment_count - 1)
       WHERE id = NEW.post_id;
    ELSE
      UPDATE public.posts
         SET comment_count = comment_count + 1
       WHERE id = NEW.post_id;
    END IF;
  END IF;

  RETURN NULL;
END
$$;

COMMENT ON FUNCTION public.comments_apply_post_counter()
  IS 'comments 변경 시 posts.comment_count 자동 갱신 (soft-delete 토글 포함). SECURITY DEFINER 로 RLS 우회';

DROP TRIGGER IF EXISTS comments_after_change ON public.comments;
CREATE TRIGGER comments_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.comments_apply_post_counter();
