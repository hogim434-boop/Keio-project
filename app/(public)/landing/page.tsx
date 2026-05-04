'use client'

/**
 * 랜딩 페이지 — 비로그인 사용자의 첫 진입점 (Phase 2A/2B 풀 리뉴얼)
 *
 * 구조:
 *   1. 글래스 sticky 헤더
 *   2. Hero 섹션 — 거대 타이포 + 그라데이션 + stagger 등장
 *   3. 3 특징 카드 섹션 — whileInView stagger + hover lift
 *   4. CTA 푸터 섹션 — whileInView + glow 버튼
 *
 * 모션 전략:
 *   - 진입 시 헤더 → 배지 → 타이틀(blur 풀림) → 부제 → CTA 버튼 순 stagger
 *   - 스크롤 시 3 카드 순차 등장 (once:true)
 *   - CTA 버튼: whileHover scale 1.02 + whileTap scale 0.96 (springTap)
 *   - 카드 hover: y:-4 + scale:1.01 (cardLift)
 *   - useReducedMotion 가드: 시스템 "모션 줄이기" 활성 시 transition duration:0 으로 전환
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion, useReducedMotion } from 'framer-motion'
import {
  staggerFast,
  fadeInUp,
  heroFadeUp,
  springTap,
  cardLift,
} from '@/lib/motion-variants'
import { ShieldCheck, MessageCircle, Users } from 'lucide-react'

// ─── useReducedMotion 가드용 transition 오버라이드 ───────────────────────────
// 시스템 "모션 줄이기" 설정이 켜져 있을 때 duration:0 으로 모든 전환을 즉시 완료
const INSTANT = { duration: 0 }

// ─── 3 특징 카드 데이터 ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: ShieldCheck,
    // 타이틀 (일본어)
    title: '完全クローズド',
    // 설명 (일본어)
    desc: 'keio.jp / g.keio.ac.jp / sfc.keio.ac.jp メールで本人確認。慶應生だけの安心空間。',
  },
  {
    icon: MessageCircle,
    title: '匿名で自由に',
    desc: '就活・恋愛・授業の悩みも、名前を出さずに本音で話せます。',
  },
  {
    icon: Users,
    title: 'キャンパスを超えて',
    desc: '日吉・三田・矢上・SFC。キャンパスの壁を越えてつながろう。',
  },
] as const

// ─── 특징 카드 컴포넌트 ──────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  reducedMotion,
}: {
  icon: (typeof FEATURES)[number]['icon']
  title: string
  desc: string
  reducedMotion: boolean
}) {
  return (
    // fadeInUp: 부모 staggerFast 컨테이너가 순서대로 등장시킴
    // cardLift: hover 시 살짝 떠오르는 효과 (initial="rest" whileHover="hover")
    // 두 가지 variants 를 함께 쓰기 위해 fadeInUp 을 wrapping div 에, cardLift 를 article 에 분리
    <motion.div variants={fadeInUp}>
      <motion.article
        variants={cardLift}
        initial="rest"
        whileHover={reducedMotion ? undefined : 'hover'}
        className="glass-panel rounded-2xl p-6 space-y-3 h-full cursor-default"
      >
        {/* 아이콘 — 그라데이션 배경 원형 뱃지 */}
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-violet shadow-glow-violet">
          <Icon className="w-5 h-5 text-white" />
        </div>

        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </motion.article>
    </motion.div>
  )
}

