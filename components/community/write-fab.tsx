'use client'

/**
 * 투고 작성 플로팅 액션 버튼 (FAB)
 *
 * - 하단 탭 바 중앙 상단에 고정 배치 (z-40)
 * - bottom 좌표는 CommentForm 이 발행하는 CSS 변수(--comment-form-h)에 동기화 →
 *   댓글 폼이 있는 페이지에서는 폼 위쪽으로, 없는 페이지에서는 fallback 0px 로 기본 위치
 * - 클릭 시 Zustand store 의 isOpen 을 true 로 전환 → WriteBottomSheet 열림
 * - whileTap scale 0.92 마이크로인터랙션
 * - useReducedMotion — 시스템 "모션 줄이기" 대응
 */

import { motion, useReducedMotion } from 'framer-motion'
import { SquarePen } from 'lucide-react'
import { useWriteSheet } from '@/lib/stores/write-sheet-store'

/** 56×56 원형 FAB — WriteBottomSheet 트리거 */
export function WriteFab() {
  const open = useWriteSheet((s) => s.open)
  const shouldReduce = useReducedMotion()

  return (
    <motion.button
      onClick={open}
      aria-label="新しい投稿を作成"
      style={{
        bottom:
          'calc(56px + env(safe-area-inset-bottom) + var(--comment-form-h, 0px) + 8px)',
        /* CSS 변수(--comment-form-h)가 0 → 측정값으로 변할 때 bottom 좌표를 부드럽게 추종.
         * CommentForm 의 slide-up (0.5s, 동일 커브)과 완전히 동기화.
         * shouldReduce true 시 transition: none — 즉시 위치 갱신 (접근성 대응). */
        transition: shouldReduce
          ? 'none'
          : 'bottom 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      whileTap={shouldReduce ? {} : { scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="fixed left-1/2 -translate-x-1/2 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:opacity-90"
    >
      <SquarePen size={24} strokeWidth={2.4} />
    </motion.button>
  )
}
