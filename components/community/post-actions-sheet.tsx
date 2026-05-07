'use client'

/**
 * 게시글 액션 바텀 시트 — iOS 표준 Action Sheet 패턴
 *
 * 기능:
 *  - 본인 글: [削除する] / [通報する] / [キャンセル]
 *  - 타인 글: [通報する] / [キャンセル]
 *  - 削除 → confirm 대화상자 → DELETE /api/posts/:id → toast + 홈 이동
 *  - 通報 → useReportSheet.open() 위임 후 자기 시트 즉시 닫힘
 *  - Framer Motion whileTap + springTap (prefers-reduced-motion 대응)
 *  - globals.css 자체 keyframes: sheet-slide-up / sheet-slide-down 사용
 *
 * app/(app)/layout.tsx 에 마운트 — 모든 (app) 라우트에서 호출 가능
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

import { usePostActionsSheet } from '@/lib/stores/post-actions-sheet-store'
import { useReportSheet } from '@/lib/stores/report-sheet-store'
import { useWriteSheet } from '@/lib/stores/write-sheet-store'
import { springTap } from '@/lib/motion-variants'
import type { CategorySlug } from '@/types/community'

/**
 * 게시글 액션 바텀 시트
 * app/(app)/layout.tsx 에 마운트 — 모든 (app) 라우트에서 openActions() 로 호출 가능
 */
export function PostActionsSheet() {
  const { isOpen, target, close } = usePostActionsSheet()
  const router = useRouter()

  // prefers-reduced-motion 접근성 가드
  const shouldReduce = useReducedMotion()

  // 삭제 진행 중 로컬 상태
  const [isDeleting, setIsDeleting] = useState(false)
  // 편집 데이터 로딩 중 로컬 상태
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  // WriteBottomSheet 편집 모드로 열기
  const openForEdit = useWriteSheet((s) => s.openForEdit)

  /**
   * 編集する 핸들러
   * GET /api/posts/:id 로 최신 데이터 조회 → WriteBottomSheet 편집 모드 열기
   * 액션 시트 자체는 fetch 후 닫음 (실패 시에도 닫음 — 토스트로 알림)
   */
  async function handleEdit() {
    if (!target) return
    if (isLoadingEdit) return
    setIsLoadingEdit(true)
    try {
      const res = await fetch(`/api/posts/${target.id}`, { method: 'GET' })
      if (res.status === 401) {
        close()
        router.replace('/login')
        return
      }
      const json = (await res.json()) as {
        ok: boolean
        data?: {
          post: {
            id: string
            title: string
            body: string
            is_anonymous: boolean
            category: { slug: string } | null
          }
        }
        error?: { message?: string }
      }
      if (!json.ok || !json.data) {
        toast.error('投稿の取得に失敗しました', { description: json.error?.message })
        return
      }
      const p = json.data.post
      close()
      openForEdit({
        id: p.id,
        title: p.title,
        body: p.body,
        categorySlug: (p.category?.slug ?? 'free') as CategorySlug,
        isAnonymous: p.is_anonymous,
      })
    } catch {
      toast.error('投稿の取得に失敗しました')
    } finally {
      setIsLoadingEdit(false)
    }
  }

  /**
   * 게시글 삭제 핸들러
   * confirm 대화상자 → DELETE /api/posts/:id → 성공 시 홈으로 이동
   */
  async function handleDelete() {
    if (!target) return
    if (!window.confirm('この投稿を削除しますか?')) return

    setIsDeleting(true)

    try {
      const res = await fetch(`/api/posts/${target.id}`, { method: 'DELETE' })

      // 미인증 → 로그인 페이지 이동
      if (res.status === 401) {
        close()
        router.replace('/login')
        return
      }

      const json = await res.json() as { ok: boolean; error?: { message?: string } }

      if (json.ok) {
        toast.success('投稿を削除しました')
        close()
        router.replace('/')
      } else {
        toast.error('削除に失敗しました')
      }
    } catch {
      // 네트워크 에러
      toast.error('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * 신고 핸들러
   * 자기 시트를 즉시 닫고 ReportBottomSheet 를 열어 위임
   * 두 시트가 동시에 열리지 않도록 순서 보장
   */
  function handleReport() {
    if (!target) return
    // 자기 시트 먼저 닫기
    close()
    // 신고 시트 열기
    useReportSheet.getState().open({ type: 'post', id: target.id, preview: target.preview })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => { if (!o) close() }}>
      {/*
        side='bottom': 하단에서 슬라이드 업
        h-auto p-0: 내용 높이에 맞게 자동 조절
        rounded-t-2xl: 상단 모서리 둥글게 (iOS 스타일)
        showCloseButton={false}: 자체 キャンセル 버튼 사용

        슬라이드 모션: globals.css 의 sheet-slide-up/down keyframes 직접 적용.
         - tw-animate-css 의존성 제거 후 shadcn 기본 slide-in-from-* 이 무효이므로 자체 keyframes 사용.
         - duration 0.8s · easing expo-out [0.22, 1, 0.36, 1] (글쓰기 시트와 동일)
         - data-[state=open|closed]: 는 Radix Dialog 가 부여하는 속성
      */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-auto p-0 rounded-t-2xl border-t will-change-transform data-[state=open]:animate-[sheet-slide-up_0.8s_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[sheet-slide-down_0.8s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* 접근성: sr-only 타이틀/설명 */}
        <SheetTitle className="sr-only">投稿メニュー</SheetTitle>
        <SheetDescription className="sr-only">
          この投稿に対する操作を選択します
        </SheetDescription>

        {/* iOS 스타일 grab handle — 시트임을 시각적으로 알리는 작은 막대 */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true" />
        </div>

        {/* 버튼 목록 — safe-area-inset-bottom 로 홈 인디케이터 여백 확보 */}
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-3">

          {/* 編集する — 본인 게시글일 때만 노출 */}
          {target?.isOwner && (
            <motion.button
              type="button"
              onClick={handleEdit}
              disabled={isLoadingEdit}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={springTap}
              aria-label="この投稿を編集"
              className="min-h-[60px] w-full rounded-2xl text-base font-semibold tracking-wide bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoadingEdit ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                '編集する'
              )}
            </motion.button>
          )}

          {/* 削除する — 본인 게시글일 때만 노출 */}
          {target?.isOwner && (
            <motion.button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={springTap}
              aria-label="この投稿を削除"
              className="min-h-[60px] w-full rounded-2xl text-base font-semibold tracking-wide text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                '削除する'
              )}
            </motion.button>
          )}

          {/* 通報する */}
          <motion.button
            type="button"
            onClick={handleReport}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={springTap}
            aria-label="この投稿を通報"
            className="min-h-[60px] w-full rounded-2xl text-base font-semibold tracking-wide bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center justify-center"
          >
            通報する
          </motion.button>

          {/* キャンセル — iOS 패턴: 작업 그룹과 시각적으로 분리하기 위해 추가 여백 */}
          <motion.button
            type="button"
            onClick={close}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={springTap}
            aria-label="キャンセル"
            className="!mt-5 min-h-[60px] w-full rounded-2xl text-base font-semibold tracking-wide bg-muted/50 hover:bg-muted/70 text-muted-foreground transition-colors flex items-center justify-center"
          >
            キャンセル
          </motion.button>

        </div>
      </SheetContent>
    </Sheet>
  )
}
