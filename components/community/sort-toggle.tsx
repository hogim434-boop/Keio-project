'use client'

/**
 * 정렬 토글 컴포넌트
 *
 * 최신(最新) / 인기(人気) 두 가지 정렬 옵션을 세그먼트 스타일로 제공.
 * sticky top-0 z-20 으로 스크롤 시 상단 고정.
 * URL ?sort 파라미터 변경 → SSR 재실행.
 * useSearchParams() 사용 (Suspense 경계 필요).
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/** 정렬 옵션 목록 */
const OPTIONS = [
  { value: 'latest', label: '最新' },
  { value: 'popular', label: '人気' },
] as const

type SortValue = (typeof OPTIONS)[number]['value']

export function SortToggle() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 현재 정렬 옵션 (기본값: latest)
  const sort: SortValue = sp.get('sort') === 'popular' ? 'popular' : 'latest'

  /**
   * 정렬 옵션 선택 처리
   * URL ?sort 파라미터를 업데이트하고 router.push 로 이동
   */
  function handleSelect(value: SortValue): void {
    const params = new URLSearchParams(sp.toString())
    params.set('sort', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
      <div
        className="flex gap-1 mx-4 my-2 p-1 rounded-full bg-muted"
        role="tablist"
        aria-label="並び順"
      >
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={sort === o.value}
            onClick={() => handleSelect(o.value)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-full transition-colors min-h-[36px]',
              sort === o.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
