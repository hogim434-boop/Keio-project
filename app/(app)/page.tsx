/**
 * 게시판 홈 페이지 — Server Component
 *
 * 레이아웃 구성 (W1 와이어프레임 기준):
 *  1층: sticky 헤더 (掲示板)
 *  2층: 핫 피드 캐러셀 (HotFeedCarousel — 24h TOP 3)
 *  3층: 갤러리 아이콘 행 (CategoryIconRow — 全て + 9 카테고리)
 *  4층: sticky 정렬 토글 (SortToggle — 最新 / 人気)
 *  5층: 카드 피드 placeholder (Task 014 에서 PostCard + 무한 스크롤로 교체)
 *  6층: BottomTabBar + WriteFab + WriteBottomSheet (layout.tsx 처리)
 *
 * searchParams: Promise 타입 (Next.js 16 App Router)
 * useSearchParams() 사용 컴포넌트는 Suspense 로 래핑.
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { fetchHotPosts } from '@/lib/community/hot-feed'
import { fetchPosts } from '@/lib/community/posts'
import { CATEGORY_SLUG_VALUES } from '@/types/community'
import type { CategorySlug } from '@/types/community'
import { HotFeedCarousel } from '@/components/community/hot-feed-carousel'
import { CategoryIconRow } from '@/components/community/category-icon-row'
import { SortToggle } from '@/components/community/sort-toggle'
import { PostFeed } from '@/components/community/post-feed'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>
}) {
  // Next.js 16: searchParams는 Promise — await 필요
  const sp = await searchParams

  // 정렬 옵션 파싱 (기본값: latest)
  const sort: 'latest' | 'popular' = sp.sort === 'popular' ? 'popular' : 'latest'

  // 카테고리 슬러그 파싱 — 유효한 슬러그가 아니면 undefined (전체 보기)
  const categorySlug =
    sp.category && (CATEGORY_SLUG_VALUES as readonly string[]).includes(sp.category)
      ? (sp.category as CategorySlug)
      : undefined

  // Supabase 서버 클라이언트 생성
  const supabase = await createClient()

  // 현재 로그인 유저 — PostCard isOwner 판단에 사용
  const { data: { user } } = await supabase.auth.getUser()

  // 핫 피드 + 게시글 목록 병렬 fetch
  const [hot, list] = await Promise.all([
    fetchHotPosts(supabase),
    fetchPosts(supabase, { sort, categorySlug, limit: 20 }),
  ])

  return (
    <div>
      {/* 1층: sticky 헤더 */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold">掲示板</h1>
      </header>

      {/* 2층: 핫 피드 캐러셀 */}
      <section className="py-3 border-b">
        <h2 className="text-xs font-semibold text-muted-foreground px-4 mb-2">
          🔥 おすすめ
        </h2>
        <HotFeedCarousel posts={hot} />
      </section>

      {/* 3층: 갤러리 아이콘 행 — useSearchParams() 사용 → Suspense 필요 */}
      <section className="border-b">
        <Suspense
          fallback={
            // 카테고리 로딩 스켈레톤
            <div className="flex gap-3 px-4 py-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 flex flex-col items-center gap-1.5 min-w-16"
                >
                  <div className="size-14 rounded-full bg-muted animate-pulse" />
                  <div className="h-3 w-8 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          }
        >
          <CategoryIconRow />
        </Suspense>
      </section>

      {/* 4층: sticky 정렬 토글 — useSearchParams() 사용 → Suspense 필요 */}
      <Suspense
        fallback={
          // 정렬 토글 로딩 스켈레톤
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
            <div className="h-10 mx-4 my-2 rounded-full bg-muted animate-pulse" />
          </div>
        }
      >
        <SortToggle />
      </Suspense>

      {/* 5층: 카드 피드 (PostCard + IntersectionObserver 무한 스크롤) */}
      <section className="px-4 py-4">
        <PostFeed
          key={`${sort}-${categorySlug ?? 'all'}`}
          initial={list}
          sort={sort}
          categorySlug={categorySlug}
          currentUserId={user?.id ?? null}
        />
      </section>
    </div>
  )
}
