'use client'

/**
 * PostFeed — 무한 스크롤 + 인라인 반응 카드 리스트 (F004)
 *
 * SSR 의 첫 페이지(initial)를 props 로 받아 시작하고, 마지막 카드 200px 전
 * IntersectionObserver 로 다음 페이지(/api/posts?cursor=...) 를 fetch.
 * AbortController 로 진행 중 fetch 가 race 되면 abort.
 *
 * 카테고리/정렬 변경은 부모(page.tsx)에서 key prop 으로 unmount/remount
 * 처리하여 자동 reset.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PostCard } from './post-card'
import type { PostListItem, FetchPostsResult } from '@/lib/community/posts'

export interface PostFeedProps {
  initial: FetchPostsResult
  sort: 'latest' | 'popular'
  categorySlug?: string
  search?: string
  /** 현재 로그인 유저 ID — PostCard 의 isOwner 판단에 전달 (null = 미인증) */
  currentUserId?: string | null
}

export function PostFeed({ initial, sort, categorySlug, search, currentUserId }: PostFeedProps) {
  const router = useRouter()
  const [items, setItems] = useState<PostListItem[]>(initial.items)
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initial.nextCursor !== null)
  const [isLoading, setIsLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchMore() {
    if (!cursor || isLoading || !hasMore) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setIsLoading(true)

    try {
      const params = new URLSearchParams({ sort, cursor })
      if (categorySlug) params.set('categorySlug', categorySlug)
      if (search) params.set('q', search)

      const res = await fetch(`/api/posts?${params.toString()}`, { signal: ctrl.signal })
      const json = await res.json()

      if (!json.ok) {
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        throw new Error(json.error?.message ?? 'fetch failed')
      }

      setItems((prev) => [...prev, ...json.data.items])
      setCursor(json.data.nextCursor)
      setHasMore(json.data.nextCursor !== null)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      toast.error('投稿の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // sentinel 200px 전 가시 시 fetchMore
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchMore()
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, cursor])

  // unmount 시 진행 중 fetch abort
  useEffect(() => () => abortRef.current?.abort(), [])

  // 빈 상태 — 검색 모드와 일반 모드 카피 분기
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {search
          ? '該当する投稿が見つかりません — キーワードを変えて再検索'
          : 'まだ投稿がありません — 右下のボタンから最初の投稿を作成しましょう'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <PostCard key={p.id} post={p} currentUserId={currentUserId} />
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="py-6 flex justify-center">
          {isLoading && (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="読み込み中" />
          )}
        </div>
      )}
    </div>
  )
}
