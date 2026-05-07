-- ============================================================
-- posts soft delete → comments cascade soft delete 트리거
-- ============================================================
-- - posts.is_deleted 가 false → true 로 전환될 때
--   해당 게시글에 달린 모든 댓글을 자동으로 soft delete
-- - SECURITY DEFINER: RLS 우회 필수
--   (게시글 작성자 != 댓글 작성자인 경우, 일반 사용자 권한으로는
--    타인 댓글의 is_deleted UPDATE 가 RLS 에 막히므로)
-- - 멱등성: DROP TRIGGER IF EXISTS 패턴으로 재실행 안전
-- - 1회성 backfill: 트리거 적용 이전에 이미 soft delete 된
--   게시글의 고아 댓글을 일괄 정리

-- 트리거 함수: posts soft delete 전이 감지 → comments 일괄 soft delete
CREATE OR REPLACE FUNCTION public.posts_soft_delete_cascade_comments()
RETURNS TRIGGER AS $$
BEGIN
  -- is_deleted 가 false → true 로 바뀌는 시점에만 실행
  IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE public.comments
       SET is_deleted = true
     WHERE post_id = NEW.id
       AND is_deleted = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS posts_soft_delete_cascade_comments_trigger
  ON public.posts;

CREATE TRIGGER posts_soft_delete_cascade_comments_trigger
  AFTER UPDATE OF is_deleted ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.posts_soft_delete_cascade_comments();

-- 1회성 backfill: 트리거 적용 이전에 이미 soft delete 된 게시글의 댓글 정리
UPDATE public.comments
   SET is_deleted = true
 WHERE is_deleted = false
   AND post_id IN (
     SELECT id FROM public.posts WHERE is_deleted = true
   );
