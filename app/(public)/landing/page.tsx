'use client'

/**
 * 랜딩 페이지 — 미인증 사용자의 첫 진입점
 *
 * 무드: 영화 인트로 톤 — "Cinema Stamp" 시퀀스 후 본 랜딩 진입
 *
 * Cinema Stamp 인트로 시퀀스 타임라인:
 *   T=0.00s  검은 화면 + 비네팅 (overlay)
 *   T=0.20s  가운데 가로선 좌→우 reveal (horizonLine)
 *   T=0.50s  워드마크 등장 시작 (wordmarkStack: scale+rotateX+blur)
 *   T=0.70s  Variable Font weight 100→700 punch + 가로선 양갈래 splits
 *   T=1.00s  weight 700→900 + chromatic glitch (R채널/C채널) + scale punch
 *   T=1.20s  워드마크 정착 hold
 *   T=1.40s  검은 오버레이 페이드 아웃
 *   T=1.85s  언더라인 reveal
 *   T=2.00s  서브 카피 fade up
 *   T=2.30s  CTA 버튼 stagger 등장
 *   T=2.60s  진입 완료
 *
 * 재방문 가드: sessionStorage 'keio_intro_seen' === '1' 이면 인트로 스킵
 * 접근성 가드: prefers-reduced-motion 시 인트로 전체 비활성화
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  motion,
  useReducedMotion,
  useAnimationControls,
  useMotionValue,
  animate,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  staggerFast,
  fadeInUp,
  underlineReveal,
  subCopyReveal,
} from '@/lib/motion-variants'

// 배경 캠퍼스 사진 (Unsplash — "brown concrete building near green trees")
// 다른 사진으로 교체하려면 이 URL 만 바꾸면 됨. images.unsplash.com 도메인은
// next.config.ts 의 remotePatterns 에 등록되어 있음.
const BG_IMAGE_URL =
  'https://images.unsplash.com/photo-1593344560663-4c1cdc7d28ba?auto=format&fit=crop&w=1920&q=80'

/**
 * 편의 함수: ms 만큼 대기 후 resolve
 * 시퀀스 await 에서 타이밍 동기화용
 */
