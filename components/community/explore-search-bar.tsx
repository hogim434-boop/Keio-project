'use client'

/**
 * ExploreSearchBar — 탐색 페이지 상단 고정 검색 입력바
 *
 * 기능:
 * - mount 시 자동 포커스
 * - 디바운스 300ms 후 URL ?q 파라미터 replace
 * - IME composition 가드 (일본어 입력 중 fetch 차단)
 * - X 버튼으로 검색어 클리어 + 포커스 복귀
 * - 브라우저 뒤로가기 등 URL 외부 변경 시 로컬 상태 동기화
 *
 * Phase 4 마이크로 인터랙션:
 * - focus-within 시 input 컨테이너에 ring-glow-violet (보라 글로우)
 * - X 클리어 버튼 → motion.button whileTap scale 0.85 + AnimatePresence fade
 * - useReducedMotion 가드 적용
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { springTap } from '@/lib/motion-variants'

export function ExploreSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [local, setLocal] = useState<string>(sp.get('q') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const composingRef = useRef<boolean>(false)

  // prefers-reduced-motion 접근성 가드
  const shouldReduce = useReducedMotion()

  // mount 시 자동 포커스
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // URL 외부 변경(브라우저 뒤로가기 등) → local 동기화
  useEffect(() => {
    const urlQ = sp.get('q') ?? ''
    setLocal((prev) => (prev === urlQ ? prev : urlQ))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  // unmount 시 진행 중 디바운스 cleanup
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  /** URL ?q 파라미터 즉시 반영 (replace — 뒤로가기 히스토리 쌓지 않음) */
  function pushUrl(value: string): void {
    const params = new URLSearchParams(sp.toString())
    const trimmed = value.trim()
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  /** 디바운스 300ms 예약 (IME 조합 중이면 보류) */
  function scheduleDebounced(value: string): void {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (composingRef.current) return // IME 조합 중 보류
    debounceRef.current = setTimeout(() => pushUrl(value), 300)
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = e.target.value
    setLocal(v)
    scheduleDebounced(v)
  }

  /** IME 조합 시작 — 디바운스 중단 플래그 ON */
  function onCompositionStart(): void {
    composingRef.current = true
  }

  /** IME 조합 완료 — 플래그 OFF 후 디바운스 실행 */
  function onCompositionEnd(e: React.CompositionEvent<HTMLInputElement>): void {
    composingRef.current = false
    scheduleDebounced(e.currentTarget.value)
  }

  /** X 버튼 — 검색어 초기화 + 포커스 복귀 */
  function onClear(): void {
    setLocal('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    pushUrl('')
    inputRef.current?.focus()
  }

  return (
    <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b px-4 py-3">
      {/*
        focus-within 시 ring-glow-violet 클래스 적용:
        → 입력 중 컨테이너 전체에 보라 글로우 링 표시
        transition 으로 부드럽게 on/off
      */}
      <div className="relative transition-shadow duration-200 rounded-md focus-within:ring-glow-violet">
        {/* 검색 아이콘 — 클릭 불가 장식 요소 */}
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />

        {/* 검색 입력 필드 — 최소 터치 영역 h-11 (44px) */}
        <Input
          ref={inputRef}
          value={local}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder="キーワードを検索..."
          aria-label="検索"
          role="searchbox"
          className="h-11 pl-10 pr-10"
        />

        {/*
          AnimatePresence: local 값이 생기면 X버튼이 fade-in,
          사라지면 fade-out 처리 (마운트/언마운트 시 애니메이션)
        */}
        <AnimatePresence>
          {local && (
            <motion.button
              type="button"
              onClick={onClear}
              aria-label="クリア"
              // 초기 등장: opacity 0 → 1, scale 0.7 → 1
              initial={shouldReduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              // 퇴장: opacity 1 → 0, scale 1 → 0.7
              exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              // whileTap: 누를 때 scale 0.85 → 명확한 탭 피드백
              whileTap={shouldReduce ? {} : { scale: 0.85 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted"
            >
              <X className="size-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
