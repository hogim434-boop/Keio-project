'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AuthHeader } from '../../_components/auth-header'
import { createClient } from '@/lib/supabase/client'
import { SetupFormSchema, type SetupFormData } from '@/types/auth'
import { CAMPUS_VALUES, GRADE_VALUES } from '@/types/domain'

// 학년: GRADE_VALUES + 라벨 매핑
const GRADES = GRADE_VALUES.map((value) => ({
  value,
  label: value === '대학원' ? '대학원' : `${value}학년`,
}))

const pageContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
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
  visible: { transition: { staggerChildren: 0.06 } },
}

const field = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
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

export default function SetupPage() {
  const router = useRouter()
  const shouldReduce = useReducedMotion()

  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [initializing, setInitializing] = useState(true)

  // RHF + SetupFormSchema (비밀번호 강화 + 필드별 검증 + confirmPassword 일치)
  const form = useForm<SetupFormData>({
    resolver: zodResolver(SetupFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      nickname: '',
      campus: undefined,
      grade: undefined,
      department: '',
    },
    mode: 'onSubmit',
  })

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = form

  // 페이지 진입 시 세션 확인
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/signup')
        return
      }
      // 이미 설정 완료된 사용자
      if (user.user_metadata?.password_set === true) {
        router.replace('/')
        return
      }

      setVerifiedEmail(user.email ?? '')
      setInitializing(false)
    }
    checkSession()
  }, [router])

  async function onSubmit(values: SetupFormData) {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: values.password,
      data: {
        password_set: true,
        nickname: values.nickname,
        campus: values.campus,
        grade: values.grade,
        department: values.department,
      },
    })

    if (error) {
      setError('root', {
        type: 'manual',
        message: '오류가 발생했습니다. 다시 시도해 주세요',
      })
      return
    }

    await supabase.auth.signOut()
    router.replace('/login')
  }

  // 세션 확인 중 로딩 스피너
  if (initializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    )
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
        {/* 진행 표시 (2/2) */}
        <motion.div variants={shouldReduce ? {} : fadeUp} className="flex gap-1.5 mb-8">
          <ProgressBar active={true} />
          <ProgressBar active={true} />
        </motion.div>

        {/* 제목 */}
        <motion.h1
          variants={shouldReduce ? {} : fadeUp}
          className="text-3xl font-bold mb-8"
        >
          계정 설정
        </motion.h1>

        <motion.form
          variants={shouldReduce ? {} : formContainer}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* 인증된 keio.jp 이메일 표시 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label>인증된 keio.jp 이메일</Label>
            <div className="flex h-12 items-center gap-3 rounded-full bg-muted px-5">
              <CheckCircle2 size={16} className="shrink-0 text-green-500" />
              <span className="truncate text-sm font-medium">{verifiedEmail}</span>
            </div>
          </motion.div>

          {/* 닉네임 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              placeholder="앱에서 표시될 이름"
              autoComplete="nickname"
              aria-invalid={!!errors.nickname}
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
              {...register('nickname')}
            />
            {errors.nickname?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.nickname.message}
              </p>
            )}
          </motion.div>

          {/* 비밀번호 설정 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="password">비밀번호 설정</Label>
            <Input
              id="password"
              type="password"
              placeholder="8자 이상, 영문+숫자 포함"
              autoComplete="new-password"
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

          {/* 비밀번호 확인 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </motion.div>

          {/* 캠퍼스 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label>캠퍼스</Label>
            <Controller
              name="campus"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value ?? ''} onValueChange={f.onChange}>
                  <SelectTrigger
                    aria-invalid={!!errors.campus}
                    className="rounded-full bg-muted border-0 h-12 px-5"
                  >
                    <SelectValue placeholder="캠퍼스 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPUS_VALUES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.campus?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.campus.message}
              </p>
            )}
          </motion.div>

          {/* 학년 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label>학년</Label>
            <Controller
              name="grade"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value ?? ''} onValueChange={f.onChange}>
                  <SelectTrigger
                    aria-invalid={!!errors.grade}
                    className="rounded-full bg-muted border-0 h-12 px-5"
                  >
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.grade?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.grade.message}
              </p>
            )}
          </motion.div>

          {/* 학부 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="department">학부</Label>
            <Input
              id="department"
              placeholder="예: 経済学部"
              aria-invalid={!!errors.department}
              className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
              {...register('department')}
            />
            {errors.department?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.department.message}
              </p>
            )}
          </motion.div>

          {/* 폼 전체 에러 (서버 오류 등) */}
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

          {/* 가입하기 버튼 */}
          <motion.div variants={shouldReduce ? {} : field}>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.02 }}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full h-12 mt-1"
              >
                {isSubmitting ? '처리 중…' : '가입하기'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
