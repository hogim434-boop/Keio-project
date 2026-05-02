/**
 * motion-variants.ts
 * 프로젝트 전체에서 공유하는 Framer Motion 애니메이션 Variants 정의
 *
 * 설계 원칙 (뉴욕 스타일):
 * - 절제된 모션: y 이동량은 랜딩(y:40) 대비 앱 내부(y:12)로 축소
 * - expo out easing [0.22, 1, 0.36, 1]: 빠르게 시작해 부드럽게 정착하는 고급 커브
 * - back out easing [0.34, 1.56, 0.64, 1]: FAB/뱃지 등 살짝 튀어오르는 팝 효과
 */

import type { Variants } from 'framer-motion'

/**
 * 리스트 컨테이너 — 자식 요소들을 순차적으로(stagger) 등장시키는 부모 variants
 * staggerChildren: 0.06s 간격으로 자식이 하나씩 등장
 * delayChildren: 컨테이너 마운트 후 0.05s 딜레이 후 시작
 */
export const listContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

/**
 * 리스트 아이템 — listContainer 자식으로 사용
 * y:12 → 0 (랜딩 y:40 대비 앱 내부는 절제)
 * opacity: 0 → 1 + expo out easing
 */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

/**
 * 페이지 헤더 — 제목 등 상단 요소의 진입 효과
 * y:-8 → 0 (위에서 살짝 내려오는 효과)
 */
export const pageHeader: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

/**
 * FAB(Floating Action Button) 진입 효과
 * scale:0 → 1 + y:8 → 0 (아래에서 팝업되는 느낌)
 * delay:0.3 — 페이지 콘텐츠가 먼저 등장한 후 FAB 등장
 * back out easing으로 살짝 오버슈팅하는 스프링 효과
 */
export const fabEntrance: Variants = {
  hidden: { opacity: 0, scale: 0, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.45,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  },
}

/**
 * 빈 상태(Empty State) 등장 효과
 * scale:0.95 → 1 + opacity (살짝 확대되며 등장)
 * back out easing으로 자연스러운 팝 효과
 */
export const emptyState: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  },
}
