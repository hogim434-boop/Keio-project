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
import {
  AUTH_INPUT_CLASS,
  authFadeUp,
  authField,
  authFormContainer,
  authPageContainer,
} from '../../_components/auth-styles'
import { createClient } from '@/lib/supabase/client'
import { SetupFormSchema, type SetupFormData } from '@/types/auth'
import { CAMPUS_VALUES, GRADE_VALUES } from '@/types/domain'
import { getCampusLabel, getGradeLabel } from '@/lib/locale/labels'

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
        message: 'エラーが発生しました。もう一度お試しください',
      })
      return
    }

    await supabase.auth.signOut()
    router.replace('/login')
  }

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
        variants={shouldReduce ? {} : authPageContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col justify-center mx-auto max-w-sm w-full px-6 py-8"
      >
        {/* 進捗 (2/2) */}
        <motion.div variants={shouldReduce ? {} : authFadeUp} className="flex gap-1.5 mb-8">
          <ProgressBar active={true} />
          <ProgressBar active={true} />
        </motion.div>

        <motion.h1
          variants={shouldReduce ? {} : authFadeUp}
          className="text-3xl font-bold mb-8"
        >
          アカウント設定
        </motion.h1>

        <motion.form
          variants={shouldReduce ? {} : authFormContainer}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* 認証済み keio.jp メール */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label>認証済みの keio.jp メールアドレス</Label>
            <div className="flex h-12 items-center gap-3 rounded-full bg-muted px-5">
              <CheckCircle2 size={16} className="shrink-0 text-green-500" />
              <span className="truncate text-sm font-medium">{verifiedEmail}</span>
            </div>
          </motion.div>

          {/* ニックネーム */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label htmlFor="nickname">ニックネーム</Label>
            <Input
              id="nickname"
              placeholder="アプリ上で表示される名前"
              autoComplete="nickname"
              aria-invalid={!!errors.nickname}
              className={AUTH_INPUT_CLASS}
              {...register('nickname')}
            />
            {errors.nickname?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.nickname.message}
              </p>
            )}
          </motion.div>

          {/* パスワード */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="8文字以上、英数字を含む"
              autoComplete="new-password"
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

          {/* パスワード確認 */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label htmlFor="confirmPassword">パスワード確認</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="もう一度入力"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className={AUTH_INPUT_CLASS}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </motion.div>

          {/* キャンパス */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label>キャンパス</Label>
            <Controller
              name="campus"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value ?? ''} onValueChange={f.onChange}>
                  <SelectTrigger
                    aria-invalid={!!errors.campus}
                    className="rounded-full bg-muted border-0 h-12 px-5"
                  >
                    <SelectValue placeholder="キャンパスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPUS_VALUES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {getCampusLabel(c)}
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

          {/* 学年 */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label>学年</Label>
            <Controller
              name="grade"
              control={control}
              render={({ field: f }) => (
                <Select value={f.value ?? ''} onValueChange={f.onChange}>
                  <SelectTrigger
                    aria-invalid={!!errors.grade}
                    className="rounded-full bg-muted border-0 h-12 px-5"
                  >
                    <SelectValue placeholder="学年を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_VALUES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {getGradeLabel(g)}
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

          {/* 学部 */}
          <motion.div variants={shouldReduce ? {} : authField} className="space-y-2">
            <Label htmlFor="department">学部</Label>
            <Input
              id="department"
              placeholder="例: 経済学部"
              aria-invalid={!!errors.department}
              className={AUTH_INPUT_CLASS}
              {...register('department')}
            />
            {errors.department?.message && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {errors.department.message}
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

          {/* 登録ボタン */}
          <motion.div variants={shouldReduce ? {} : authField}>
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
                {isSubmitting ? '処理中…' : '登録する'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
