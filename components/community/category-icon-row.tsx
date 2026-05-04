'use client'

/**
 * 카테고리 갤러리 아이콘 행 (F015)
 *
 * 인스타그램 스토리 스타일 원형 아이콘 가로 스크롤.
 * "全て"(전체) + 9개 카테고리 표시.
 * 클릭 시 URL ?category=slug 파라미터 변경 → SSR 재실행.
 * URL 파라미터 읽기 위해 useSearchParams() 사용 (Suspense 경계 필요).
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CATEGORIES } from '@/lib/community/categories'
import { cn } from '@/lib/utils'

/** "全て" 항목 포함 카테고리 목록 */
const ITEMS = [
  { slug: null as string | null, name: '全て', emoji: '⭕' },
  ...CATEGORIES.map((c) => ({ slug: c.slug as string | null, name: c.name, emoji: c.emoji })),
]

export function CategoryIconRow() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 현재 선택된 카테고리 슬러그 (없으면 null = 전체)
  const activeSlug = sp.get('category')

  /**
   * 카테고리 선택 처리
   * slug === null → ?category 파라미터 삭제 (전체 보기)
   * slug !== null → ?category=slug 로 변경
   */
  function handleSelect(slug: string | null): void {
    const params = new URLSearchParams(sp.toString())
    if (slug === null) {
      params.delete('category')
    } else {
      params.set('category', slug)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 py-3 snap-x snap-mandatory scrollbar-none"
      role="tablist"
      aria-label="カテゴリーフィルター"
    >
      {ITEMS.map((item) => {
        // 활성 상태 판정: 전체 항목은 activeSlug가 null일 때 활성
        const isActive =
          item.slug === null ? activeSlug === null : activeSlug === item.slug

        return (
          <button
            key={item.slug ?? '__all__'}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => handleSelect(item.slug)}
            className="shrink-0 snap-start flex flex-col items-center gap-1.5 min-w-16 min-h-[44px]"
          >
            {/* 원형 아이콘 영역 */}
            <div
              className={cn(
                'size-14 rounded-full flex items-center justify-center text-2xl transition-all',
                isActive
                  ? 'bg-primary/10 ring-2 ring-primary'
                  : 'bg-muted hover:bg-muted/80',
              )}
            >
              {item.emoji}
            </div>

            {/* 카테고리 이름 */}
            <span
              className={cn(
                'text-xs',
                isActive ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
