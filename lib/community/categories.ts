/**
 * 카테고리(갤러리) 런타임 메타데이터 + 슬러그 lookup 헬퍼
 *
 * 9개 초기 카테고리 (topic 6 + campus 3). 표시명은 일본어,
 * F015 갤러리 아이콘 행 / write-bottom-sheet 카테고리 칩 / post-card 배지 등에서
 * emoji 와 함께 즉시 사용.
 *
 * 주의:
 *  - 본 CATEGORIES 의 sort_order / name 은
 *    `supabase/migrations/20260504000010_seed_categories.sql` 의 INSERT 와
 *    1:1 일치해야 함. 변경 시 양쪽 동시 수정.
 *  - 향후 야가미·시나노마치·시바공립 추가 시 sort_order 140·150·160 슬롯 사용.
 */

import type { CategorySlug, CategoryType } from '@/types/community'

/** 단일 카테고리 메타 */
export interface CategoryMeta {
  slug: CategorySlug
  name: string
  type: CategoryType
  sort_order: number
  is_active: boolean
  emoji: string
}

/** 9개 초기 카테고리 — topic 10·20·30·40·50·60, campus 110·120·130 */
export const CATEGORIES: readonly CategoryMeta[] = [
  { slug: 'free',     name: '雑談',       type: 'topic',  sort_order: 10,  is_active: true, emoji: '🌸' },
  { slug: 'love',     name: '恋愛',       type: 'topic',  sort_order: 20,  is_active: true, emoji: '❤️' },
  { slug: 'study',    name: '学業・授業', type: 'topic',  sort_order: 30,  is_active: true, emoji: '📚' },
  { slug: 'job',      name: '就活',       type: 'topic',  sort_order: 40,  is_active: true, emoji: '💼' },
  { slug: 'daily',    name: '日常',       type: 'topic',  sort_order: 50,  is_active: true, emoji: '🍱' },
  { slug: 'question', name: '質問',       type: 'topic',  sort_order: 60,  is_active: true, emoji: '❓' },
  { slug: 'mita',     name: '三田',       type: 'campus', sort_order: 110, is_active: true, emoji: '🏛️' },
  { slug: 'hiyoshi',  name: '日吉',       type: 'campus', sort_order: 120, is_active: true, emoji: '🌳' },
  { slug: 'sfc',      name: 'SFC',        type: 'campus', sort_order: 130, is_active: true, emoji: '🌊' },
] as const

/** 슬러그로 카테고리 메타 조회 (없으면 undefined) */
export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

/** 슬러그 → emoji (없으면 fallback '📌') */
export function getCategoryEmoji(slug: CategorySlug): string {
  return getCategoryBySlug(slug)?.emoji ?? '📌'
}
