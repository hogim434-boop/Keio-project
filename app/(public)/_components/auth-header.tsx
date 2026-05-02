'use client'

/**
 * AuthHeader — 로그인/회원가입 페이지 전용 헤더
 *
 * 애니메이션 전략:
 * - 페이지 진입 시 y: -12 → 0 으로 위에서 슬라이드인
 * - opacity 0 → 1 페이드인 동시에 진행
 * - ease [0.22, 1, 0.36, 1]: expo out — 빠르게 시작해 부드럽게 정착
 * - duration 0.4s: 헤더는 가장 먼저 보여야 하므로 짧고 빠르게
 * - useReducedMotion(): OS 모션 줄이기 설정을 켠 사용자에겐 즉시 표시
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

export function AuthHeader() {
  // OS의 "모션 줄이기" 설정 감지 — true면 애니메이션 없이 즉시 표시
  const shouldReduce = useReducedMotion()

  return (
    <motion.header
      // 초기 상태: 살짝 위에 위치하고 투명
      initial={shouldReduce ? false : { opacity: 0, y: -12 }}
      // 최종 상태: 제자리에 불투명하게
      animate={{ opacity: 1, y: 0 }}
      // transition 설정:
      // duration 0.4s — 헤더가 가장 먼저 등장해야 하므로 빠르게
      // ease [0.22, 1, 0.36, 1] — 빠르게 시작해 부드럽게 멈추는 expo out 커브
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-14 items-center border-b bg-background/80 backdrop-blur-sm px-6"
    >
      {/* 사이트 로고 — 클릭 시 랜딩 페이지로 이동 */}
      <Link href="/" className="text-lg font-bold tracking-tight">
        KEIO SHARE
      </Link>
    </motion.header>
  )
}
