-- ============================================================
-- categories 재편 — 9 → 5 (캠퍼스 카테고리 제거, topic 5개로 단순화)
-- ============================================================
-- 학생들이 글 작성 시 분류 기준을 즉시 판단할 수 있도록 카테고리를 단일 축으로 정리.
--
-- 변경 내용
--   삭제 슬러그: love, daily, question, mita, hiyoshi, sfc
--   신규 슬러그: school-life (学校生活), club (サークル・バイト)
--   유지 슬러그: study, job, free  (sort_order 재배치)
--
-- 안전장치
--   posts.category_id FK는 ON DELETE RESTRICT 이므로
--   삭제 대상 카테고리에 속한 게시글을 먼저 'free'로 옮긴 뒤 카테고리 행 DELETE.
--
-- 정합성
--   lib/community/categories.ts 의 CATEGORIES 배열과 1:1 일치해야 함.
--   apply_migration 은 service_role 권한 → admin 전용 RLS 우회 가능.
-- ============================================================

BEGIN;

-- 1) 신규 카테고리 INSERT (재실행 시 UPDATE — idempotent)
INSERT INTO public.categories (slug, name, type, sort_order, is_active) VALUES
  ('school-life', '学校生活',          'topic', 30, true),
  ('club',        'サークル・バイト',  'topic', 40, true)
ON CONFLICT (slug) DO UPDATE
  SET name       = EXCLUDED.name,
      type       = EXCLUDED.type,
      sort_order = EXCLUDED.sort_order,
      is_active  = EXCLUDED.is_active;

-- 2) 기존 유지 카테고리의 정렬 순서·이름 동기화
UPDATE public.categories SET name = '学業・授業', sort_order = 10, is_active = true WHERE slug = 'study';
UPDATE public.categories SET name = '就活',       sort_order = 20, is_active = true WHERE slug = 'job';
UPDATE public.categories SET name = '雑談',       sort_order = 50, is_active = true WHERE slug = 'free';

-- 3) 삭제 대상 카테고리의 게시글을 'free'로 이관 (FK RESTRICT 회피)
UPDATE public.posts
   SET category_id = (SELECT id FROM public.categories WHERE slug = 'free')
 WHERE category_id IN (
   SELECT id FROM public.categories
    WHERE slug IN ('love', 'daily', 'question', 'mita', 'hiyoshi', 'sfc')
 );

-- 4) 삭제 대상 카테고리 DELETE
DELETE FROM public.categories
 WHERE slug IN ('love', 'daily', 'question', 'mita', 'hiyoshi', 'sfc');

COMMIT;

COMMENT ON TABLE public.categories
  IS '게시판 카테고리. 5개 (study/job/school-life/club/free) — 2026-05-06 재편';
