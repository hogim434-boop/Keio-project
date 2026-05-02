'use client'

/**
 * HeroSection — 랜딩 페이지 메인 히어로 섹션
 *
 * 애니메이션 전략:
 * 1. container variants로 자식 요소들을 0.15s씩 순차(stagger) 등장
 * 2. 타이틀 'KEIO SHARE'는 글자 단위로 쪼개 각각 flip-in 효과
 * 3. 뱃지, 설명문, 버튼은 fade + translateY 슬라이드업
 * 4. 버튼에 whileHover/whileTap으로 눌리는 마이크로인터랙션 추가
 * 5. useReducedMotion() — 접근성 설정(모션 줄이기)을 존중해 즉시 표시
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// ─────────────────────────────────────────
// Framer Motion variants 정의
// variants = 애니메이션 상태(hidden/visible)를 이름으로 묶어두는 객체
// ─────────────────────────────────────────

/** 최상위 섹션: 자식들을 0.15s 간격으로 순차 등장시킴 */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

/** 타이틀: 글자 단위 stagger — 0.05s 간격으로 각 글자가 차례로 나타남 */
const titleContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

/**
 * 개별 글자 애니메이션
 * - opacity: 투명 → 불투명
 * - y: 40px 아래에서 올라옴
 * - rotateX: 3D X축으로 -30도 기울어진 상태에서 정면으로
 * - filter blur: 흐릿하다가 선명해짐
 * - ease [0.22, 1, 0.36, 1]: 빠르게 시작해 부드럽게 정착하는 커브 (expo out)
 */
const char = {
  hidden: { opacity: 0, y: 40, rotateX: -30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/**
 * 블록 단위 등장 (설명문, 버튼 영역 등)
 * - y: 16px 아래에서 올라오는 가벼운 슬라이드업
 * - duration 0.6s로 글자보다 약간 느리게 → 리듬감
 */
const block = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/**
 * 뱃지 등장 애니메이션
 * - scale: 0.8에서 1로 커지며 나타남 (pop 효과)
 * - ease [0.34, 1.56, 0.64, 1]: 살짝 오버슈팅하는 스프링 느낌 (back out)
 */
const badge = {
  hidden: { opacity: 0, scale: 0.8, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as const },
  },
}

// ─────────────────────────────────────────
// 컴포넌트 본체
// ─────────────────────────────────────────

export function HeroSection() {
  /**
   * useReducedMotion():
   * 사용자가 OS에서 "모션 줄이기" 설정을 켜두면 true를 반환.
   * 이 경우 모든 variants를 빈 객체 {}로 교체해 애니메이션 없이 즉시 표시.
   * 접근성(a11y)을 위한 필수 처리.
   */
  const shouldReduce = useReducedMotion()

  return (
    <motion.section
      variants={shouldReduce ? {} : container}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center gap-6"
    >
      {/* ── 상태 뱃지: "게이오대학교 전용 플랫폼" 표시 ── */}
      <motion.div
        variants={shouldReduce ? {} : badge}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"
      >
        {/* 초록 점: animate-pulse로 실시간 운영 중임을 암시 */}
        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
        게이오대학교 전용 플랫폼
      </motion.div>

      {/* ── 타이틀 + 서브타이틀 영역 ── */}
      <div className="space-y-3">
        {/*
          h1: 'KEIO SHARE'를 글자 단위로 split해
          각 <motion.span>에 char variants 적용 → 글자가 하나씩 뒤집히며 등장
          perspective: 800px → rotateX 3D 원근감을 자연스럽게 만들어주는 설정
        */}
        <motion.h1
          variants={shouldReduce ? {} : titleContainer}
          className="text-6xl font-bold tracking-tight"
          style={{ perspective: '800px' }}
        >
          {/* "KEIO" 파트 */}
          {[...'KEIO'].map((ch, i) => (
            <motion.span key={`k${i}`} variants={shouldReduce ? {} : char} style={{ display: 'inline-block' }}>
              {ch}
            </motion.span>
          ))}
          {/* 모바일(iPhone)에서만 줄바꿈 — sm 이상에서는 공백으로 대체 */}
          <span className="block sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline-block" style={{ width: '0.25em' }} aria-hidden="true" />
          {/* "SHARE" 파트 */}
          {[...'SHARE'].map((ch, i) => (
            <motion.span key={`s${i}`} variants={shouldReduce ? {} : char} style={{ display: 'inline-block' }}>
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        {/* 서브타이틀: block variants로 살짝 늦게 등장 */}
        <motion.p
          variants={shouldReduce ? {} : block}
          className="text-muted-foreground text-sm leading-relaxed"
        >
          게이오 재학생을 위한
          <br />
          익명 강의 리뷰 플랫폼
        </motion.p>
      </div>

      {/* ── CTA 버튼 영역 ── */}
      <motion.div variants={shouldReduce ? {} : block} className="flex gap-3">
        {/*
          Button에 직접 motion()을 쓰면 shadcn의 asChild와 충돌할 수 있으므로
          반드시 motion.div로 **외부 래핑** 방식을 사용함
          whileHover: 마우스 올리면 1.04배 확대 (섬세한 리프트 효과)
          whileTap: 클릭 시 0.97배 축소 (눌리는 피드백)
          transition duration 0.15s: 마이크로인터랙션은 빠를수록 자연스러움
        */}
        <motion.div
          whileHover={shouldReduce ? {} : { scale: 1.04 }}
          whileTap={shouldReduce ? {} : { scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <Button asChild size="lg" className="rounded-full h-12 px-8">
            <Link href="/signup">시작하기</Link>
          </Button>
        </motion.div>
        <motion.div
          whileHover={shouldReduce ? {} : { scale: 1.04 }}
          whileTap={shouldReduce ? {} : { scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <Button variant="outline" size="lg" asChild className="rounded-full h-12 px-8">
            <Link href="/login">로그인</Link>
          </Button>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
