'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { createClient } from '@/lib/supabase/client'
import {
  CAMPUS_VALUES,
  GRADE_VALUES,
  DEPARTMENT_VALUES,
  type Campus,
  type Grade,
  type Department,
} from '@/types/domain'
import { NicknameSchema, PasswordSchema } from '@/types/auth'
import { getCampusLabel, getGradeLabel, getDepartmentLabel } from '@/lib/locale/labels'

const ProfileFormSchema = z.object({
  nickname: NicknameSchema,
  campus: z.enum(CAMPUS_VALUES),
  grade: z.enum(GRADE_VALUES),
  department: z.enum(DEPARTMENT_VALUES),
})
type ProfileFormData = z.infer<typeof ProfileFormSchema>

const PasswordChangeSchema = z
  .object({
    newPassword: PasswordSchema,
    confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })
type PasswordChangeData = z.infer<typeof PasswordChangeSchema>

export default function ProfilePage() {
  const [initializing, setInitializing] = useState(true)
  const [email, setEmail] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      nickname: '',
      campus: undefined,
      grade: undefined,
      department: undefined,
    },
    mode: 'onSubmit',
  })

  const passwordForm = useForm<PasswordChangeData>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  })

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setEmail(user.email ?? '')
        profileForm.reset({
          nickname: (user.user_metadata?.nickname as string) ?? '',
          campus: (user.user_metadata?.campus as Campus | undefined),
          grade: (user.user_metadata?.grade as Grade | undefined),
          department: user.user_metadata?.department as Department | undefined,
        })
      }

      setInitializing(false)
    }
    loadUser()
  }, [profileForm])

  async function onProfileSubmit(values: ProfileFormData) {
    setProfileSuccess(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: values })

    if (error) {
      profileForm.setError('root', {
        type: 'manual',
        message: '保存中にエラーが発生しました。もう一度お試しください',
      })
      return
    }
    setProfileSuccess(true)
  }

  async function onPasswordSubmit(values: PasswordChangeData) {
    setPasswordSuccess(false)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.newPassword })

    if (error) {
      passwordForm.setError('root', {
        type: 'manual',
        message: 'パスワードの変更に失敗しました。再度ログインしてからお試しください',
      })
      return
    }
    setPasswordSuccess(true)
    passwordForm.reset({ newPassword: '', confirmPassword: '' })
  }

  if (initializing) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[768px] px-4 py-6 space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-lg font-semibold">プロフィール設定</h1>
        <p className="text-sm text-muted-foreground">
          ニックネーム・キャンパス・学部などを変更できます
        </p>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-2">
        <Label>認証済みメールアドレス</Label>
        <Input
          value={email}
          readOnly
          disabled
          className="bg-muted text-muted-foreground"
        />
      </div>

      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="nickname">ニックネーム</Label>
          <Input
            id="nickname"
            placeholder="アプリ上で表示される名前"
            autoComplete="nickname"
            aria-invalid={!!profileForm.formState.errors.nickname}
            {...profileForm.register('nickname')}
          />
          {profileForm.formState.errors.nickname?.message && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {profileForm.formState.errors.nickname.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="campus-select">キャンパス</Label>
          <Controller
            name="campus"
            control={profileForm.control}
            render={({ field: f }) => (
              <Select value={f.value ?? ''} onValueChange={f.onChange}>
                <SelectTrigger
                  id="campus-select"
                  aria-invalid={!!profileForm.formState.errors.campus}
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
          {profileForm.formState.errors.campus?.message && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {profileForm.formState.errors.campus.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade-select">学年</Label>
          <Controller
            name="grade"
            control={profileForm.control}
            render={({ field: f }) => (
              <Select value={f.value ?? ''} onValueChange={f.onChange}>
                <SelectTrigger
                  id="grade-select"
                  aria-invalid={!!profileForm.formState.errors.grade}
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
          {profileForm.formState.errors.grade?.message && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {profileForm.formState.errors.grade.message}
            </p>
          )}
        </div>

        {/* 学部 — 자유 입력 대신 고정 선택지 (캠퍼스/학년과 동일 패턴) */}
        <div className="space-y-2">
          <Label>学部</Label>
          <Controller
            name="department"
            control={profileForm.control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-invalid={!!profileForm.formState.errors.department}
                >
                  <SelectValue placeholder="学部を選択" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_VALUES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {getDepartmentLabel(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {profileForm.formState.errors.department?.message && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {profileForm.formState.errors.department.message}
            </p>
          )}
        </div>

        {profileForm.formState.errors.root?.message && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {profileForm.formState.errors.root.message}
          </p>
        )}

        {profileSuccess && (
          <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600">
            プロフィールを保存しました
          </p>
        )}

        <Button type="submit" className="w-full" disabled={profileForm.formState.isSubmitting}>
          {profileForm.formState.isSubmitting ? '保存中…' : 'プロフィールを保存'}
        </Button>
      </form>

      <div className="h-px bg-border" />

      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">パスワード変更</h2>
        <p className="text-sm text-muted-foreground">
          新しいパスワードは8文字以上、英数字を含めてください
        </p>
      </div>

      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="newPassword">新しいパスワード</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="8文字以上、英数字を含む"
            autoComplete="new-password"
            aria-invalid={!!passwordForm.formState.errors.newPassword}
            {...passwordForm.register('newPassword')}
          />
          {passwordForm.formState.errors.newPassword?.message && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード確認</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="もう一度入力"
            autoComplete="new-password"
            aria-invalid={!!passwordForm.formState.errors.confirmPassword}
            {...passwordForm.register('confirmPassword')}
          />
          {passwordForm.formState.errors.confirmPassword?.message && (
            <p role="alert" className="px-2 text-xs text-destructive">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {passwordForm.formState.errors.root?.message && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {passwordForm.formState.errors.root.message}
          </p>
        )}

        {passwordSuccess && (
          <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600">
            パスワードを変更しました
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={passwordForm.formState.isSubmitting}
        >
          {passwordForm.formState.isSubmitting ? '変更中…' : 'パスワードを変更'}
        </Button>
      </form>
    </div>
  )
}
