'use client'

/**
 * LikeParticles — 좋아요 첫 클릭 시 이모지 파티클 흩날림 컴포넌트
 *
 * trigger=true 가 되는 순간 3–4개 파티클이 각각 다른 궤적으로 튀어나와
 * 600ms 후 opacity 0 으로 사라집니다. AnimatePresence 가 exit 후 자동 unmount.
 *
 * 사용처:
 *  - components/community/post-card.tsx
 *  - components/community/post-detail-actions.tsx
 *
 * 접근성: useReducedMotion() 이 true 면 DOM 자체를 렌더하지 않습니다.
 * 레이아웃: 부모 요소에 `position: relative` 가 있어야 파티클이 버튼 위에 정확히 표시됩니다.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** 파티클 1개의 궤적 정의 */
interface Particle {
  emoji: string
  /** 최종 x 오프셋 (px), 좌측 음수 / 우측 양수 */
  x: number
  /** 최종 y 오프셋 (px), 위로 올라가므로 음수 */
  y: number
  /** 최종 회전 각도 (deg) */
  rotate: number
}

/** 파티클 궤적 4종 — 좌상/중상/우상/근거리 */
const PARTICLES: Particle[] = [
  { emoji: '❤️', x: -28, y: -52, rotate: -25 },
  { emoji: '✨', x: 0,   y: -60, rotate: 0   },
  { emoji: '⭐', x: 28,  y: -50, rotate: 20  },
  { emoji: '❤️', x: -10, y: -38, rotate: 15  },
]

export interface LikeParticlesProps {
  /**
   * true 가 되는 순간 파티클 발사.
   * 외부에서 600ms 후 다시 false 로 내려줘야 다음 클릭에서도 재발사됩니다.
   */
  trigger: boolean
}

export function LikeParticles({ trigger }: LikeParticlesProps) {
  // prefers-reduced-motion 이 true 면 파티클 비활성
  const reduce = useReducedMotion()
  if (reduce) return null

  return (
    // pointer-events-none: 파티클이 아래 버튼 클릭을 막지 않도록
    // absolute: 부모(relative) 기준으로 위치 — 좌상단(0,0)이 기준점
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      <AnimatePresence>
        {trigger &&
          PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              // 시작 위치: 버튼 중앙 (left-1/2, top-1/2) 기준
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm select-none"
              // 초기: 중앙에서 작고 투명하게 시작
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.6, rotate: 0 }}
              // 애니메이트: 각 파티클의 목표 위치로 이동하며
              // opacity keyframe: 나타났다가(0→1→1→0) 사라짐
              // scale keyframe: 튀어나오다가 살짝 수축
              animate={{
                opacity: [0, 1, 1, 0],
                x: p.x,
                y: p.y,
                scale: [0.6, 1.1, 1, 0.8],
                rotate: p.rotate,
              }}
              // 600ms ease-out, times 배열로 keyframe 타이밍 제어
              // 0%: 시작 / 15%: 가시 / 70%: 피크 / 100%: 소멸
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                times: [0, 0.15, 0.7, 1],
              }}
              // exit: 혹시 trigger=false 로 바뀔 때 부드럽게 사라짐
              exit={{ opacity: 0, scale: 0, transition: { duration: 0.15 } }}
            >
              {p.emoji}
            </motion.span>
          ))}
      </AnimatePresence>
    </span>
  )
}
