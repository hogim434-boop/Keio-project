'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthHeader } from '../_components/auth-header'
import { createClient } from '@/lib/supabase/client'

const pageContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const formContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const field = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
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

export default function LoginPage() {
  const router = useRouter()
  const shouldReduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
      return
    }

    router.replace('/courses')
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setErrorMsg('')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'keio.jp' },
      },
    })
    // OAuth 리다이렉트 후 실행되지 않음
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
        {/* 제목 */}
        <motion.h1
          variants={shouldReduce ? {} : fadeUp}
          className="text-3xl font-bold mb-8"
        >
          로그인
        </motion.h1>

        {/* 이메일 + 비밀번호 폼 */}
        <motion.form
          variants={shouldReduce ? {} : formContainer}
          onSubmit={handleLogin}
          className="space-y-4"
        >
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

          {/* 에러 메시지 */}
          {errorMsg && (
            <motion.p
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-destructive/10 px-5 py-3 text-center text-sm text-destructive"
            >
              {errorMsg}
            </motion.p>
          )}

          <motion.div variants={shouldReduce ? {} : field}>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.02 }}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full rounded-full h-12 mt-2"
              >
                {loading ? '로그인 중…' : '로그인'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>

        {/* 구분선 */}
        <motion.div
          variants={shouldReduce ? {} : fadeUp}
          className="my-6 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>

        {/* Google OAuth 로그인 */}
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
              disabled={loading || googleLoading}
              className="w-full rounded-full h-12 gap-2 font-medium"
            >
              <GoogleIcon />
              {googleLoading ? '연결 중…' : 'Google로 계속하기'}
            </Button>
          </motion.div>
        </motion.div>

        {/* 회원가입 링크 */}
        <motion.p
          variants={shouldReduce ? {} : fadeUp}
          className="mt-6 text-center text-sm text-muted-foreground"
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