// ─── 메인 페이지 컴포넌트 ────────────────────────────────────────────────────
export default function LandingPage() {
  // 시스템 "모션 줄이기" 설정값 (true 면 모션 최소화)
  const shouldReduceMotion = useReducedMotion() ?? false

  // reducedMotion 활성 시 transition 을 즉시(duration:0) 완료하도록 오버라이드
  const motionProps = shouldReduceMotion
    ? { transition: INSTANT }
    : {}

  return (
    // 페이지 전체 래퍼 — 배경 그라데이션 orb 는 globals.css 키프레임으로 처리
    <div className="relative isolate overflow-hidden min-h-dvh flex flex-col">

      {/* ── 배경 글로우 orb ── */}
      {/* orb-drift-1 / orb-drift-2 키프레임은 globals.css 에 정의됨 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, oklch(0.6 0.22 270 / 0.6), transparent 70%)',
          animation: 'orb-drift-1 7s ease-in-out infinite alternate',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 w-[360px] h-[360px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, oklch(0.7 0.18 250 / 0.5), transparent 70%)',
          animation: 'orb-drift-2 9s ease-in-out infinite alternate',
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          1. 글래스 sticky 헤더
          initial: 위에서(-20px) 투명하게 → animate: 정위치 불투명
          duration: 0.5s, expo-out easing
         ══════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? INSTANT : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 glass-panel border-b border-border/40 px-6 py-3 flex items-center justify-between"
      >
        {/* 서비스명 로고 */}
        <span className="text-sm font-bold tracking-widest text-gradient-violet">
          KEIO SHARE
        </span>
        {/* 헤더 로그인 링크 */}
        <Button asChild variant="ghost" size="sm" className="text-xs h-8">
          <Link href="/login">ログイン</Link>
        </Button>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════
          2. Hero 섹션
          staggerFast 컨테이너: 자식들이 0.04s 간격으로 순차 등장
          delayChildren: 0.05s (헤더 등장 직후 시작)
         ══════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={staggerFast}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 gap-6"
      >
        {/* 작은 배지 — fadeInUp: y:16 → 0 + opacity */}
        <motion.div
          variants={fadeInUp}
          {...motionProps}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel ring-glow-violet text-xs text-muted-foreground font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-violet animate-pulse" />
          慶應義塾大学生限定
        </motion.div>

        {/* 거대 타이틀 — heroFadeUp: y:32 + blur(8px) → 0 (0.7s, 무게감) */}
        <motion.h1
          variants={heroFadeUp}
          {...motionProps}
          className="text-5xl sm:text-6xl font-black tracking-tighter leading-none text-gradient-violet"
        >
          慶應生の<br />
          本音が集まる場所
        </motion.h1>

        {/* 부제 — fadeInUp */}
        <motion.p
          variants={fadeInUp}
          {...motionProps}
          className="max-w-xs text-sm text-muted-foreground leading-relaxed"
        >
          keio.jp メールアドレスで本人確認。<br />
          匿名だから、本音で話せる。<br />
          キャンパスライフ・就活・恋愛まで。
        </motion.p>

        {/* CTA 버튼 그룹 — fadeInUp */}
        <motion.div
          variants={fadeInUp}
          {...motionProps}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2"
        >
          {/* Primary CTA — whileHover scale:1.02 + whileTap scale:0.96 (springTap) */}
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            transition={springTap}
            className="flex-1"
          >
            <Button
              asChild
              size="lg"
              className="w-full h-12 text-base font-semibold bg-gradient-violet shadow-glow-violet border-0 hover:opacity-90"
            >
              <Link href="/signup">今すぐ始める</Link>
            </Button>
          </motion.div>

          {/* Secondary CTA — 동일한 spring tap */}
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            transition={springTap}
            className="flex-1"
          >
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold glass-panel border-border/60"
            >
              <Link href="/login">ログイン</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* 가입 조건 안내 — fadeInUp */}
        <motion.p
          variants={fadeInUp}
          {...motionProps}
          className="text-xs text-muted-foreground/60"
        >
          ※ keio.jp / g.keio.ac.jp / sfc.keio.ac.jp メール必須
        </motion.p>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          3. 3 특징 카드 섹션
          whileInView: 스크롤로 화면에 들어올 때 등장 (once:true)
          margin:'-80px' — 뷰포트 80px 전에 미리 트리거
         ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 pb-20">
        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              desc={feature.desc}
              reducedMotion={shouldReduceMotion}
            />
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. CTA 푸터 섹션
          whileInView fadeInUp + 버튼 glow 강조
         ══════════════════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeInUp}
        {...motionProps}
        className="px-6 pb-16 flex flex-col items-center gap-4 text-center"
      >
        <p className="text-sm text-muted-foreground">
          今すぐ慶應生コミュニティに参加しよう
        </p>

        {/* glow 강조 CTA 버튼 — shadow-glow-violet + spring tap */}
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
          transition={springTap}
        >
          <Button
            asChild
            size="lg"
            className="h-12 px-10 text-base font-semibold bg-gradient-violet shadow-glow-violet border-0 hover:opacity-90"
          >
            <Link href="/signup">無料で始める →</Link>
          </Button>
        </motion.div>
      </motion.section>

    </div>
  )
}
