/**
 * 探索ページ — Server Component (Task 017, F007 · F018)
 *
 * searchParams を await して q(검색어)·category 파라미터 파싱.
 * - q 있음 → latest 정렬 + limit 20 (검색 결과 모드)
 * - q 없음 → popular 정렬 + limit 10 (인기 투고 모드)
 *
 * 구성:
 *   探索 헤더 (sticky)
 *   ExploreSearchBar — Suspense 래핑 (useSearchParams 사용)
 *   CategoryIconRow  — Suspense 래핑 + 스켈레톤 폴백
 *   섹션 헤더        — 🔥 今週の人気投稿 / 「q」の検索結果 분기
 *   PostFeed         — key로 q·categorySlug·sort 변경 시 자동 reset
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { fetchPosts, fetchMyReactionsAndBookmarks } from '@/lib/community/posts'
import { CATEGORY_SLUG_VALUES } from '@/types/community'
import type { CategorySlug } from '@/types/community'
import { ExploreSearchBar } from '@/components/community/explore-search-bar'
import { CategoryIconRow } from '@/components/community/category-icon-row'
import { PostFeed } from '@/components/community/post-feed'
import { NotificationBellContainer } from '@/components/community/notification-bell-container'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  // Next.js 16 — searchParams 는 Promise 타입이므로 await 필수
  const sp = await searchParams
  const q = sp.q?.trim() || undefined
  const categorySlug =
    sp.category && (CATEGORY_SLUG_VALUES as readonly string[]).includes(sp.category)
      ? (sp.category as CategorySlug)
      : undefined

  const supabase = await createClient()

  // 현재 로그인 유저 — PostCard isOwner 판단에 사용
  const { data: { user } } = await supabase.auth.getUser()

  // 검색 모드: latest + 20건 / 인기 모드: popular + 10건
  const sort: 'latest' | 'popular' = q ? 'latest' : 'popular'
  const limit = q ? 20 : 10
  const list = await fetchPosts(supabase, { sort, search: q, categorySlug, limit })

  // 현재 사용자의 반응·북마크 일괄 조회 (비로그인이면 빈 결과)
  const { myReactions, myBookmarks } = await fetchMyReactionsAndBookmarks(
    supabase,
    list.items.map((p) => p.id),
  )

  return (
    <div>
      {/* 探索 고정 헤더 — 우측에 알림 종 */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold">探索</h1>
        <div className="ml-auto">
          <NotificationBellContainer />
        </div>
      </header>

      {/* 검색 입력바 — useSearchParams 사용으로 Suspense 필수 */}
      <Suspense fallback={<div className="h-[68px]" aria-hidden />}>
        <ExploreSearchBar />
      </Suspense>

      {/* 카테고리 아이콘 행 — URL ?category 동기화 (Task 013 구현) */}
      <Suspense
        fallback={
          <div className="flex gap-3 px-4 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-1.5 min-w-16">
                <div className="size-14 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-8 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        }
      >
        <CategoryIconRow />
      </Suspense>

      {/* 섹션 헤더 — 검색 모드 / 인기 모드 분기 */}
      <section className="px-4 pt-3 pb-1">
        {q ? (
          <h2 className="text-xs font-semibold text-muted-foreground">
            「{q}」の検索結果
          </h2>
        ) : (
          <h2 className="text-xs font-semibold text-muted-foreground">
            🔥 今週の人気投稿
          </h2>
        )}
      </section>

      {/* 게시글 피드 — key 변경으로 q·categorySlug·sort 바뀔 때 자동 reset */}
      <section className="px-4 pb-4">
        <PostFeed
          key={`${q ?? ''}-${categorySlug ?? 'all'}-${sort}`}
          initial={list}
          initialMyReactions={myReactions}
          initialMyBookmarks={myBookmarks}
          sort={sort}
          categorySlug={categorySlug}
          search={q}
          currentUserId={user?.id ?? null}
        />
      </section>
    </div>
  )
}