function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export default function LandingPage() {
  const reduced = useReducedMotion() ?? false

  // ─────────────────────────────────────────────────────────────────────
  // AnimationControls — 각 레이어별로 독립 제어
  // ─────────────────────────────────────────────────────────────────────

  /** 배경 Ken Burns + 호흡 무한 반복 */
  const bgControls = useAnimationControls()

  /** 검은 오버레이 (z-50) — T=1.4s에 opacity 0 으로 fade out */
  const overlayControls = useAnimationControls()

  /** 워드마크 스택 전체 — 진입 (rotateX+blur+scale) + scale punch */
  const wordmarkControls = useAnimationControls()

  /** horizon-line 전체 span — phase1: width 0→100vw */
  const horizonControls = useAnimationControls()

  /** horizon 왼쪽 절반 — phase2 splits: translateX 0 → -50vw */
  const horizonLeftControls = useAnimationControls()

  /** horizon 오른쪽 절반 — phase2 splits: translateX 0 → +50vw */
  const horizonRightControls = useAnimationControls()

  /** chromatic Red 채널 — glitch peak opacity+x pulse */
  const rControls = useAnimationControls()

  /** chromatic Cyan 채널 — glitch peak opacity+x pulse */
  const cControls = useAnimationControls()

  // ─────────────────────────────────────────────────────────────────────
  // Variable Font weight 모션 값 (문자열 속성이라 직접 animate 불가)
  // useMotionValue로 숫자 추적 → DOM style 동기화
  // ─────────────────────────────────────────────────────────────────────

  /** fontVariationSettings 'wght' 값 (100~900) */
  const wght = useMotionValue(100)

  /** wordmark-main <h1> 의 DOM ref — wght 변화를 style에 직접 반영 */
  const mainRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // wght 숫자가 바뀔 때마다 h1의 fontVariationSettings를 즉시 갱신
    // CSS 안쪽은 double quote — React SSR/CSR 직렬화 일관성 보장
    const unsubscribe = wght.on('change', (v) => {
      if (mainRef.current) {
        mainRef.current.style.fontVariationSettings = `"wght" ${v}`
      }
    })
    return unsubscribe
  }, [wght])

  // ─────────────────────────────────────────────────────────────────────
  // 인트로 스킵 여부 (SSR-safe: 첫 렌더는 항상 false → 인트로 재생 가정)
  // mount 후 useEffect 에서 sessionStorage·reduced 체크하여 갱신
  // ─────────────────────────────────────────────────────────────────────
  const [isSkip, setIsSkip] = useState(false)

  // ─────────────────────────────────────────────────────────────────────
  // 즉시 final state 세팅 (인트로 스킵 분기) — useEffect 안에서만 호출
  // ─────────────────────────────────────────────────────────────────────
  function applyFinalState() {
    // 오버레이 즉시 숨김
    overlayControls.set({ opacity: 0 })
    // 워드마크 즉시 완성 상태
    wordmarkControls.set({ opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' })
    // Variable Font 최대 굵기
    wght.set(900)
    if (mainRef.current) {
      mainRef.current.style.fontVariationSettings = '"wght" 900'
    }
    // horizon 숨김 (오버레이 뒤라 보이지 않지만 정리)
    horizonControls.set({ scaleX: 1 })
  }

  // ─────────────────────────────────────────────────────────────────────
  // 주 Effects
  // ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    // ── 배경 Ken Burns 진입 → 호흡 무한 반복 ──────────────────────────
    async function runBg() {
      if (reduced) {
        bgControls.set({ scale: 1.05 })
        return
      }
      await bgControls.start({
        scale: 1.05,
        transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
      })
      if (cancelled) return
      // 인트로 막이 사라진 뒤 자연스럽게 보이도록 지속 호흡
      bgControls.start({
        scale: [1.05, 1.08, 1.05],
        transition: { duration: 12, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
      })
    }

    runBg()
    return () => { cancelled = true }
  }, [bgControls, reduced])

  useEffect(() => {
    let cancelled = false

    // ── Cinema Stamp 인트로 시퀀스 ────────────────────────────────────
    async function runIntro() {
      // 스킵 조건 계산 (mount 후이므로 sessionStorage 안전 접근)
      let skip = reduced
      try {
        if (sessionStorage.getItem('keio_intro_seen') === '1') skip = true
      } catch {
        // private 브라우저 등 sessionStorage 미지원 시 false 유지
      }

      // 본 랜딩 delay 분기를 위해 state 갱신
      setIsSkip(skip)

      if (skip) {
        applyFinalState()
        return
      }

      // 첫 방문 기록 (세션 내 재방문부터는 스킵)
      try {
        sessionStorage.setItem('keio_intro_seen', '1')
      } catch {
        // private 브라우저 등 sessionStorage 미지원 시 무시
      }

      // 초기 상태 세팅 — 오버레이 완전 불투명, 워드마크 비가시
      overlayControls.set({ opacity: 1 })
      wordmarkControls.set({
        opacity: 0,
        scale: 0.96,
        rotateX: -25,
        filter: 'blur(16px)',
      })
      // horizon-line: scaleX 0 으로 초기화 (origin-left → 왼쪽에서 그어짐)
      horizonControls.set({ scaleX: 0 })
      // left/right 절반선: 초기 위치 중앙, 불투명
      horizonLeftControls.set({ x: 0, opacity: 1 })
      horizonRightControls.set({ x: 0, opacity: 1 })
      rControls.set({ opacity: 0, x: 0 })
      cControls.set({ opacity: 0, x: 0 })

      // ── T=0.20s: horizon-line 좌→우 reveal ─────────────────────────
      await wait(200)
      if (cancelled) return
      // scaleX 0→1 + origin-left → 선이 왼쪽에서 오른쪽으로 그어지는 효과
      horizonControls.start({
        scaleX: 1,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      })

      // ── T=0.50s: 워드마크 진입 (scale+rotateX+blur 동시) ───────────
      await wait(300) // 누적 T=0.50s
      if (cancelled) return
      wordmarkControls.start({
        opacity: 1,
        scale: 1.0,
        rotateX: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      })

      // ── T=0.70s: Variable Font 100→700 + horizon splits ───────────
      await wait(200) // 누적 T=0.70s
      if (cancelled) return

      // Variable Font weight 100 → 700 punch
      // animate()는 MotionValue 타입에는 직접 사용 가능 (DOM 요소/Controls와 다름)
      animate(wght, 700, { duration: 0.4, ease: [0.22, 1, 0.36, 1] })

      // horizon 두 절반이 각각 바깥 방향으로 미끄러져 사라짐
      // controls.start() 방식 사용 — LegacyAnimationControls 타입 준수
      horizonLeftControls.start({
        x: '-50vw',
        opacity: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      })
      horizonRightControls.start({
        x: '50vw',
        opacity: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      })

      // ── T=1.00s: weight 700→900 + chromatic glitch + scale punch ──
      await wait(300) // 누적 T=1.00s
      if (cancelled) return

      // Variable Font weight 700 → 900 final punch
      animate(wght, 900, { duration: 0.2, ease: [0.22, 1, 0.36, 1] })

      // Chromatic aberration: Red 채널 +2px 오른쪽, Cyan 채널 -2px 왼쪽
      // 0→0.6→0 opacity 펄스 (0.12s) — 짧고 강렬한 글리치
      // controls.start() 에 keyframes 배열 지원됨
      rControls.start({
        opacity: [0, 0.6, 0],
        x: [0, 2, 0],
        transition: { duration: 0.12, ease: 'linear' },
      })
      cControls.start({
        opacity: [0, 0.6, 0],
        x: [0, -2, 0],
        transition: { duration: 0.12, ease: 'linear' },
      })

      // 미세 scale punch: 1.0 → 1.04 → 1.0 (충격 잔향)
      wordmarkControls.start({
        scale: [1, 1.04, 1],
        transition: { duration: 0.18, ease: 'easeInOut' },
      })

      // ── T=1.20s: hold (변화 없음 — 임팩트 잔향 0.2s) ───────────────

      // ── T=1.40s: 검은 오버레이 fade out ────────────────────────────
      await wait(400) // 누적 T=1.40s
      if (cancelled) return

      // 오버레이가 사라지면 배경 Ken Burns가 자연스럽게 노출됨
      overlayControls.start({
        opacity: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      })
    }

    runIntro()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  // ─────────────────────────────────────────────────────────────────────
  // 본 랜딩 요소 transition delay 계산
  // isSkip 은 useState — mount 전엔 항상 false (인트로 재생 가정, SSR/CSR 일치)
  // mount 후 useEffect 에서 sessionStorage·reduced 확인 후 setIsSkip 으로 갱신
  // ─────────────────────────────────────────────────────────────────────
  const underlineDelay  = isSkip ? 0.2 : 1.85
  const subcopyDelay    = isSkip ? 0.35 : 2.0
  const ctaDelay        = isSkip ? 0.5  : 2.3

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
      <div aria-hidden className="fixed inset-0 -z-10">
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
          {/* ─── 워드마크 스택 ────────────────────────────────────────────
              인트로 시퀀스와 본 랜딩에서 동일 위치 유지 (continuity).
              3-layer 구조:
                wordmark-main  — 실제 텍스트 (Variable Font wght 애니메이션 대상)
                wordmark-r     — Red 채널 (glitch peak 순간만 노출)
                wordmark-c     — Cyan 채널 (glitch peak 순간만 노출, R 보색)
             ─────────────────────────────────────────────────────────── */}
          <motion.div
            data-intro="wordmark-stack"
            initial={{ opacity: 0, scale: 0.96, rotateX: -25, filter: 'blur(16px)' }}
            animate={wordmarkControls}
            className="relative leading-none select-none
                       text-5xl sm:text-7xl md:text-8xl
                       font-black tracking-tighter
                       drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]
                       [perspective:1000px]"
          >
            {/* 본문 워드마크 — Variable Font wght 100→900 애니메이션 대상
                ref={mainRef}: useMotionValue(wght)의 변화를 style에 직접 반영 */}
            <h1
              ref={mainRef}
              data-intro="wordmark-main"
              aria-label="KEIO SHARE"
              className="relative text-white"
              // CSS 안쪽은 double quote — React SSR/CSR 직렬화 일관성 보장.
              // 항상 100 으로 시작 (인트로 재생). 스킵 시 mount 후 wght.set(900)
              // 으로 즉시 final 상태로 점프 (1프레임 flash 허용).
              style={{ fontVariationSettings: '"wght" 100' }}
            >
              KEIO SHARE
            </h1>

            {/* Chromatic Red 채널 — glitch peak 시 translateX(+2px), opacity 0→0.6→0 */}
            <motion.span
              data-intro="wordmark-r"
              aria-hidden
              initial={{ opacity: 0, x: 0 }}
              animate={rControls}
              className="absolute inset-0 text-[#ff2b2b] mix-blend-screen
                         pointer-events-none will-change-transform"
              style={{ fontVariationSettings: '"wght" 900' }}
            >
              KEIO SHARE
            </motion.span>

            {/* Chromatic Cyan 채널 — glitch peak 시 translateX(-2px), opacity 0→0.6→0 */}
            <motion.span
              data-intro="wordmark-c"
              aria-hidden
              initial={{ opacity: 0, x: 0 }}
              animate={cControls}
              className="absolute inset-0 text-[#2bfff5] mix-blend-screen
                         pointer-events-none will-change-transform"
              style={{ fontVariationSettings: '"wght" 900' }}
            >
              KEIO SHARE
            </motion.span>
          </motion.div>

          {/* 언더라인 — T=1.85s (재방문 시 0.2s) 에 좌→우 reveal
              delay 는 인트로 완료 후 타이밍에 맞게 계산 */}
          <motion.div
            aria-hidden
            variants={underlineReveal}
            initial="hidden"
            animate="visible"
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: underlineDelay }
            }
            className="h-px w-32 sm:w-40 bg-white/60 origin-left"
          />

          {/* 서브 카피 — T=2.0s (재방문 시 0.35s) 에 fade up */}
          <motion.p
            variants={subCopyReveal}
            initial="hidden"
            animate="visible"
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: subcopyDelay }
            }
            className="text-sm sm:text-base text-white/85 tracking-wide
                       drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]"
          >
            慶應生だけのコミュニティ　
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
          transition={
            reduced
              ? { delayChildren: 0 }
              : { delayChildren: ctaDelay }
          }
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

      {/* ─── Cinema Stamp 인트로 오버레이 ─────────────────────────────
          z-50 fixed inset-0 — body 768px 제약 탈출 (fixed 사용)
          pointer-events-none — 오버레이가 남아있어도 본 랜딩 인터랙션 차단 안함

          레이어 구성:
            overlay    — 검은 막 (motion.div, opacity 1→0 @ T=1.4s)
            vignette   — 가장자리 어둠 (정적)
            grain      — 필름 그레인 (정적)
            horizon    — 가운데 가로선 컨테이너
              horizon-line  — 선 전체 컨테이너 (width 0→100vw @ T=0.2s)
                horizon-left   — 왼쪽 절반 (splits @ T=0.7s: x→-50vw)
                horizon-right  — 오른쪽 절반 (splits @ T=0.7s: x→+50vw)
         ─────────────────────────────────────────────────────────── */}
      <motion.div
        data-intro="overlay"
        aria-hidden
        initial={{ opacity: 1 }}
        animate={overlayControls}
        className="fixed inset-0 z-50 bg-black pointer-events-none"
      >
        {/* 비네팅 — 가장자리 어둡게 (항상 정적 표시) */}
        <div
          data-intro="vignette"
          className="absolute inset-0
                     bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]"
        />

        {/* 필름 그레인 노이즈 — SVG feTurbulence 기반 미세 텍스처 */}
        <div
          data-intro="grain"
          className="absolute inset-0 film-grain opacity-[0.06] mix-blend-overlay"
        />

        {/* 가운데 가로선 컨테이너 — T=0.2s에 선 reveal, T=0.7s에 양갈래 splits */}
        <div
          data-intro="horizon"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2
                     flex items-center justify-center pointer-events-none"
        >
          {/* 선 전체 래퍼 — scaleX 0→1 (origin-left) 으로 좌→우 reveal
              내부에 두 절반선을 품고 있어 splits 효과 가능
              w-screen: 100vw 너비 고정 (scaleX 애니메이션의 기준) */}
          <motion.span
            data-intro="horizon-line"
            initial={{ scaleX: 0 }}
            animate={horizonControls}
            className="relative block h-px w-screen origin-left will-change-transform overflow-visible"
          >
            {/* 왼쪽 절반선 — splits 시 오른쪽에서 왼쪽 끝으로 이동
                right-0 to right-1/2: 선의 왼쪽 절반을 차지 */}
            <motion.span
              data-intro="horizon-left"
              initial={{ x: 0, opacity: 1 }}
              animate={horizonLeftControls}
              className="absolute right-1/2 top-0 h-full w-1/2 bg-white/70 will-change-transform"
            />

            {/* 오른쪽 절반선 — splits 시 왼쪽에서 오른쪽 끝으로 이동
                left-1/2: 선의 오른쪽 절반을 차지 */}
            <motion.span
              data-intro="horizon-right"
              initial={{ x: 0, opacity: 1 }}
              animate={horizonRightControls}
              className="absolute left-1/2 top-0 h-full w-1/2 bg-white/70 will-change-transform"
            />
          </motion.span>
        </div>
      </motion.div>
    </main>
  )
}
