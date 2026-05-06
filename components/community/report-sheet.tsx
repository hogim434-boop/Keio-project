'use client'

/**
 * 신고 바텀 시트 컴포넌트 (50vh)
 *
 * 기능:
 *  - RHF + zodResolver(ReportFormSchema) 클라이언트 검증
 *  - 신고 사유 라디오 4건 (暴言・誹謗中傷 / 名誉毀損 / スパム / 違法・不適切なコンテンツ)
 *  - 보충 설명 Textarea — 최대 500자 + 글자 수 카운터
 *  - fetch POST /api/reports — envelope { ok, data/error } 처리
 *    · 200 → toast.success + 시트 닫힘
 *    · 409 UNIQUE → toast.warning + 시트 닫힘 (既に通報済みです)
 *    · 422 → 필드별 에러 설정 (入力値が不正です)
 *    · 401 → router.replace('/login')
 *    · 기타 → toast.error
 *  - target 변경 시 폼 자동 초기화 (제어된 sheet 패턴)
 *  - 重複 안내 텍스트 하단 고정
 *  - write-bottom-sheet.tsx 패턴 통일
 *
 * Phase 4 마이크로 인터랙션:
 * - 신고 사유 Label → motion.label whileHover bg-muted/50 + active 시 보라 ring
 * - 제출 버튼(destructive) → motion.div whileTap scale 0.96 + springTap
 * - useReducedMotion 가드 적용
 */

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

import { ReportFormSchema, type ReportFormData } from '@/types/community'
import { useReportSheet } from '@/lib/stores/report-sheet-store'
import { springTap } from '@/lib/motion-variants'
import { REPORT_REASONS as REASONS } from '@/lib/community/report-labels'

/**
 * 신고 바텀 시트
 * app/(app)/layout.tsx 에 마운트 — 모든 (app) 라우트에서 호출 가능
 */
export function ReportBottomSheet() {
  const { isOpen, target, close } = useReportSheet()
  const router = useRouter()

  // prefers-reduced-motion 접근성 가드
  const shouldReduce = useReducedMotion()

  const form = useForm<ReportFormData>({
    resolver: zodResolver(ReportFormSchema),
    mode: 'onChange',
    defaultValues: {
      targetType: 'post',
      targetId: '',
      // TODO: reason 은 사용자가 선택해야 하므로 초기값 undefined
      reason: undefined as unknown as ReportFormData['reason'],
      description: '',
    },
  })

  // ────────────────────────────────────────────────
  // target 변경 시 폼 초기화 (제어된 sheet 패턴)
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (target) {
      form.reset({
        targetType: target.type,
        targetId: target.id,
        reason: undefined as unknown as ReportFormData['reason'],
        description: '',
      })
    }
  }, [target?.id, target?.type, form])

  // ────────────────────────────────────────────────
  // 폼 제출
  // ────────────────────────────────────────────────
  async function onSubmit(data: ReportFormData): Promise<void> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = (await res.json()) as {
      ok: boolean
      data?: unknown
      error?: {
        code?: string
        message?: string
        dbCode?: string
        issues?: { fieldErrors?: Record<string, string[]> }
      }
    }

    // 200: 신고 접수 성공
    if (json.ok) {
      toast.success('通報を受け付けました。運営が確認します。')
      close()
      form.reset()
      return
    }

    // 401: 미인증 → 로그인 페이지 이동
    if (res.status === 401) {
      router.replace('/login')
      return
    }

    // 409 UNIQUE: 重複 신고 → toast.warning + 시트 닫힘
    if (res.status === 409 || json.error?.code === 'CONFLICT') {
      toast.warning('既に通報済みです')
      close()
      return
    }

    // 422: Zod 검증 오류 → 필드별 에러 설정
    if (res.status === 422 && json.error?.issues?.fieldErrors) {
      Object.entries(json.error.issues.fieldErrors).forEach(([k, v]) => {
        form.setError(k as keyof ReportFormData, {
          message: (v as string[])?.[0] ?? '入力値が不正です',
        })
      })
      return
    }

    // 기타 서버 에러
    toast.error('通報に失敗しました', {
      description: json.error?.message,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => { if (!o) close() }}>
      {/*
        side='bottom': 하단에서 슬라이드 업
        h-[50vh]: 화면 50% 높이 (W6 와이어프레임)
        p-0 flex flex-col: 헤더 sticky + 본문 스크롤 레이아웃
        showCloseButton={false}: 커스텀 닫기 버튼 사용
      */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[50vh] p-0 flex flex-col rounded-t-2xl"
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
            通報
          </SheetTitle>

          {/* 접근성용 설명 — 시각적으로 숨기지만 aria 에 노출 */}
          <SheetDescription className="sr-only">
            投稿またはコメントを運営に通報します
          </SheetDescription>

          {/*
            제출 버튼 — destructive variant
            motion.div 로 감싸 whileTap 탭 피드백 추가
            (Button 자체는 asChild 아님 — div 래퍼로 spring 적용)
          */}
          <motion.div
            whileTap={shouldReduce ? {} : { scale: 0.96 }}
            transition={springTap}
            className="shrink-0"
          >
            <Button
              type="submit"
              form="report-form"
              variant="destructive"
              size="sm"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
              className="h-8"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                '送信'
              )}
            </Button>
          </motion.div>
        </SheetHeader>

        {/* ── 폼 본문 (스크롤 가능) ── */}
        <form
          id="report-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-4 space-y-5"
        >
          {/* 안내 문구 */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p>
              この{target?.type === 'post' ? '投稿' : 'コメント'}を運営に通報します。
            </p>
            <p className="text-xs text-muted-foreground">
              内容は管理者のみが確認できます。
            </p>
          </div>

          {/* 신고 사유 라디오 그룹 */}
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? ''}
                onValueChange={field.onChange}
                className="space-y-1"
                aria-label="通報理由"
              >
                {REASONS.map((r) => {
                  // 현재 이 옵션이 선택된 상태인지 판단
                  const isSelected = field.value === r.value

                  return (
                    /*
                      motion.label 로 hover/active 마이크로 인터랙션:
                      - whileHover: bg 살짝 밝아지는 효과 (CSS transition 으로 처리)
                      - active(isSelected) 시 ring-glow-violet 보라 링 적용
                      - whileTap scale 0.99: 눌리는 미세한 피드백
                    */
                    <motion.label
                      key={r.value}
                      htmlFor={`reason-${r.value}`}
                      whileTap={shouldReduce ? {} : { scale: 0.99 }}
                      transition={springTap}
                      className={`flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-md cursor-pointer transition-colors ${
                        isSelected
                          // active: 보라 ring + bg-primary/8 배경
                          ? 'ring-glow-violet bg-primary/8'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem id={`reason-${r.value}`} value={r.value} />
                      <span className="text-sm">{r.label}</span>
                    </motion.label>
                  )
                })}
              </RadioGroup>
            )}
          />

          {/* 보충 설명 Textarea */}
          <div className="space-y-1">
            <Textarea
              {...form.register('description')}
              maxLength={500}
              placeholder={'補足説明 (任意)\n具体的な状況をご記入ください...'}
              rows={4}
              className="resize-none"
            />
            {/* 글자 수 카운터 */}
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                {form.watch('description')?.length ?? 0} / 500
              </span>
            </div>
          </div>

          {/* 重複 신고 안내 */}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="size-3.5" />
            同じ投稿への重複通報はできません
          </p>
        </form>
      </SheetContent>
    </Sheet>
  )
}
