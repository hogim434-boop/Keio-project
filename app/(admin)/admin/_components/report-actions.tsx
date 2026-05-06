'use client'

/**
 * 어드민 신고 처리 액션 버튼 — 削除 / 棄却
 *
 * '削除' → PATCH /api/admin/reports/[id] { action: 'delete' }
 *   · 대상 게시글/댓글 soft-delete + 같은 target 의 pending 신고 전체 processed 처리
 * '棄却' → PATCH /api/admin/reports/[id] { action: 'dismiss' }
 *   · 같은 target 의 pending 신고 전체 dismissed 처리 (콘텐츠 유지)
 *
 * AlertDialog 로 이중 확인 후 실행.
 * useTransition 으로 pending 상태 관리 → 버튼/다이얼로그 disabled 처리.
 * 완료 후 router.refresh() 로 SSR 재실행 (신고 큐 갱신).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/** 현재 열린 다이얼로그의 액션 타입 (null = 닫힘) */
type Action = 'delete' | 'dismiss' | null

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState<Action>(null)
  const [pending, startTransition] = useTransition()

  /**
   * API PATCH 호출 + 토스트 + 큐 갱신
   * @param action 'delete' | 'dismiss'
   */
  function handle(action: 'delete' | 'dismiss') {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })
        const json = (await res.json()) as { ok: boolean; error?: { message?: string } }
        if (!json.ok) {
          toast.error(json.error?.message ?? '処理に失敗しました')
          return
        }
        toast.success(action === 'delete' ? '削除しました' : '棄却しました')
        setOpen(null)
        router.refresh()
      } catch {
        toast.error('ネットワークエラー')
      }
    })
  }

  return (
    <>
      {/* 액션 버튼 그룹 */}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen('delete')}
          disabled={pending}
        >
          削除
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen('dismiss')}
          disabled={pending}
        >
          棄却
        </Button>
      </div>

      {/* 확인 다이얼로그 — 削除 / 棄却 공유 */}
      <AlertDialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {open === 'delete' ? 'この通報を削除しますか?' : 'この通報を棄却しますか?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {open === 'delete'
                ? '対象の投稿/コメントが非表示になり、同じ対象に対する未処理の通報がすべて処理済みになります。'
                : 'この対象に対する未処理の通報がすべて棄却に変更されます。投稿/コメントは表示されたままです。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault()
                if (open) handle(open)
              }}
              className={
                open === 'delete'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {pending && <Loader2 className="size-4 animate-spin mr-2" />}
              {open === 'delete' ? '削除する' : '棄却する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
