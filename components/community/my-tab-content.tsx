'use client'

/**
 * MyTabContent — 마이페이지 탭 콘텐츠 stagger entrance 래퍼
 *
 * 탭이 변경될 때마다 key={tab} 으로 unmount → remount 되어
 * stagger 애니메이션이 매번 처음부터 다시 실행됩니다.
 *
 * [애니메이션 설계]
 * - 카드 리스트: 50ms 간격 stagger (PostFeed 와 동일 패턴)
 * - Empty State: opacity + y:8 페이드인 (0.4s expo-out)
 * - Empty 이모지: 2.5초 주기 위아래 idle loop (おもてなし 톤)
 * - prefers-reduced-motion: reduce 시 모든 모션 즉시 표시
 */

import { motion, useReducedMotion } from 'framer-motion'
import { listItem } from '@/lib/motion-variants'

/**
 * 탭 stagger 컨테이너 variants
 * PostFeed 의 feedContainer 와 동일하게 50ms stagger
 */
const tabContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,  // 50ms — PostFeed 와 일관성
      delayChildren: 0.05,     // 컨테이너 마운트 후 50ms 딜레이
    },
  },
} as const

interface MyTabContentProps {
  /** 현재 활성 탭 식별자 — key 로 사용되어 탭 변경 시 remount 트리거 */
  tab: string
  /** 카드 컴포넌트 배열 — React Element 배열 */
  children: React.ReactNode[]
  /** 데이터가 비어있는지 여부 */
  isEmpty: boolean
  /** Empty State 이모지 (예: '📝', '💬', '🔖') */
  emptyEmoji: string
  /** Empty State 안내 텍스트 (일본어) */
  emptyLabel: string
}

export function MyTabContent({
  tab,
  children,
  isEmpty,
  emptyEmoji,
  emptyLabel,
}: MyTabContentProps) {
  /**
   * 접근성: prefers-reduced-motion: reduce 감지
   * ?? false: SSR 환경에서 null 반환 시 false 로 안전하게 fallback
   */
  const shouldReduceMotion = useReducedMotion() ?? false

  /* ---------------------------------------------------------------
   * Empty State
   * 빈 탭일 때 이모지 + 안내 텍스트를 페이드인으로 등장시킴
   * --------------------------------------------------------------- */
  if (isEmpty) {
    return (
      <motion.div
        // key 에 "empty-" 접두어 추가로 빈 상태 ↔ 카드 상태 간 unmount 보장
        key={`empty-${tab}`}
        className="py-16 text-center space-y-3"
        // reduce 모션 시: initial/animate false 로 즉시 표시
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 이모지 idle loop — 2.5초 주기로 살짝 위아래 (おもてなし 톤) */}
        <motion.p
          className="text-4xl"
          aria-hidden  // 스크린리더에서 이모지 장식은 읽지 않음
          // reduce 모션 시: animate 를 정적 상태({})로 유지 → 움직임 없음
          animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {emptyEmoji}
        </motion.p>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </motion.div>
    )
  }

  /* ---------------------------------------------------------------
   * 카드 리스트 stagger entrance
   *
   * key={tab} 이 핵심:
   *   탭 A → 탭 B 변경 시 React 가 이 컴포넌트를 unmount 후 remount.
   *   → variants 가 'hidden' 에서 다시 시작 → stagger 재실행.
   *
   * shouldReduceMotion=true 시:
   *   variants/initial/animate 모두 undefined → motion.div 가 일반 div 처럼 동작
   * --------------------------------------------------------------- */
  return (
    <motion.div
      key={tab}
      className="space-y-3"
      variants={shouldReduceMotion ? undefined : tabContainer}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
    >
      {children.map((child, index) => (
        /*
         * 각 카드를 motion.div 로 감싸 부모의 stagger 타이밍을 받음.
         * index 를 key 로 사용 (카드 컴포넌트 자체는 고유 key 를 가짐).
         * shouldReduceMotion=true 시 variants=undefined → 즉시 표시.
         */
        <motion.div
          key={index}
          variants={shouldReduceMotion ? undefined : listItem}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
