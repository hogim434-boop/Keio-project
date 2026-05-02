'use client'

/**
 * LoginPage — 로그인 페이지
 *
 * 애니메이션 전략:
 * 1. AuthHeader: 독립적으로 위에서 슬라이드인 (0.4s)
 * 2. pageContainer variants: 자식 요소들을 0.08s 간격으로 순차 등장 (delayChildren 0.15s)
 * 3. 제목 "로그인": fadeUp — y 16px 아래에서 부드럽게 올라옴
 * 4. 폼 필드들 (formContainer): 내부적으로 0.07s 간격 stagger
 * 5. 버튼: motion.div 외부 래핑으로 whileHover/whileTap 마이크로인터랙션
 * 6. 구분선, 링크: fadeUp으로 마지막에 부드럽게 등장
 * 7. useReducedMotion(): 접근성 — OS 모션 줄이기 설정 존중
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthHeader } from '../_components/auth-header'

// ─────────────────────────────────────────
// Framer Motion variants 정의
// variants = 여러 애니메이션 상태를 이름(hidden/visible)으로 묶어두는 객체
// 부모에 variants를 쓰면 자식들이 자동으로 같은 이름의 상태를 따라감
// ─────────────────────────────────────────

/**
 * 페이지 전체 컨테이너 variants
 * - staggerChildren 0.08s: 자식 요소들이 0.08초 간격으로 순차 등장
 * - delayChildren 0.15s: 헤더 애니메이션 후 0.15초 대기하다가 시작
 */
const pageContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

/**
 * 블록 단위 등장 (제목, 구분선, 링크 등)
 * - opacity: 투명 → 불투명
 * - y: 16px 아래에서 제자리로 올라옴 (가벼운 슬라이드업)
 * - duration 0.5s, ease [0.22, 1, 0.36, 1]: expo out — 빠르게 시작해 부드럽게 정착
 */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

/**
 * 폼 내부 컨테이너 variants
 * - staggerChildren 0.07s: 각 필드가 0.07초 간격으로 차례로 등장
 */
const formContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

/**
 * 개별 폼 필드 등장 variants
 * - y: 10px 아래에서 올라옴 (fadeUp보다 이동 거리 작게 — 필드는 촘촘하므로)
 * - duration 0.4s: 블록보다 약간 빠르게
 */
const field = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ─────────────────────────────────────────
// 컴포넌트 본체
// ─────────────────────────────────────────

export default function LoginPage() {
  // 폼 상태 — 기존 유지
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // OS의 "모션 줄이기" 설정 감지 — true면 모든 variants를 {} 로 교체해 즉시 표시
  const shouldReduce = useReducedMotion()

  return (
    // 전체 페이지를 세로로 배치하는 flex 컨테이너
    // min-h-dvh: 화면 전체 높이를 차지 (dvh = dynamic viewport height, 모바일 주소창 고려)
    <div className="flex flex-col min-h-dvh">

      {/* ── 헤더: 독립적으로 위에서 슬라이드인 ── */}
      <AuthHeader />

      {/*
        폼 영역 컨테이너
        - flex-1: 헤더가 차지하고 남은 공간을 모두 채움
        - flex flex-col justify-center: 폼을 세로 중앙에 배치
        - motion.div + variants: 자식 요소들을 순차적으로 등장시킴
      */}
      <motion.div
        variants={shouldReduce ? {} : pageContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col justify-center mx-auto max-w-sm w-full px-6 py-8"
      >
        {/* 페이지 제목: fadeUp으로 등장 */}
        <motion.h1
          variants={shouldReduce ? {} : fadeUp}
          className="text-3xl font-bold mb-8"
        >
          로그인
        </motion.h1>

        {/*
          폼: formContainer variants로 내부 필드들을 stagger 등장시킴
          motion.form = framer-motion이 모든 HTML 태그를 지원하므로 form도 사용 가능
        */}
        <motion.form
          variants={shouldReduce ? {} : formContainer}
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          {/* 이메일 필드: field variants로 순서에 맞게 등장 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="email">메일 주소</Label>
            <Input
              id="email"
              type="email"
              placeholder="xxx@keio.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
            />
          </motion.div>

          {/* 비밀번호 필드: 이메일 다음 0.07s 뒤에 등장 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
            />
          </motion.div>

          {/*
            버튼 영역
            - Button 컴포넌트에 직접 motion()을 쓰면 shadcn과 충돌 가능
            - motion.div로 외부 래핑해서 whileHover/whileTap을 적용하는 안전한 방법 사용
            - whileHover scale 1.02: 살짝 커지는 리프트 효과 (너무 크면 부자연스러움)
            - whileTap scale 0.98: 클릭 시 살짝 눌리는 피드백
            - transition 0.15s: 마이크로인터랙션은 빠를수록 자연스러움
          */}
          <motion.div variants={shouldReduce ? {} : field}>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.02 }}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button type="submit" className="w-full rounded-full h-12 mt-2">
                로그인
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>

        {/* 구분선: 폼 다음에 fadeUp으로 등장 */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp}
          className="my-6 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>

        {/* 회원가입 링크: 마지막으로 부드럽게 등장 */}
        <motion.p
          variants={shouldReduce ? {} : fadeUp}
          className="text-center text-sm text-muted-foreground"
        >
          계정이 없으신가요?{' '}
          <Link
            href="/signup"
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
          >
            회원가입
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
