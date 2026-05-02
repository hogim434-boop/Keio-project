'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthHeader } from '../_components/auth-header'
import { createClient } from '@/lib/supabase/client'

const pageContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function ProgressBar({ active }: { active: boolean }) {
  return (
    <div
      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
        active ? 'bg-foreground' : 'bg-muted'
      }`}
    />
  )
}

// Google 공식 컬러 로고
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const shouldReduce = useReducedMotion()

  // URL 쿼리 파라미터로 전달된 에러 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err === 'domain') {
      setErrorMsg('게이오 이메일(@keio.jp)만 가입 가능합니다')
    } else if (err === 'auth') {
      setErrorMsg('인증 중 오류가 발생했습니다. 다시 시도해 주세요')
    }
  }, [])

  async function handleGoogleSignIn() {
    setLoading(true)
    setErrorMsg(null)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Google에 keio.jp 도메인 계정 힌트 제공 (강제는 아님 — 서버에서 재검증)
        queryParams: { hd: 'keio.jp' },
      },
    })
    // OAuth 리다이렉트 후에는 실행되지 않음 — setLoading(false) 불필요
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <AuthHeader />

      <motion.div
        variants={shouldReduce ? {} : pageContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col justify-center mx-auto max-w-sm w-full px-6 py-8"
      >
        {/* 진행 표시 (1/2) */}
        <motion.div variants={shouldReduce ? {} : fadeUp} className="flex gap-1.5 mb-8">
          <ProgressBar active={true} />
          <ProgressBar active={false} />
        </motion.div>

        {/* 제목 */}
        <motion.h1
          variants={shouldReduce ? {} : fadeUp}
          className="text-3xl font-bold mb-2"
        >
          회원가입
        </motion.h1>

        {/* 설명 */}
        <motion.p
          variants={shouldReduce ? {} : fadeUp}
          className="text-sm text-muted-foreground mb-8 leading-relaxed"
        >
          게이오 학생임을 확인하기 위해<br />
          keio.jp 이메일로 로그인해 주세요
        </motion.p>

        {/* 에러 메시지 */}
        {errorMsg && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl bg-destructive/10 px-5 py-3 text-sm text-destructive"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Google 인증 버튼 */}
        <motion.div variants={shouldReduce ? {} : fadeUp}>
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.02 }}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full rounded-full h-12 gap-2 font-medium"
            >
              <GoogleIcon />
              {loading ? '연결 중…' : 'Google로 keio.jp 인증하기'}
            </Button>
          </motion.div>
        </motion.div>

        {/* 안내 박스 */}
        <motion.div variants={shouldReduce ? {} : fadeUp} className="mt-4">
          <p className="rounded-xl bg-muted px-5 py-3 text-xs text-muted-foreground leading-relaxed">
            Google 로그인 후 게이오 대학교 인증 화면이 나타납니다.
            keio.jp 계정으로 로그인하면 자동으로 돌아옵니다.
          </p>
        </motion.div>

        {/* 구분선 */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp}
          className="my-6 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>

        {/* 로그인 링크 */}
        <motion.p
          variants={shouldReduce ? {} : fadeUp}
          className="text-center text-sm text-muted-foreground"
        >
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
          >
            로그인
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
