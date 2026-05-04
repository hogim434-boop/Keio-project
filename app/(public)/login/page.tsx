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
import { createClient } from '@/lib/supabase/client'
import { LoginFormSchema, type LoginFormData } from '@/types/auth'

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
      // Supabase 인증 실패 → 폼 전체 에러로 표시
      setError('root', {
        type: 'manual',
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      })
      return
    }

    router.replace('/')
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
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="email">메일 주소</Label>
            <Input
              id="email"
              type="email"
              placeholder="xxx@keio.jp"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
              {...register('email')}
            />
            {/* 필드별 인라인 에러 */}
            {errors.email?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </motion.div>

          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
              {...register('password')}
            />
            {errors.password?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* 폼 전체 에러 (서버 인증 실패 등) */}
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

          <motion.div variants={shouldReduce ? {} : field}>
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
                {isSubmitting ? '로그인 중…' : '로그인'}
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
