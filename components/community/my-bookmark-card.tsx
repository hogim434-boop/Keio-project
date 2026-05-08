'use client'

/**
 * 마이페이지 북마크 카드
 *
 * 북마크된 게시글 제목·카테고리·날짜 표시.
 * [🔖 解除] 버튼 → POST /api/bookmarks 토글 → sonner toast → router.refresh().
 * 카드 클릭 → /posts/[id] 이동.
 * bookmark.post 가 null (게시글 삭제됨) 이면 카드 자체 미렌더 (fragment 반환).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { MyBookmark } from '@/lib/community/my'
import { formatJstDate } from '@/lib/locale/date'

export interface MyBookmarkCardProps {
  bookmark: MyBookmark
}

/** 마이페이지 북마크 카드 */
export function MyBookmarkCard({ bookmark }: MyBookmarkCardProps) {
  const router = useRouter()
  const [isUnbookmarking, setIsUnbookmarking] = useState(false)

  // 게시글이 삭제된 경우 카드 미렌더
  if (!bookmark.post) return null

  /** 북마크 해제 처리 — POST /api/bookmarks 토글 */
  async function handleUnbookmark(e: React.MouseEvent): Promise<void> {
    e.preventDefault()
    e.stopPropagation()
    if (isUnbookmarking || !bookmark.post) return
    setIsUnbookmarking(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: bookmark.post.id }),
      })
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      const json = await res.json()
      if (json.ok) {
        toast.success('ブックマークを解除しました')
        router.refresh()
      } else {
        toast.error('ブックマーク解除に失敗しました')
      }
    } catch {
      toast.error('ブックマーク解除に失敗しました')
    } finally {
      setIsUnbookmarking(false)
    }
  }

  const post = bookmark.post

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/posts/${post.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/posts/${post.id}`)
        }
      }}
      className="border rounded-lg p-4 transition-colors hover:bg-muted/50 cursor-pointer"
      aria-label={post.title}
    >
      {/* 카테고리 + 날짜 + 해제 버튼 행 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
          {post.category?.name ?? '—'}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatJstDate(post.created_at)}
        </span>
        {/* 🔖 解除 버튼 */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnbookmark}
          disabled={isUnbookmarking}
          className="ml-auto h-8 text-muted-foreground hover:text-foreground"
          aria-label="ブックマークを解除"
        >
          {isUnbookmarking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            '🔖 解除'
          )}
        </Button>
      </div>

      {/* 게시글 제목 */}
      <h3 className="font-semibold mb-1 line-clamp-1">{post.title}</h3>

      {/* 추천수 + 댓글수 */}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span>❤ {post.reaction_up}</span>
        <span>💬 {post.comment_count}</span>
      </div>
    </article>
  )
}
