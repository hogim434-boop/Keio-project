/**
 * 게시글 상세 페이지 — Server Component
 *
 * Next.js 16: params 가 Promise 로 전달됨 (await 필수).
 * fetchPostWithComments 로 게시글 + 댓글 트리 + 내 반응/북마크 일괄 조회.
 * null 반환 시 notFound() — Next.js 내장 404 처리.
 *
 * 레이아웃:
 *  - sticky 헤더 (← 戻る)
 *  - article: 카테고리 배지 + 제목 + 작성자/시간 + 본문
 *  - PostDetailActions: 반응/북마크/삭제 Client 컴포넌트
 *  - PostDetailThread: 댓글 목록 + 폼 Client 래퍼
 *  - 하단 spacer: fixed 댓글 폼 공간 확보
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchPostWithComments } from '@/lib/community/post-detail'
import { getCategoryEmoji } from '@/lib/community/categories'
import type { CategorySlug } from '@/types/community'
import { PostDetailActions } from '@/components/community/post-detail-actions'
import { PostDetailThread } from '@/components/community/post-detail-thread'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params Promise await
  const { id } = await params

  const supabase = await createClient()
  const result = await fetchPostWithComments(supabase, id)

  // 게시글 없음 → 404
  if (!result) notFound()

  // 현재 로그인 사용자 ID 조회
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  const { post, comments, myReaction, myBookmark } = result

  return (
    <div>
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-2 h-14 flex items-center">
        <Link
          href="/"
          aria-label="戻る"
          className="p-2 rounded-md hover:bg-muted transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
      </header>

      {/* 게시글 본문 영역 */}
      <article className="px-4 py-4 space-y-3 border-b">
        {/* 카테고리 배지 + 작성자/시간 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
            {post.category &&
              getCategoryEmoji(post.category.slug as CategorySlug)}{' '}
            {post.category?.name ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground">
            {post.author?.nickname ?? '匿名'} ·{' '}
            {new Date(post.created_at).toLocaleString('ja-JP', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* 제목 */}
        <h1 className="text-xl font-bold">{post.title}</h1>

        {/* 본문 — whitespace-pre-wrap 으로 개행 보존 */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {post.body}
        </p>
      </article>

      {/* 액션 바: ❤ 좋아요 / 👎 싫어요 / 💬 댓글 / 🔖 북마크 / 🗑 삭제(본인) / ⋯ 더보기 */}
      <PostDetailActions
        postId={post.id}
        ownerUserId={post.user_id}
        currentUserId={currentUserId}
        reactionUp={post.reaction_up}
        reactionDown={post.reaction_down}
        commentCount={post.comment_count}
        initialMyReaction={myReaction}
        initialMyBookmark={myBookmark}
      />

      {/* 댓글 섹션 */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          コメント ({post.comment_count})
        </h2>
        <PostDetailThread
          comments={comments}
          postId={post.id}
          currentUserId={currentUserId}
        />
      </section>

      {/* 하단 fixed 댓글 폼 공간 확보 (약 128px) */}
      <div className="h-32" aria-hidden />
    </div>
  )
}
