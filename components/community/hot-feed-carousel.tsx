'use client'

/**
 * 핫 피드 캐러셀 컴포넌트 (F014)
 *
 * 최근 7일 reaction_up TOP 3 게시글을 가로 CSS scroll-snap 캐러셀로 표시.
 * overflow-x-auto + snap-x snap-mandatory 로 네이티브 스크롤 snap 적용.
 * IntersectionObserver 로 현재 가장 많이 보이는 카드를 activeIdx 로 추적.
 * 하단 점 인디케이터로 현재 슬라이드 위치 표시.
 */

import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import type { PostListItem } from '@/lib/community/posts'
import { getCategoryEmoji } from '@/lib/community/categories'
import type { CategorySlug, ReactionKind } from '@/types/community'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HotFeedCarouselProps {
  posts: PostListItem[]
  /** 현재 로그인 사용자의 게시글별 반응 맵 (postId → 'up' | 'down') — 좋아요한 카드의 ❤️를 채우기 위해 사용 */
  myReactions?: Record<string, ReactionKind>
}

export function HotFeedCarousel({ posts, myReactions = {} }: HotFeedCarouselProps) {
  // 현재 활성 슬라이드 인덱스
  const [activeIdx, setActiveIdx] = useState(0)

  // 스크롤 컨테이너 ref
  const scrollerRef = useRef<HTMLDivElement>(null)

  // 각 카드(Link) 요소 ref 배열
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])

  // IntersectionObserver 로 스크롤 위치에 따른 활성 인덱스 계산
  useEffect(() => {
    if (!scrollerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        // intersectionRatio 가 가장 높은(가장 많이 보이는) 항목을 활성으로 지정
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const idx = cardRefs.current.indexOf(visible.target as HTMLAnchorElement)
        if (idx >= 0) setActiveIdx(idx)
      },
      { root: scrollerRef.current, threshold: [0.5, 0.75, 1] },
    )

    cardRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [posts.length])

  // 빈 배열 처리 — 아직 인기 게시글 없음 메시지 표시
  if (posts.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        まだ人気の投稿がありません
      </div>
    )
  }

  return (
    <div aria-label="人気の投稿">
      {/* 네이티브 scroll-snap 컨테이너 */}
      {/* overflow-y-visible: Card 의 ring(테두리)이 상하에서 잘리지 않도록 함 */}
      <div
        ref={scrollerRef}
        className={cn(
          'flex gap-4 overflow-x-auto overflow-y-visible',
          'px-4 py-2 snap-x snap-mandatory scrollbar-none',
          'scroll-px-4 scroll-smooth',
          '[-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]',
        )}
      >
        {posts.map((p, i) => {
          // 현재 사용자가 이 게시글에 'up' 반응을 남겼는지
          const liked = myReactions[p.id] === 'up'
          return (
            <Link
              key={p.id}
              href={`/posts/${p.id}`}
              ref={(el) => {
                // 카드 ref 배열에 순서대로 저장
                cardRefs.current[i] = el
              }}
              className="shrink-0 snap-start"
            >
              <Card className="w-72 p-4 h-32 flex flex-col justify-between gap-2 select-none">
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

                {/* 하단: 추천 수 — 본인이 좋아요한 글은 빨간색 채움 */}
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    liked ? 'text-red-500' : 'text-muted-foreground',
                  )}
                >
                  <Heart className={cn('size-3.5', liked && 'fill-red-500')} />
                  <span>{p.reaction_up}</span>
                </div>
              </Card>
            </Link>
          )
        })}
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
