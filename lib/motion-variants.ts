/**
 * motion-variants.ts
 * 프로젝트 전체에서 공유하는 Framer Motion 애니메이션 Variants 정의
 *
 * 설계 원칙 (뉴욕 스타일):
 * - 절제된 모션: y 이동량은 랜딩(y:40) 대비 앱 내부(y:12)로 축소
 * - expo out easing [0.22, 1, 0.36, 1]: 빠르게 시작해 부드럽게 정착하는 고급 커브
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

// ============================================================
// 보강 transition / variants
// (랜딩·report-sheet·explore-search-bar·my-tabs 등이 직접 import)
// ============================================================

/** 빠른 spring tap — 버튼/칩의 즉각 반응 */
export const springTap = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.6,
}

/** 탭 인디케이터 layoutId 슬라이딩 transition */
export const tabIndicator = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 30,
}

/** 빠른 stagger 컨테이너 — 0.04s 간격 (listContainer 의 0.06 보다 타이트) */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

/** 일반 fade + y:16 등장 — listItem 보다 범용 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
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
 * 글자 단위 reveal 컨테이너 — 워드마크/타이틀의 한 글자씩 등장 효과용 부모
 * staggerChildren: 0.06s — 글자가 한 자씩 또렷하게 떠오르는 리듬
 * delayChildren: 0.1s — 페이지 마운트 직후 약간의 호흡 후 시작
 */
export const letterContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

/**
 * 글자 단위 reveal 자식 — letterContainer 의 자식으로 사용
 * y:80 + blur(12px) + rotateX:-45° → 0 (입체적인 떠오름)
 * 부모에 perspective:1000 / transform-style:preserve-3d 필요
 * duration: 0.9s — 거대 타이포에 맞는 무게감 있는 시간
 */
export const letterReveal: Variants = {
  hidden: { opacity: 0, y: 80, filter: 'blur(12px)', rotateX: -45 },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    rotateX: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

// ============================================================
// 랜딩 hero 전용 — 영화 인트로 톤
// ============================================================

/**
 * Hero 배경 Ken Burns 진입 — scale 1.3 → 1.05 (1.6s, expo-out).
 * 진입 후엔 useAnimationControls 로 호흡 단계로 전환 (랜딩 페이지 참고).
 */
export const heroKenBurns: Variants = {
  hidden: { scale: 1.3 },
  visible: {
    scale: 1.05,
    transition: {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

/**
 * 가로선 underline reveal — scaleX 0 → 1 (transform-origin: left).
 * 워드마크 stagger 가 끝난 직후 등장하도록 부모 컨테이너의 delayChildren 으로 타이밍 조정.
 */
export const underlineReveal: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

/**
 * 서브 카피 reveal — opacity + y:14 + blur(6px) → 0 (0.6s expo-out).
 * 워드마크/언더라인 등장 후 부드럽게 페이드 업.
 */
export const subCopyReveal: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

// ============================================================
// Cinema Stamp 인트로 시퀀스 전용 variants
// 랜딩 page.tsx 의 useAnimationControls와 함께 사용
// ============================================================

/**
 * 워드마크 스택 진입 — scale 0.96 + rotateX -25° + blur(16px) → 완성 상태.
 * perspective:1000 부모 아래에서 3D 플립+줌인 느낌.
 * duration: 0.6s expo-out — 무게감 있는 제목 등장.
 */
export const wordmarkStampEnter: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    rotateX: -25,
    filter: 'blur(16px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

/**
 * 검은 인트로 오버레이 페이드 아웃 — opacity 1 → 0.
 * T=1.4s 시점에 트리거, 0.5s 동안 부드럽게 배경을 드러냄.
 */
export const overlayFadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

/**
 * horizon-line 가로선 reveal — width 0 → '100vw'.
 * T=0.2s 시점에 트리거, origin-left 방향으로 왼쪽에서 오른쪽으로 그어짐.
 * useAnimationControls 와 함께 사용 (animate() 함수로 직접 호출).
 */
export const horizonReveal = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
}

/**
 * horizon splits — 양 절반선이 각 방향 끝으로 미끄러져 사라짐.
 * T=0.7s 시점에 horizonLeftControls / horizonRightControls 각각에 적용.
 * x: 0 → ±50vw, opacity: 1 → 0.
 */
export const horizonSplitTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
}
