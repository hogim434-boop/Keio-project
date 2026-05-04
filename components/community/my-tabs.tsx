'use client'

/**
 * 마이페이지 탭 컴포넌트
 *
 * 投稿 / コメント / ブックマーク 3탭 세그먼트 컨트롤.
 * URL ?tab 파라미터와 동기화 (sort-toggle.tsx 동일 패턴).
 * sticky top-14 z-20 으로 프로필 헤더 아래 고정.
 * useSearchParams 사용 → Suspense 경계 필요.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
// tabIndicator: 슬라이딩 인디케이터에 사용하는 spring transition
import { tabIndicator } from '@/lib/motion-variants'

/** 탭 옵션 목록 */
const TABS = [
  { value: 'posts', label: '投稿' },
  { value: 'comments', label: 'コメント' },
  { value: 'bookmarks', label: 'ブックマーク' },
] as const

type MyTabValue = (typeof TABS)[number]['value']

/** 마이페이지 탭 — ?tab URL 파라미터 동기화 */
export function MyTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const raw = sp.get('tab') ?? 'posts'
  // 유효하지 않은 tab 값이면 posts 기본값
  const active: MyTabValue = (TABS.some((t) => t.value === raw) ? raw : 'posts') as MyTabValue
  // 접근성: prefers-reduced-motion 감지
  const shouldReduce = useReducedMotion()

  /** 탭 선택 처리 — router.replace 로 URL ?tab 업데이트 */
  function onSelect(value: MyTabValue): void {
    const params = new URLSearchParams(sp.toString())
    params.set('tab', value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b">
      <div
        className="flex gap-1 mx-4 my-2 p-1 rounded-full bg-muted"
        role="tablist"
        aria-label="マイページタブ"
      >
        {TABS.map((t) => (
          /*
            sort-toggle 과 동일한 layoutId 슬라이딩 패턴.
            "my-tab-indicator" 로 별도 layoutId 사용 (sort-indicator 와 분리)
          */
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active === t.value}
            onClick={() => onSelect(t.value)}
            className={cn(
              'relative flex-1 py-2 text-sm font-medium rounded-full min-h-[36px] transition-colors z-0',
              active === t.value
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {/* 슬라이딩 배경 인디케이터 — layoutId 로 탭 간 자동 이동 */}
            {active === t.value && (
              <motion.span
                layoutId="my-tab-indicator"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={shouldReduce ? { duration: 0 } : tabIndicator}
              />
            )}
            {/* 텍스트는 인디케이터 위에 표시 */}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
