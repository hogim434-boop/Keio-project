'use client'

/**
 * 투고 작성 플로팅 액션 버튼 (FAB)
 *
 * - 하단 탭 바 중앙 상단에 고정 배치 (z-40, bottom: 56px + safe-area + 8px)
 * - 클릭 시 Zustand store의 isOpen을 true로 전환 → WriteBottomSheet 열림
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
      // 탭 바(56px) + safe-area-inset-bottom + 8px 여백
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom) + 8px)' }}
      whileTap={shouldReduce ? {} : { scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="fixed left-1/2 -translate-x-1/2 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:opacity-90"
    >
      <SquarePen size={24} strokeWidth={2.4} />
    </motion.button>
  )
}
