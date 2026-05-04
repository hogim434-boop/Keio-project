import type { Variants } from 'framer-motion'

/**
 * 인증 페이지(login / signup / signup/setup) 공통 모션 variants & 스타일.
 *
 * 동일한 페이지 진입·필드 등장 효과를 3개 페이지에서 중복 정의하던 것을 한 곳으로 통합.
 * y 이동량과 easing curve 는 기존 페이지들과 동일하게 유지하여 시각적 변화 없음.
 */

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** 페이지 전체 stagger 컨테이너 — 자식 요소를 순차 등장 */
export const authPageContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

/** 페이지 헤더·문단 등장 — y:16 → 0 */
export const authFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

/** 폼 내부 stagger (필드 간 0.06s 간격) */
export const authFormContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

/** 폼 필드 등장 — y:10 → 0 (헤더보다 절제된 이동량) */
export const authField: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
}

/**
 * 인증 페이지의 Input / SelectTrigger 공통 className.
 * 둥근 알약 형태 + muted 배경 + ring 포커스를 통일.
 */
export const AUTH_INPUT_CLASS =
  'rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring'
