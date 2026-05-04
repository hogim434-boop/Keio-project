'use client'

/**
 * 게시글 작성 바텀 시트 (80vh)
 *
 * 기능:
 *  - RHF + zodResolver(PostFormSchema) 클라이언트 검증
 *  - fetch POST /api/posts — envelope { ok, data/error } 처리
 *  - localStorage 'jukulog:draft:post' 자동 저장 (debounce 1s) + 復元 토스트
 *  - Sheet onOpenChange 닫힘 시 dirty 면 자동 저장 + 下書き保存 토스트
 *  - 카테고리 칩 가로 스크롤 (snap-x)
 *  - 제목/본문 글자 수 카운터
 *  - 본문 Textarea 자동 높이 조절 (auto-grow)
 *  - isAnonymous RadioGroup (匿名 / ニックネーム)
 *  - 키보드 올라올 때 textarea 스크롤 (visualViewport resize)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Loader2, Check } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

import { PostFormSchema, type PostFormData } from '@/types/community'
import { CATEGORIES } from '@/lib/community/categories'
import { useWriteSheet } from '@/lib/stores/write-sheet-store'
import { cn } from '@/lib/utils'

/** localStorage 드래프트 키 */
const DRAFT_KEY = 'jukulog:draft:post'

/** 드래프트 저장 debounce 딜레이 (ms) */
const DRAFT_DEBOUNCE_MS = 1000

