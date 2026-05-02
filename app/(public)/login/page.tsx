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

export default function LoginPage() {
  const router = useRouter()
  const shouldReduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

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
                disabled={loading}
                className="w-full rounded-full h-12 mt-2"
              >
                {loading ? '로그인 중…' : '로그인'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>

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
