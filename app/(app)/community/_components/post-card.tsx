'use client'

// 자유게시판 게시글 카드 컴포넌트
import Link from 'next/link'
import { Heart, MessageSquare } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { listItem } from '@/lib/motion-variants'

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
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

  return (
    /*
     * 외부 motion.div: listContainer의 stagger 애니메이션 상속
     * 게시글 목록에서 카드들이 순차적으로 등장하는 효과
     */
    <motion.div variants={shouldReduce ? {} : listItem}>
      {/*
       * Link로 클릭 탐색 유지 — motion.div 안에 위치
       * block으로 전체 영역 클릭 가능
       */}
      <Link href={`/community/${id}`} className="block group">
        {/*
         * 내부 motion.div: hover/tap 인터랙션 전담
         * whileHover: y:-2 (살짝 뜨는 효과) + 그림자 + 테두리 색 변경
         * OKLCH 직접값 — Framer Motion은 CSS 변수 보간 불가
         */}
        <motion.div
          whileHover={
            shouldReduce
              ? {}
              : {
                  y: -2,
                  boxShadow: '0 4px 20px oklch(0 0 0 / 0.08)',
                  borderColor: 'oklch(0.708 0 0)',
                }
          }
          whileTap={shouldReduce ? {} : { scale: 0.985 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-border bg-card p-4 space-y-2"
        >
          {/* 게시글 제목 — font-semibold로 가독성 향상 */}
          <p className="font-semibold leading-snug line-clamp-1">{title}</p>

          {/* 본문 미리보기 — /80 투명도 제거로 가독성 향상 */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {preview}
          </p>

          {/* 하단 메타 정보 - 작성자 · 날짜 / 좋아요 · 댓글 수 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">익명 · {createdAt}</span>
            {/* text-foreground/60으로 아이콘 시인성 개선 */}
            <div className="flex items-center gap-3 text-xs text-foreground/60">
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
        </motion.div>
      </Link>
    </motion.div>
  )
}
