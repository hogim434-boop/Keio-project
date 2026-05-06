'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthHeader } from '../_components/auth-header'
import {
  AUTH_INPUT_CLASS,
  authFadeUp,
  authField,
  authFormContainer,
  authPageContainer,
} from '../_components/auth-styles'
import { createClient } from '@/lib/supabase/client'
import { LoginFormSchema, type LoginFormData } from '@/types/auth'

export default function LoginPage() {
  const router = useRouter()
  const shouldReduce = useReducedMotion()

  // RHF + zodResolver — LoginFormSchema 검증 (keio.jp 도메인 + 비밀번호 필수)
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form

  async function onSubmit(values: LoginFormData) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      setError('root', {
        type: 'manual',
        message: 'メールアドレスまたはパスワードが正しくありません',
      })
      return
    }

    // 로그인 직후 쿠키가 서버에 반영되도록 RSC 재실행을 강제 (race condition 방지)
    router.refresh()
    router.replace('/')
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
        <motion.h1
          variants={shouldReduce ? {} : authFadeUp}
          className="text-3xl font-bold mb-8"
        >
          ログイン
        </motion.h1>

        <motion.form
          variants={shouldReduce ? {} : authFormContainer}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="xxx@keio.jp"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={AUTH_INPUT_CLASS}
              {...register('email')}
            />
            {errors.email?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </motion.div>

          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="パスワードを入力"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className={AUTH_INPUT_CLASS}
              {...register('password')}
            />
            {errors.password?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {errors.root?.message && (
            <motion.p
              role="alert"
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-destructive/10 px-5 py-3 text-center text-sm text-destructive"
            >
              {errors.root.message}
            </motion.p>
          )}

          <motion.div variants={shouldReduce ? {} : authField}>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.02 }}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full h-12 mt-2"
              >
                {isSubmitting ? 'ログイン中…' : 'ログイン'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>

        <motion.p
          variants={shouldReduce ? {} : authFadeUp}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          アカウントをお持ちでない方は{' '}
          <Link
            href="/signup"
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
          >
            新規登録
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
