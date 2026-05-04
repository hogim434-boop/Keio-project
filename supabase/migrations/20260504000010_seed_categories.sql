-- ============================================================
-- categories 시드 — 9건 (topic 6 + campus 3)
-- ============================================================
-- - 표시명은 일본어. lib/community/categories.ts 의 CATEGORIES 와 1:1 일치
-- - sort_order: topic 10·20·30·40·50·60 / campus 110·120·130
--   향후 야가미/시나노마치/시바공립 추가 시 sort_order 140·150·160 슬롯 사용
-- - ON CONFLICT (slug) DO NOTHING — idempotent. 표시명/순서 변경은 별도 UPDATE 마이그레이션
-- - apply_migration 은 service_role 권한이라 RLS insert_admin 정책 우회 통과

INSERT INTO public.categories (slug, name, type, sort_order, is_active) VALUES
  ('free',     '雑談',       'topic',  10,  true),
  ('love',     '恋愛',       'topic',  20,  true),
  ('study',    '学業・授業', 'topic',  30,  true),
  ('job',      '就活',       'topic',  40,  true),
  ('daily',    '日常',       'topic',  50,  true),
  ('question', '質問',       'topic',  60,  true),
  ('mita',     '三田',       'campus', 110, true),
  ('hiyoshi',  '日吉',       'campus', 120, true),
  ('sfc',      'SFC',        'campus', 130, true)
ON CONFLICT (slug) DO NOTHING;
