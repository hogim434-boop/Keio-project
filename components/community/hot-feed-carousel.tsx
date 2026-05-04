'use client'

/**
 * 핫 피드 캐러셀 컴포넌트 (F014)
 *
 * 최근 24시간 reaction_up TOP 3 게시글을 가로 드래그 캐러셀로 표시.
 * Framer Motion drag="x" + useMotionValue 로 현재 x 위치 추적.
 * 드래그 중 Link 클릭 차단 (10px 이상 이동 시).
 * 하단 점 인디케이터로 현재 슬라이드 위치 표시.
 */

import Link from 'next/link'
import { useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Heart } from 'lucide-react'
import type { PostListItem } from '@/lib/community/posts'
import { getCategoryEmoji } from '@/lib/community/categories'
import type { CategorySlug } from '@/types/community'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** 슬라이드 너비 (w-72 = 288px) */
const SLIDE_W = 288
/** 슬라이드 간격 (gap-4 = 16px) */
const SLIDE_GAP = 16

interface HotFeedCarouselProps {
  posts: PostListItem[]
}

export function HotFeedCarousel({ posts }: HotFeedCarouselProps) {
  // 현재 활성 슬라이드 인덱스
  const [activeIdx, setActiveIdx] = useState(0)

  // Framer Motion x 위치 추적 (렌더 사이클 외부에서 업데이트)
  const x = useMotionValue(0)

  // 드래그 이동 거리 추적 (링크 클릭 차단용)
  const dragOffsetRef = useRef(0)

  // 빈 배열 처리 — 아직 인기 게시글 없음 메시지 표시
  if (posts.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        まだ人気の投稿がありません
      </div>
    )
  }

  // 드래그 제약: 첫 슬라이드(right=0) ~ 마지막 슬라이드
  const leftConstraint = posts.length === 1 ? 0 : -((posts.length - 1) * (SLIDE_W + SLIDE_GAP))

  return (
    <div aria-label="人気の投稿">
      {/* 드래그 가능한 슬라이드 컨테이너 */}
      <div className="overflow-hidden">
        <motion.div
          drag="x"
          dragConstraints={{ left: leftConstraint, right: 0 }}
          dragElastic={0.15}
          dragSnapToOrigin={false}
          dragMomentum={false}
          style={{ x }}
          className="flex gap-4 px-4 cursor-grab active:cursor-grabbing"
          onDrag={(_, info) => {
            // 드래그 중 이동 거리 기록 (링크 클릭 차단용)
            dragOffsetRef.current = info.offset.x
          }}
          onDragEnd={(_, info) => {
            // 현재 x 위치 기반으로 활성 인덱스 계산
            const currentX = x.get()
            const rawIdx = Math.round(-currentX / (SLIDE_W + SLIDE_GAP))
            const clampedIdx = Math.max(0, Math.min(posts.length - 1, rawIdx))
            setActiveIdx(clampedIdx)

            // 드래그 오프셋 리셋
            dragOffsetRef.current = info.offset.x
          }}
        >
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/posts/${p.id}`}
              onClick={(e) => {
                // 드래그 이동 거리 10px 초과 시 링크 클릭 차단
                if (Math.abs(dragOffsetRef.current) > 10) {
                  e.preventDefault()
                }
              }}
              className="shrink-0"
            >
              <Card className="w-72 shrink-0 p-4 h-32 flex flex-col justify-between gap-2 select-none">
                {/* 상단: 카테고리 배지 */}
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                    {p.category?.slug
                      ? getCategoryEmoji(p.category.slug as CategorySlug)
                      : '📌'}{' '}
                    {p.category?.name ?? '—'}
                  </span>
                </div>

                {/* 중간: 게시글 제목 */}
                <h3 className="line-clamp-2 font-semibold text-sm leading-snug">
                  {p.title}
                </h3>

                {/* 하단: 추천 수 */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="size-3.5" />
                  <span>{p.reaction_up}</span>
                </div>
              </Card>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* 점 인디케이터 */}
      <div className="flex justify-center gap-1.5 mt-3" aria-hidden="true">
        {posts.map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-1.5 rounded-full transition-colors',
              activeIdx === i ? 'bg-foreground' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  )
}
