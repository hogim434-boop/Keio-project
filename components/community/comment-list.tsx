'use client'

/**
 * 댓글 목록 + 1단계 대댓글 트리 렌더러
 *
 * 구조:
 *  - 최상위 댓글 → replies 배열 (1단계만, lib/community/post-detail buildCommentTree 처리)
 *  - 대댓글은 ml-6 border-l 로 시각적 중첩 표현
 *  - 본인 댓글에 ⋯ 드롭다운(削除) 표시
 *  - 削除 후 router.refresh() 로 Server Component 재조회
 */

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import type { CommentNode } from '@/lib/community/post-detail'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatJstDateTime } from '@/lib/locale/date'
import { cn } from '@/lib/utils'

export interface CommentListProps {
  comments: CommentNode[]
  currentUserId: string | null
  onReply: (info: { id: string; preview: string }) => void
}

// ----------------------------------------------------------------
// 내부 CommentItem 컴포넌트 props
// ----------------------------------------------------------------
interface CommentItemProps {
  c: CommentNode
  canReply: boolean
  currentUserId: string | null
  onReply: (info: { id: string; preview: string }) => void
}

/**
 * 단일 댓글 카드
 * - 익명 여부: c.is_anonymous ? '匿名' : nickname
 * - 시간: ja-JP locale short 포맷
 * - 본인 댓글 → ⋯ 드롭다운 → 削除
 */
function CommentItem({ c, canReply, currentUserId, onReply }: CommentItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // 작성자 표시명
  const displayName = c.is_anonymous ? '匿名' : (c.author?.nickname ?? '匿名')

  // 작성 시간 (JST 고정 — 해외 접속자도 일본 기준)
  const createdAt = formatJstDateTime(c.created_at)

  // 본인 댓글 여부
  const isOwner = currentUserId !== null && currentUserId === c.user_id

  /**
   * 댓글 삭제 핸들러
   * confirm → DELETE /api/comments/:id → router.refresh()
   */
  const handleDelete = async () => {
    if (!window.confirm('このコメントを削除しますか?')) return
    if (isDeleting) return

    setIsDeleting(true)

    try {
      const res = await fetch(`/api/comments/${c.id}`, { method: 'DELETE' })

      if (res.status === 401) {
        router.replace('/login')
        return
      }

      const json = await res.json()
      if (json.ok) {
        toast.success('コメントを削除しました')
        router.refresh()
      } else {
        // 진단용 — dbCode / details / hint 까지 콘솔에 출력
        console.error('[comment delete]', { status: res.status, ...json })
        toast.error('コメントの削除に失敗しました', {
          description: json.error?.details ?? json.error?.message,
        })
      }
    } catch (e) {
      console.error('[comment delete] network', e)
      toast.error('コメントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="space-y-1"
      role="article"
      aria-label={`${displayName}のコメント`}
    >
      {/* 헤더: 작성자 + 시간 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{displayName}</span>
        <span>·</span>
        <time dateTime={c.created_at}>{createdAt}</time>
      </div>

      {/* 본문 */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>

      {/* 액션 행: 返信 + ⋯ */}
      <div className="flex items-center gap-2">
        {/* 返信 버튼 (최상위 댓글만) */}
        {canReply && (
          <button
            type="button"
            onClick={() =>
              onReply({ id: c.id, preview: c.body.slice(0, 30) })
            }
            className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px] px-1 rounded"
            aria-label="返信する"
          >
            返信
          </button>
        )}

        {/* 본인 댓글 → ⋯ 드롭다운 */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="コメントのオプション"
                disabled={isDeleting}
                className={cn(
                  'min-h-[32px] px-1 rounded text-muted-foreground hover:text-foreground transition-colors',
                  isDeleting && 'opacity-50',
                )}
              >
                {isDeleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MoreHorizontal className="size-3.5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-500 focus:text-red-500"
              >
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// CommentList 메인 컴포넌트
// ----------------------------------------------------------------

export function CommentList({
  comments,
  currentUserId,
  onReply,
}: CommentListProps) {
  // 빈 댓글 상태
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        まだコメントがありません
      </div>
    )
  }

  return (
    <div id="comments" className="space-y-4">
      {comments.map((top) => (
        <div key={top.id} className="space-y-3">
          {/* 최상위 댓글 */}
          <CommentItem
            c={top}
            canReply
            currentUserId={currentUserId}
            onReply={onReply}
          />

          {/* 1단계 대댓글 — ml-6 border-l 들여쓰기 */}
          {top.replies && top.replies.length > 0 && (
            <div className="ml-6 border-l pl-4 space-y-3">
              {top.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  c={r}
                  canReply={false}
                  currentUserId={currentUserId}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
