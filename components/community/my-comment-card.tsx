'use client'

/**
 * 마이페이지 내 댓글 카드
 *
 * 댓글 내용(line-clamp-2) + 원본 게시글 링크(元の投稿) + 날짜 표시.
 * [削除] 버튼 클릭 → window.confirm → DELETE /api/comments/[id] → sonner toast → router.refresh().
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { MyComment } from '@/lib/community/my'

export interface MyCommentCardProps {
  comment: MyComment
}

/** 마이페이지 내 댓글 카드 */
export function MyCommentCard({ comment }: MyCommentCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  /** 댓글 삭제 처리 — RPC soft_delete_comment 호출 */
  async function handleDelete(e: React.MouseEvent): Promise<void> {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('このコメントを削除しますか?')) return
    if (isDeleting) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      const json = await res.json()
      if (json.ok) {
        toast.success('コメントを削除しました')
        router.refresh()
      } else {
        toast.error('コメントの削除に失敗しました', {
          description: json.error?.message,
        })
      }
    } catch {
      toast.error('コメントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article
      className="border rounded-lg p-4"
      aria-label={`コメント: ${comment.body.slice(0, 20)}`}
    >
      {/* 원본 게시글 링크 + 날짜 + 삭제 버튼 행 */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* 元の投稿 링크 — 원본 게시글로 이동 */}
        <Link
          href={`/posts/${comment.post_id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary underline underline-offset-2 hover:opacity-80 line-clamp-1 max-w-[180px]"
          aria-label={`元の投稿: ${comment.post_title ?? '元の投稿'}`}
        >
          元の投稿: {comment.post_title ?? '元の投稿'}
        </Link>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {new Date(comment.created_at).toLocaleDateString('ja-JP')}
        </span>
        {/* 削除 버튼 */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-8 text-destructive hover:text-destructive shrink-0"
          aria-label="コメントを削除"
        >
          {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : '削除'}
        </Button>
      </div>

      {/* 댓글 내용 (최대 2줄) */}
      <p className="text-sm line-clamp-2 text-foreground">{comment.body}</p>
    </article>
  )
}
