'use client'

/**
 * 랜딩 페이지 — 미인증 사용자의 첫 진입점
 * 무드: 캠퍼스 사진 + 강한 디밍/블러 + 흰 타이포 + 미니멀 outline 버튼
 *
 * 구조:
 *   1. 배경 — 캠퍼스 사진 (next/image fill) + 검정 디밍 + blur 오버레이
 *   2. 워드마크 — "KEIO SHARE" 글자 단위 letterReveal
 *   3. CTA 2개 — 둘 다 동일한 흰색 outline + 투명 배경 (계층화 없음)
 *
 * 모션 전략:
 *   - 워드마크: letterContainer + letterReveal (≈ 1.5s 완성)
 *   - 버튼 그룹: staggerFast, delayChildren: 1.5s
 *   - 버튼 hover/tap: scale 1.02 / 0.96 (springTap)
 *   - 마그네틱 끌림: useMotionValue + useSpring (±8px 이내)
 *   - useReducedMotion 활성 시: 모든 transition duration:0
 *
 * 사이즈 근거 (body max-width: 768px 제약):
 *   - text-5xl(모바일) → text-7xl(sm) → text-8xl(md) — 768px 안에서 잘리지 않음
 */

import { useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  letterContainer,
  letterReveal,
  staggerFast,
  fadeInUp,
  springTap,
} from '@/lib/motion-variants'

// 워드마크 문자열 — 공백 1개 포함 10자
const WORDMARK = 'KEIO SHARE'

// 배경 캠퍼스 사진 (Unsplash — "brown concrete building near green trees")
// 다른 사진으로 교체하려면 이 URL 만 바꾸면 됨. images.unsplash.com 도메인은
// next.config.ts 의 remotePatterns 에 등록되어 있음.
const BG_IMAGE_URL =
  'https://images.unsplash.com/photo-1593344560663-4c1cdc7d28ba?auto=format&fit=crop&w=1920&q=80'

// ─────────────────────────────────────────────────────────────────────────────
// MagneticButton
// 마우스가 버튼 근처에 있을 때 살짝 끌려가는 효과 (±8px 이내).
// scale (whileHover/whileTap) 과 x/y (마그네틱) 는 독립 축이라 공존 가능.
// ─────────────────────────────────────────────────────────────────────────────
interface MagneticButtonProps {
  children: React.ReactNode
  reduced: boolean
  className?: string
}

function MagneticButton({
  children,
  reduced,
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)

  // 마그네틱 끌림 위치를 추적하는 MotionValue
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // useSpring 으로 부드럽게 보간 — 끈적하지 않게
  const x = useSpring(rawX, { stiffness: 200, damping: 18, mass: 0.6 })
  const y = useSpring(rawY, { stiffness: 200, damping: 18, mass: 0.6 })

  // 터치 기기 감지 (SSR-safe)
  const isTouchRef = useRef(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      isTouchRef.current = window.matchMedia('(pointer: coarse)').matches
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || isTouchRef.current) return
      const el = ref.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // 강도 0.25 + ±8px clamp
      const dx = (e.clientX - centerX) * 0.25
      const dy = (e.clientY - centerY) * 0.25
      rawX.set(Math.max(-8, Math.min(8, dx)))
      rawY.set(Math.max(-8, Math.min(8, dy)))
    },
    [reduced, rawX, rawY],
  )

  const handleMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      variants={fadeInUp}
      whileHover={
        reduced ? undefined : { scale: 1.02, transition: springTap }
      }
      whileTap={
        reduced ? undefined : { scale: 0.96, transition: springTap }
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const reduced = useReducedMotion() ?? false
  const instant = reduced ? { duration: 0 } : undefined

  return (
    <main
      className="relative isolate min-h-dvh overflow-hidden flex items-center justify-center px-4"
      aria-label="KEIO SHARE — 慶應義塾大学生専用コミュニティ"
    >
      {/* ─── 배경 레이어 ───────────────────────────────────────────────
          1. 캠퍼스 사진 (next/image fill, blur-sm 으로 살짝 흐림)
          2. 검정 반투명 오버레이 (가독성 보장)
          3. 옅은 vertical 그라데이션 (하단을 더 어둡게 — 버튼 영역 강조)
         ─────────────────────────────────────────────────────────── */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* 캠퍼스 사진 — Image 의 fill + object-cover 로 영역 채움
            blur-sm + scale-105 로 흐림 처리 (scale 은 blur 의 가장자리 잘림 방지) */}
        <Image
          src={BG_IMAGE_URL}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover blur-sm scale-105"
        />
        {/* 검정 디밍 오버레이 — 텍스트 가독성을 위해 강하게 */}
        <div className="absolute inset-0 bg-black/65" />
        {/* 하단 강조 그라데이션 — 버튼 영역 가독성 추가 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* 중앙 콘텐츠 컨테이너 */}
      <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-14">

        {/* ─── 워드마크 ───────────────────────────────────────────────
            text-white 로 통일 (배경이 어두우므로 흰색이 가장 깔끔)
            drop-shadow 로 사진 위에서도 또렷하게
           ─────────────────────────────────────────────────────────── */}
        <motion.h1
          aria-label="KEIO SHARE"
          variants={letterContainer}
          initial="hidden"
          animate="visible"
          style={{ perspective: 1000 }}
          className="flex font-black tracking-tighter leading-none select-none
                     text-5xl sm:text-7xl md:text-8xl text-white
                     drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        >
          {WORDMARK.split('').map((ch, i) => (
            <motion.span
              key={i}
              variants={letterReveal}
              transition={instant}
              aria-hidden
              className={
                ch === ' '
                  ? 'inline-block w-[0.35em]'
                  : 'inline-block'
              }
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </motion.h1>

        {/* ─── CTA 버튼 그룹 ──────────────────────────────────────────
            두 버튼 모두 동일한 outline + 투명 스타일 (계층화 없음)
            배경이 어두우므로 흰색 outline + 흰 글씨로 통일
           ─────────────────────────────────────────────────────────── */}
        <motion.div
          variants={staggerFast}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 1.5 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
        >
          {/* 新規登録 (회원가입) */}
          <MagneticButton reduced={reduced} className="flex-1">
            <Button
              asChild
              variant="outline"
              className="w-full h-12 text-base font-semibold rounded-xl
                         border-white/40 bg-transparent text-white
                         hover:bg-white/10 hover:text-white
                         hover:border-white/60
                         backdrop-blur-sm"
            >
              <Link href="/signup">新規登録</Link>
            </Button>
          </MagneticButton>

          {/* ログイン (로그인) — 위와 완전히 동일한 스타일 */}
          <MagneticButton reduced={reduced} className="flex-1">
            <Button
              asChild
              variant="outline"
              className="w-full h-12 text-base font-semibold rounded-xl
                         border-white/40 bg-transparent text-white
                         hover:bg-white/10 hover:text-white
                         hover:border-white/60
                         backdrop-blur-sm"
            >
              <Link href="/login">ログイン</Link>
            </Button>
          </MagneticButton>
        </motion.div>

      </div>
    </main>
  )
}
