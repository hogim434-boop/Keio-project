-- 자유 게시판 피벗으로 강의 도메인 폐기 (ROADMAP Task 007)
-- 의존성 안전 순서: 트리거 → 함수 → 자식 테이블(reviews) → 부모 테이블(courses)
-- reviews.course_id 가 courses.id 를 FK 참조하므로 reviews 를 먼저 DROP

DROP TRIGGER IF EXISTS reviews_refresh_course_avg ON public.reviews;
DROP TRIGGER IF EXISTS reviews_set_updated_at      ON public.reviews;

DROP FUNCTION IF EXISTS public.refresh_course_avg_rating();

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
