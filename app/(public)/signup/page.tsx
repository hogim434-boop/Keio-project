'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthHeader } from '../_components/auth-header'
import { authFadeUp, authPageContainer } from '../_components/auth-styles'
import { createClient } from '@/lib/supabase/client'

function ProgressBar({ active }: { active: boolean }) {
  return (
    <div
      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
        active ? 'bg-foreground' : 'bg-muted'
      }`}
    />
  )
}

// Google 公式カラーロゴ
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

  // URL 쿼리 파라미터로 전달된 에러 확인 (마운트 1회, window 사용을 위한 effect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err === 'domain') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg('keio.jp ドメインのメールアドレスのみご登録いただけます')
    } else if (err === 'auth') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg('認証中にエラーが発生しました。もう一度お試しください')
    }
  }, [])

  async function handleGoogleSignIn() {
    setLoading(true)
    setErrorMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Google에 keio.jp 도메인 계정 힌트 제공 (강제는 아님 — 서버에서 재검증)
        queryParams: { hd: 'keio.jp' },
      },
    })
    if (error) {
      setErrorMsg('Google ログインでエラーが発生しました。もう一度お試しください')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <AuthHeader />

      <motion.div
        variants={shouldReduce ? {} : authPageContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col justify-center mx-auto max-w-sm w-full px-6 py-8"
      >
        {/* 進捗 (1/2) */}
        <motion.div variants={shouldReduce ? {} : authFadeUp} className="flex gap-1.5 mb-8">
          <ProgressBar active={true} />
          <ProgressBar active={false} />
        </motion.div>

        <motion.h1
          variants={shouldReduce ? {} : authFadeUp}
          className="text-3xl font-bold mb-2"
        >
          新規登録
        </motion.h1>

        <motion.p
          variants={shouldReduce ? {} : authFadeUp}
          className="text-sm text-muted-foreground mb-8 leading-relaxed"
        >
          慶應義塾の在学生であることを確認するため、<br />
          keio.jp のメールアドレスでログインしてください
        </motion.p>

        {errorMsg && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl bg-destructive/10 px-5 py-3 text-sm text-destructive"
          >
            {errorMsg}
          </motion.div>
        )}

        <motion.div variants={shouldReduce ? {} : authFadeUp}>
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
              {loading ? '接続中…' : 'Google で keio.jp 認証'}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div variants={shouldReduce ? {} : authFadeUp} className="mt-4">
          <p className="rounded-xl bg-muted px-5 py-3 text-xs text-muted-foreground leading-relaxed">
            Google ログイン後、慶應義塾の認証画面に遷移します。
            keio.jp アカウントでログインすると自動で戻ります。
          </p>
        </motion.div>

        <motion.div
          variants={shouldReduce ? {} : authFadeUp}
          className="my-6 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">または</span>
          <div className="h-px flex-1 bg-border" />
        </motion.div>

        <motion.p
          variants={shouldReduce ? {} : authFadeUp}
          className="text-center text-sm text-muted-foreground"
        >
          すでにアカウントをお持ちの方は{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
          >
            ログイン
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
