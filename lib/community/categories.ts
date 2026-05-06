/**
 * 카테고리(갤러리) 런타임 메타데이터 + 슬러그 lookup 헬퍼
 *
 * 5개 카테고리 (모두 topic). 표시명은 일본어,
 * F015 갤러리 아이콘 행 / write-bottom-sheet 카테고리 칩 / post-card 배지 등에서
 * emoji 와 함께 즉시 사용.
 *
 * 주의:
 *  - 본 CATEGORIES 의 sort_order / name 은 최신 시드 마이그레이션
 *    `supabase/migrations/20260506000000_resync_categories.sql` 의 결과 상태와
 *    1:1 일치해야 함. 변경 시 양쪽 동시 수정.
 *  - 신규 카테고리 추가 시 sort_order 60·70·... 슬롯 사용.
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

/** 5개 카테고리 — 모두 topic, sort_order 10·20·30·40·50 */
export const CATEGORIES: readonly CategoryMeta[] = [
  { slug: 'study',       name: '学業・授業',         type: 'topic', sort_order: 10, is_active: true, emoji: '📚' },
  { slug: 'job',         name: '就活',                type: 'topic', sort_order: 20, is_active: true, emoji: '💼' },
  { slug: 'school-life', name: '学校生活',           type: 'topic', sort_order: 30, is_active: true, emoji: '🏫' },
  { slug: 'club',        name: 'サークル・バイト',  type: 'topic', sort_order: 40, is_active: true, emoji: '🎯' },
  { slug: 'free',        name: '雑談',                type: 'topic', sort_order: 50, is_active: true, emoji: '🌸' },
] as const

/** 슬러그로 카테고리 메타 조회 (없으면 undefined) */
export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

/** 슬러그 → emoji (없으면 fallback '📌') */
export function getCategoryEmoji(slug: CategorySlug): string {
  return getCategoryBySlug(slug)?.emoji ?? '📌'
}