export function WriteBottomSheet() {
  const isOpen = useWriteSheet((s) => s.isOpen)
  const close = useWriteSheet((s) => s.close)
  const router = useRouter()

  // 드래프트 복원 여부 — 시트가 열릴 때 한 번만 체크
  const [draftChecked, setDraftChecked] = useState(false)

  // 본문 textarea ref — 자동 높이 + 키보드 스크롤
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // debounce 타이머 ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<PostFormData>({
    resolver: zodResolver(PostFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      body: '',
      // TODO: categorySlug 초기값 — 사용자가 반드시 선택해야 함
      categorySlug: undefined as unknown as PostFormData['categorySlug'],
      isAnonymous: true,
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = form

  const titleValue = watch('title')
  const bodyValue = watch('body')

  // ────────────────────────────────────────────────
  // 드래프트 복원 — 시트 열릴 때 한 번만 체크
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || draftChecked) return
    setDraftChecked(true)

    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return

    let savedDraft: PostFormData
    try {
      savedDraft = JSON.parse(raw) as PostFormData
    } catch {
      localStorage.removeItem(DRAFT_KEY)
      return
    }

    // 下書きが見つかりました — 復元 or 新規 選択
    toast('下書きが見つかりました', {
      duration: Infinity, // 사용자가 직접 선택할 때까지 유지
      action: {
        label: '復元する',
        onClick: () => {
          reset(savedDraft)
          toast.success('下書きを復元しました')
        },
      },
      cancel: {
        label: '新規作成',
        onClick: () => {
          localStorage.removeItem(DRAFT_KEY)
        },
      },
    })
  }, [isOpen, draftChecked, reset])

  // 시트 닫힐 때 draftChecked 리셋 (다음에 다시 열면 재체크)
  useEffect(() => {
    if (!isOpen) {
      setDraftChecked(false)
    }
  }, [isOpen])

  // ────────────────────────────────────────────────
  // 자동 저장 — dirty 상태에서만 debounce 1s
  // ────────────────────────────────────────────────
  const saveDraft = useCallback(
    (values: PostFormData) => {
      if (!isDirty) return
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    },
    [isDirty]
  )

  useEffect(() => {
    const subscription = watch((values) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        saveDraft(values as PostFormData)
      }, DRAFT_DEBOUNCE_MS)
    })
    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [watch, saveDraft])

  // ────────────────────────────────────────────────
  // Textarea 자동 높이 조절
  // ────────────────────────────────────────────────
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    },
    []
  )

  // ────────────────────────────────────────────────
  // 키보드 올라올 때 textarea 스크롤
  // ────────────────────────────────────────────────
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handler = () => {
      textareaRef.current?.scrollIntoView({ block: 'center' })
    }

    vv.addEventListener('resize', handler)
    return () => vv.removeEventListener('resize', handler)
  }, [])

  // ────────────────────────────────────────────────
  // Sheet onOpenChange — 닫을 때 dirty 처리
  // ────────────────────────────────────────────────
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // 닫힐 때 dirty 상태이면 자동 저장 + 토스트
        if (isDirty) {
          const currentValues = form.getValues()
          localStorage.setItem(DRAFT_KEY, JSON.stringify(currentValues))
          toast.success('下書きを保存しました')
        }
        close()
      }
    },
    [isDirty, form, close]
  )

  // ────────────────────────────────────────────────
  // 폼 제출
  // ────────────────────────────────────────────────
  const onSubmit = async (data: PostFormData) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = (await res.json()) as {
        ok: boolean
        data?: { id: string }
        error?: { code?: string; message?: string; issues?: { fieldErrors?: Record<string, string[]> } }
      }

      if (!json.ok) {
        // 401 — 미인증: 로그인 페이지로 이동
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        // 422 — Zod 검증 오류: 필드별 에러 설정
        if (res.status === 422 && json.error?.issues?.fieldErrors) {
          Object.entries(json.error.issues.fieldErrors).forEach(([k, v]) => {
            setError(k as keyof PostFormData, {
              message: (v as string[])?.[0] ?? '入力値が不正です',
            })
          })
          return
        }
        // 기타 서버 에러
        toast.error('投稿に失敗しました', {
          description: json.error?.message ?? 'もう一度お試しください',
        })
        return
      }

      // 성공 처리
      localStorage.removeItem(DRAFT_KEY)
      close()
      reset()
      router.push(`/posts/${json.data!.id}`)
    } catch {
      // 네트워크 에러
      toast.error('ネットワークエラーが発生しました', {
        description: '接続を確認してください',
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {/*
        side='bottom': 하단에서 슬라이드 업
        h-[80vh]: 화면 80% 높이
        p-0 flex flex-col: 헤더 sticky + 본문 스크롤 레이아웃
        showCloseButton={false}: 커스텀 닫기 버튼 사용
      */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[80vh] p-0 flex flex-col rounded-t-2xl"
      >
        {/* ── 상단 헤더 (sticky) ── */}
        <SheetHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b bg-popover px-4 py-3 gap-0">
          {/* 닫기 버튼 */}
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="閉じる"
              className="h-8 w-8 shrink-0"
            >
              <X size={20} />
            </Button>
          </SheetClose>

          {/* 타이틀 */}
          <SheetTitle className="flex-1 text-center text-base font-semibold">
            投稿する
          </SheetTitle>
          {/* 접근성용 설명 — 시각적으로 숨기지만 aria 에 노출 */}
          <SheetDescription className="sr-only">
            カテゴリーを選び、タイトルと本文を入力して投稿してください。
          </SheetDescription>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            form="write-post-form"
            disabled={!isValid || isSubmitting}
            size="sm"
            className="shrink-0 min-w-[56px]"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              '送信'
            )}
          </Button>
        </SheetHeader>

        {/* ── 본문 영역 (스크롤 가능) ── */}
        <form
          id="write-post-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-4 space-y-5"
        >
          {/* 1) 카테고리 칩 가로 스크롤 */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">
              カテゴリ
            </Label>
            <Controller
              control={control}
              name="categorySlug"
              render={({ field }) => (
                <div
                  className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none' }}
                  aria-label="カテゴリを選択"
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = field.value === cat.slug
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() =>
                          setValue('categorySlug', cat.slug, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        aria-pressed={isSelected}
                        className={cn(
                          'flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:bg-muted'
                        )}
                      >
                        {/* 선택 시 체크 아이콘 */}
                        {isSelected && <Check size={14} strokeWidth={2.5} />}
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            />
            {/* 카테고리 에러 */}
            {errors.categorySlug && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {errors.categorySlug.message}
              </p>
            )}
          </div>

          {/* 2) 제목 Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label
                htmlFor="post-title"
                className="text-sm font-medium text-foreground"
              >
                タイトル
              </Label>
              {/* 글자 수 카운터 */}
              <span className="text-xs text-muted-foreground">
                {titleValue?.length ?? 0}/100
              </span>
            </div>
            <Input
              id="post-title"
              maxLength={100}
              placeholder="タイトル (1〜100文字)"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {/* 제목 에러 */}
            {errors.title && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* 3) 본문 Textarea (auto-grow) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label
                htmlFor="post-body"
                className="text-sm font-medium text-foreground"
              >
                本文
              </Label>
              {/* 글자 수 카운터 */}
              <span className="text-xs text-muted-foreground">
                {bodyValue?.length ?? 0}/5000
              </span>
            </div>
            <Textarea
              id="post-body"
              maxLength={5000}
              placeholder="本文を入力してください... (10〜5000文字)"
              rows={6}
              aria-invalid={!!errors.body}
              style={{ minHeight: '144px', resize: 'none' }}
              {...register('body', {
                onChange: handleTextareaChange,
              })}
              ref={(el) => {
                // react-hook-form ref와 로컬 ref를 병합
                const { ref: rhfRef } = register('body')
                if (typeof rhfRef === 'function') rhfRef(el)
                textareaRef.current = el
              }}
            />
            {/* 본문 에러 */}
            {errors.body && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {errors.body.message}
              </p>
            )}
          </div>

          {/* 4) 익명/닉네임 RadioGroup */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">
              投稿者表示
            </Label>
            <Controller
              control={control}
              name="isAnonymous"
              render={({ field }) => (
                <RadioGroup
                  value={field.value ? 'anonymous' : 'nickname'}
                  onValueChange={(v) => field.onChange(v === 'anonymous')}
                  className="grid grid-cols-2 gap-2"
                >
                  {/* 匿名で投稿 */}
                  <label
                    htmlFor="radio-anonymous"
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                      field.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <RadioGroupItem id="radio-anonymous" value="anonymous" />
                    <span className="text-sm font-medium">匿名で投稿</span>
                  </label>

                  {/* ニックネーム表示 */}
                  <label
                    htmlFor="radio-nickname"
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                      !field.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <RadioGroupItem id="radio-nickname" value="nickname" />
                    <span className="text-sm font-medium">ニックネーム表示</span>
                  </label>
                </RadioGroup>
              )}
            />
          </div>

          {/* 하단 여백 — 키보드가 올라와도 마지막 요소가 가려지지 않도록 */}
          <div className="h-4" aria-hidden="true" />
        </form>
      </SheetContent>
    </Sheet>
  )
}
