'use client'

/**
 * 랜딩 페이지 — 미인증 사용자의 첫 진입점
 *
 * 무드: 영화 인트로 톤 — 캠퍼스 사진이 살짝 줌아웃하며 "들어오는" 도입,
 * 진입 후엔 무한 호흡으로 살아있는 느낌.
 *
 * 진입 시퀀스 타임라인:
 *   T=0    ~ 1.6s  배경 Ken Burns (scale 1.3 → 1.05, expo-out)
 *   T=0.3 ~ 1.5s  워드마크 letterReveal (글자 단위 stagger 0.06s)
 *   T=1.5s+        워드마크 아래 underline scaleX 0→1 (origin: left)
 *   T=1.6s+        서브 카피 学生だけの匿名キャンパスSNS fade up + blur
 *   T=1.9s+        CTA 두 버튼 가로 그룹 staggerFast fade up
 *   T=2.0s+ 영구  배경 호흡 scale 1.05 ↔ 1.08 (12s, ease-in-out, alternate)
 *
 * 버튼 절제:
 *   - MagneticButton 제거 (마그네틱 끌림/scale 1.02 hover 모두 제거)
 *   - hover 는 배경/테두리 색만 살짝 진해짐, tap 은 active:scale-[0.98] 미세 눌림
 */

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  motion,
  useReducedMotion,
  useAnimationControls,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  letterContainer,
  letterReveal,
  staggerFast,
  fadeInUp,
  underlineReveal,
  subCopyReveal,
} from '@/lib/motion-variants'

// 워드마크 문자열 — 공백 1개 포함 10자
const WORDMARK = 'KEIO SHARE'

// 배경 캠퍼스 사진 (Unsplash — "brown concrete building near green trees")
// 다른 사진으로 교체하려면 이 URL 만 바꾸면 됨. images.unsplash.com 도메인은
// next.config.ts 의 remotePatterns 에 등록되어 있음.
const BG_IMAGE_URL =
  'https://images.unsplash.com/photo-1593344560663-4c1cdc7d28ba?auto=format&fit=crop&w=1920&q=80'

export default function LandingPage() {
  const reduced = useReducedMotion() ?? false
  const instant = reduced ? { duration: 0 } : undefined

  // 배경 두 단계 시퀀스 — Ken Burns 진입 후 무한 호흡으로 자연 전환
  const bgControls = useAnimationControls()

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (reduced) {
        // 모션 줄이기: 정적 표시
        bgControls.set({ scale: 1.05 })
        return
      }

      // 1단계: Ken Burns zoom-out (1.6s)
      await bgControls.start({
        scale: 1.05,
        transition: {
          duration: 1.6,
          ease: [0.22, 1, 0.36, 1],
        },
      })
      if (cancelled) return

      // 2단계: 무한 호흡 (12s, alternate)
      bgControls.start({
        scale: [1.05, 1.08, 1.05],
        transition: {
          duration: 12,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror',
        },
      })
    }

    run()

    return () => {
      cancelled = true
    }
  }, [bgControls, reduced])

  return (
    <main
      className="relative isolate min-h-dvh overflow-hidden flex items-center justify-center px-4"
      aria-label="KEIO SHARE — 慶應義塾大学生専用コミュニティ"
    >
      {/* ─── 배경 레이어 ───────────────────────────────────────────────
          1. 캠퍼스 사진 — motion.div 로 감싸 Ken Burns + 호흡 시퀀스 적용
          2. 검정 반투명 오버레이 (가독성 보장)
          3. 옅은 vertical 그라데이션 (하단 강조)
         ─────────────────────────────────────────────────────────── */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* 캠퍼스 사진 motion 래퍼 — initial scale 1.3 에서 시작 */}
        <motion.div
          initial={{ scale: 1.3 }}
          animate={bgControls}
          className="absolute inset-0 will-change-transform"
        >
          <Image
            src={BG_IMAGE_URL}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover blur-sm"
          />
        </motion.div>
        {/* 검정 디밍 오버레이 — 텍스트 가독성을 위해 강하게 */}
        <div className="absolute inset-0 bg-black/65" />
        {/* 하단 강조 그라데이션 — 버튼 영역 가독성 추가 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* 중앙 콘텐츠 컨테이너 — 워드마크/언더라인/서브카피/CTA 모두 스택 */}
      <div className="relative z-10 flex flex-col items-center gap-10 sm:gap-12 w-full max-w-md">

        {/* ─── 워드마크 + 언더라인 + 서브카피 그룹 ────────────────────
            한 그룹으로 묶어 시각적 결속 강화
           ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          {/* 워드마크 — letterContainer + letterReveal */}
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

          {/* 언더라인 — 워드마크 stagger 종료 시점(약 1.5s) 직후 좌→우 reveal */}
          <motion.div
            aria-hidden
            variants={underlineReveal}
            initial="hidden"
            animate="visible"
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 1.5 }
            }
            className="h-px w-32 sm:w-40 bg-white/60 origin-left"
          />

          {/* 서브 카피 — 언더라인 그려지는 동안 살짝 늦게 fade up */}
          <motion.p
            variants={subCopyReveal}
            initial="hidden"
            animate="visible"
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 1.6 }
            }
            className="text-sm sm:text-base text-white/85 tracking-wide
                       drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]"
          >
            学生だけの匿名キャンパスSNS
          </motion.p>
        </div>

        {/* ─── CTA 버튼 그룹 ──────────────────────────────────────────
            모바일 포함 항상 가로 (flex-row), 동일 outline 스타일.
            버튼 자체 모션은 톤다운 — hover 는 색만, tap 은 active:scale-[0.98].
           ─────────────────────────────────────────────────────────── */}
        <motion.div
          variants={staggerFast}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 1.9 }}
          className="flex flex-row gap-3 w-full max-w-sm"
        >
          {/* 新規登録 (회원가입) */}
          <motion.div variants={fadeInUp} className="flex-1">
            <Button
              asChild
              variant="outline"
              className="w-full h-12 text-base font-semibold rounded-xl
                         border-white/40 bg-transparent text-white
                         hover:bg-white/10 hover:text-white
                         hover:border-white/70
                         backdrop-blur-sm
                         transition-[background-color,border-color] duration-200
                         active:scale-[0.98]"
            >
              <Link href="/signup">新規登録</Link>
            </Button>
          </motion.div>

          {/* ログイン (로그인) — 동일 스타일 */}
          <motion.div variants={fadeInUp} className="flex-1">
            <Button
              asChild
              variant="outline"
              className="w-full h-12 text-base font-semibold rounded-xl
                         border-white/40 bg-transparent text-white
                         hover:bg-white/10 hover:text-white
                         hover:border-white/70
                         backdrop-blur-sm
                         transition-[background-color,border-color] duration-200
                         active:scale-[0.98]"
            >
              <Link href="/login">ログイン</Link>
            </Button>
          </motion.div>
        </motion.div>

      </div>
    </main>
  )
}
