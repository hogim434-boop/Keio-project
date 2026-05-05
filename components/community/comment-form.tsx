'use client'

/**
 * 댓글 작성 폼 — 하단 fixed 위치 (z-30, BottomTabBar 위)
 *
 * 기능:
 *  - RHF + zodResolver(CommentFormSchema)
 *  - 返信 모드: replyTo props 전달 시 parentId 자동 설정 + 취소 UI
 *  - 익명 라디오: 匿名で投稿(default) / ニックネーム表示
 *  - 제출 성공: form.reset + router.refresh() + onSubmitted()
 *  - 401 → /login 리다이렉트
 *  - 유효성 에러 → RHF setError
 *  - 기타 에러 → sonner toast.error
 *
 * 위치: bottom 계산에 safe-area-inset-bottom 포함 (iOS 홈 인디케이터 대응)
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CommentFormSchema } from '@/types/community'
import type { CommentFormData } from '@/types/community'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { X, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface CommentFormProps {
  postId: string
  replyTo: { id: string; preview: string } | null
  onSubmitted: () => void
  onCancelReply: () => void
}

export function CommentForm({
  postId,
  replyTo,
  onSubmitted,
  onCancelReply,
}: CommentFormProps) {
  const router = useRouter()
  // 시스템 "모션 줄이기" 설정 감지 — 접근성 대응
  const shouldReduce = useReducedMotion()

  // 폼 높이를 CSS 변수(--comment-form-h)로 발행 → WriteFab 이 동적으로 추종
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<CommentFormData>({
    resolver: zodResolver(CommentFormSchema),
    mode: 'onChange',
    defaultValues: {
      postId,
      parentId: null,
      body: '',
      isAnonymous: true,
    },
  })

  // 返信 모드 변경 시 parentId 자동 설정
  useEffect(() => {
    form.setValue('parentId', replyTo?.id ?? null, { shouldDirty: true })
  }, [replyTo, form])

  // 폼 실제 높이를 ResizeObserver 로 측정해 CSS 변수에 발행
  // FAB 등 다른 fixed 요소가 var(--comment-form-h) 로 폼 위쪽 좌표를 동기화 가능
  useEffect(() => {
    const el = formRef.current
    if (!el) return

    const update = () => {
      document.documentElement.style.setProperty(
        '--comment-form-h',
        `${el.offsetHeight}px`,
      )
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)

    return () => {
      observer.disconnect()
      // unmount 시 reset → 다른 라우트의 FAB 이 본래 위치로 복귀
      document.documentElement.style.setProperty('--comment-form-h', '0px')
    }
  }, [])

  /**
   * 폼 제출 핸들러
   * POST /api/comments → 성공 시 reset + refresh / 실패 시 에러 처리
   */
  const onSubmit = async (data: CommentFormData) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!json.ok) {
      // 401: 로그인 필요
      if (res.status === 401) {
        router.replace('/login')
        return
      }

      // 422: 유효성 에러 → RHF setError
      if (res.status === 422 && json.error?.issues?.fieldErrors) {
        Object.entries(json.error.issues.fieldErrors).forEach(([k, v]) => {
          form.setError(k as keyof CommentFormData, {
            message: (v as string[])?.[0] ?? '入力値が不正です',
          })
        })
        return
      }

      // 기타 에러
      toast.error('コメントの投稿に失敗しました', {
        description: json.error?.message,
      })
      return
    }

    // 성공: 폼 초기화 (익명 설정 유지)
    form.reset({
      postId,
      parentId: null,
      body: '',
      isAnonymous: form.getValues('isAnonymous'),
    })
    router.refresh()
    onSubmitted()
  }

  return (
    <motion.form
      ref={formRef}
      onSubmit={form.handleSubmit(onSubmit)}
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-[768px] z-30 bg-background border-t px-4 py-2 space-y-2"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      /* 슬라이드업 진입 애니메이션
       * initial: 폼 전체 높이만큼 화면 아래에 숨겨진 상태에서 시작
       * animate: 본래 위치(y=0)로 올라오며 등장
       * transition: 0.5s expo-out (빠르게 치고 올라와 부드럽게 안착 — 뉴욕 스타일 표준 커브)
       * shouldReduce: 접근성 설정 시 duration 0 으로 즉시 표시 */
      initial={shouldReduce ? false : { y: '100%' }}
      animate={{ y: 0 }}
      transition={
        shouldReduce
          ? { duration: 0 }
          : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {/* 返信 모드 표시 + 취소 버튼 */}
      {replyTo && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="truncate">返信先: {replyTo.preview}</span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="返信をキャンセル"
            className="ml-auto p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 텍스트 입력 + 전송 버튼 */}
      <div className="flex gap-2 items-end">
        <Textarea
          {...form.register('body')}
          rows={2}
          maxLength={1000}
          placeholder="コメントを入力..."
          className="resize-none flex-1 min-h-[44px]"
          aria-label="コメント入力"
          aria-invalid={!!form.formState.errors.body}
        />
        <Button
          type="submit"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          aria-label="送信"
          size="icon"
          className="shrink-0"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>

      {/* 익명 / 닉네임 라디오 선택 */}
      <Controller
        control={form.control}
        name="isAnonymous"
        render={({ field }) => (
          <RadioGroup
            value={field.value ? 'anon' : 'nick'}
            onValueChange={(v) => field.onChange(v === 'anon')}
            className="flex gap-4 text-xs"
            aria-label="投稿方法"
          >
            <label className="flex items-center gap-1.5 cursor-pointer">
              <RadioGroupItem value="anon" className="size-3.5" />
              匿名で投稿
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <RadioGroupItem value="nick" className="size-3.5" />
              ニックネーム表示
            </label>
          </RadioGroup>
        )}
      />

      {/* body 유효성 에러 메시지 */}
      {form.formState.errors.body && (
        <p className="text-xs text-red-500" role="alert">
          {form.formState.errors.body.message}
        </p>
      )}
    </motion.form>
  )
}
