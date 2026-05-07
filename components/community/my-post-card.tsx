'use client'

/**
 * 마이페이지 내 게시글 카드
 *
 * 게시글 제목·카테고리·날짜·추천수·댓글수 표시.
 * [削除] 버튼 클릭 → window.confirm → DELETE /api/posts/[id] → sonner toast → router.refresh().
 * 카드 클릭 → /posts/[id] 이동.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { PostListItem } from '@/lib/community/posts'
import { useWriteSheet } from '@/lib/stores/write-sheet-store'
import type { CategorySlug } from '@/types/community'

export interface MyPostCardProps {
  post: PostListItem
}

/** 마이페이지 내 게시글 카드 */
export function MyPostCard({ post }: MyPostCardProps) {
  const router = useRouter()
  const openForEdit = useWriteSheet((s) => s.openForEdit)
  const [isDeleting, setIsDeleting] = useState(false)

  /** 編集 버튼 클릭 — WriteBottomSheet 을 편집 모드로 열기 */
  function handleEdit(e: React.MouseEvent): void {
    e.preventDefault()
    e.stopPropagation()
    openForEdit({
      id: post.id,
      title: post.title,
      body: post.body,
      categorySlug: (post.category?.slug ?? 'free') as CategorySlug,
      isAnonymous: post.is_anonymous,
    })
  }

  /** 게시글 삭제 처리 — soft delete (is_deleted=true) */
  async function handleDelete(e: React.MouseEvent): Promise<void> {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('投稿を削除しますか?')) return
    if (isDeleting) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      const json = await res.json()
      if (json.ok) {
        toast.success('投稿を削除しました')
        router.refresh()
      } else {
        toast.error('投稿の削除に失敗しました', {
          description: json.error?.message,
        })
      }
    } catch {
      toast.error('投稿の削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

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
      {/* 카테고리 + 날짜 + 삭제 버튼 행 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
          {post.category?.name ?? '—'}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(post.created_at).toLocaleDateString('ja-JP')}
        </span>
        {/* 編集 / 削除 버튼 — 우측 정렬 */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8"
            aria-label="投稿を編集"
          >
            編集
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 text-destructive hover:text-destructive"
            aria-label="投稿を削除"
          >
            {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : '削除'}
          </Button>
        </div>
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
