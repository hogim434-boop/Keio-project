// 게시글 상세 페이지 - Server Component (async)
import { notFound } from 'next/navigation'
import { Heart, MessageSquare } from 'lucide-react'
import { getPostById, getCommentsByPostId } from '@/lib/dummy-community'

type Props = {
  params: Promise<{ id: string }>
}

export default async function CommunityPostPage({ params }: Props) {
  // Next.js 16 방식: params는 Promise로 전달됨
  const { id } = await params

  // 게시글 조회 - 존재하지 않으면 404
  const post = getPostById(id)
  if (!post) notFound()

  // 해당 게시글의 댓글 목록 조회
  const comments = getCommentsByPostId(id)

  return (
    <div className="mx-auto max-w-[768px] px-4 py-5 space-y-6 pb-24">

      {/* 게시글 헤더 - 제목 + 작성자 정보 */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold leading-snug">{post.title}</h1>
        <p className="text-xs text-muted-foreground">익명 · {post.createdAt}</p>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 게시글 본문 - 줄바꿈 보존 */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

      {/* 좋아요 수 + 댓글 수 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart size={13} />
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={13} />
          {post.commentCount}
        </span>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 댓글 섹션 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          댓글{' '}
          <span className="text-muted-foreground font-normal">
            ({comments.length})
          </span>
        </h2>

        {comments.length === 0 ? (
          /* 댓글 빈 상태 */
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">아직 댓글이 없습니다</p>
          </div>
        ) : (
          /* 댓글 목록 */
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-border bg-card p-4 space-y-1.5"
              >
                {/* 댓글 작성자 + 날짜 */}
                <p className="text-xs text-muted-foreground">
                  익명 · {comment.createdAt}
                </p>
                {/* 댓글 본문 */}
                <p className="text-sm leading-relaxed">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
