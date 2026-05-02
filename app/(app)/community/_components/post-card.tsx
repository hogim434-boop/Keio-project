// 자유게시판 게시글 카드 컴포넌트
import Link from 'next/link'
import { Heart, MessageSquare } from 'lucide-react'

type PostCardProps = {
  id: string
  title: string
  preview: string
  likeCount: number
  commentCount: number
  createdAt: string
}

export function PostCard({
  id,
  title,
  preview,
  likeCount,
  commentCount,
  createdAt,
}: PostCardProps) {
  return (
    /* 게시글 카드 - 클릭 시 상세 페이지로 이동 */
    <Link href={`/community/${id}`} className="block group">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2 transition-all group-hover:bg-muted/30 group-hover:ring-1 ring-foreground/20">
        {/* 게시글 제목 */}
        <p className="font-medium leading-snug line-clamp-1">{title}</p>

        {/* 본문 미리보기 */}
        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
          {preview}
        </p>

        {/* 하단 메타 정보 - 작성자 · 날짜 / 좋아요 · 댓글 수 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">익명 · {createdAt}</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* 좋아요 수 */}
            <span className="flex items-center gap-1">
              <Heart size={13} />
              {likeCount}
            </span>
            {/* 댓글 수 */}
            <span className="flex items-center gap-1">
              <MessageSquare size={13} />
              {commentCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
