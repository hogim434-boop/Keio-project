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
 *
 * [애니메이션]
 * - 마운트 시 PostCard 들을 위에서부터 50ms 간격으로 순차 페이드인 (stagger entrance)
 * - 무한 스크롤로 추가된 카드는 stagger 없이 즉시 표시 (isInitialMount 플래그)
 * - useReducedMotion: true 면 모든 variants 비활성화
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion, useReducedMotion } from 'framer-motion'
import { PostCard } from './post-card'
import { listContainer, listItem } from '@/lib/motion-variants'
import type { PostListItem, FetchPostsResult } from '@/lib/community/posts'
import type { ReactionKind } from '@/types/community'

/**
 * 초기 마운트 stagger 컨테이너 variants
 * listContainer 의 staggerChildren(0.06s=60ms) 을 50ms 로 override
 * 일본 시장 톤: 한국(30-40ms) 보다 한 박자 여유있게
 */
const feedContainer = {
  hidden: listContainer.hidden,
  visible: {
    transition: {
      staggerChildren: 0.05, // 50ms — 요구 사양
      delayChildren: 0.05,
    },
  },
} as const

export interface PostFeedProps {
  initial: FetchPostsResult
  /** SSR 에서 전달된 사용자별 게시글 반응(up/down) 맵 — postId → kind */
  initialMyReactions?: Record<string, ReactionKind>
  /** SSR 에서 전달된 사용자별 북마크 게시글 ID 목록 */
  initialMyBookmarks?: string[]
  sort: 'latest' | 'popular'
  categorySlug?: string
  search?: string
  /** 현재 로그인 유저 ID — PostCard 의 isOwner 판단에 전달 (null = 미인증) */
  currentUserId?: string | null
}

export function PostFeed({
  initial,
  initialMyReactions = {},
  initialMyBookmarks = [],
  sort,
  categorySlug,
  search,
  currentUserId,
}: PostFeedProps) {
  const router = useRouter()

  /**
   * 접근성 가드 — prefers-reduced-motion: reduce 시 stagger 비활성화
   * ?? false: SSR 에서 null 반환 시 false 로 fallback
   */
  const shouldReduceMotion = useReducedMotion() ?? false

  /**
   * 초기 마운트 카드 수 — 렌더 중 읽어야 하므로 useState 로 관리
   * 이 값 미만의 인덱스만 listItem variants 적용 (stagger entrance)
   * 무한 스크롤로 추가된 카드는 variants 없이 즉시 표시
   * useState 초기값은 한 번만 계산되므로 mount 시 카드 수가 고정됨
   */
  const [initialCount] = useState<number>(initial.items.length)

  const [items, setItems] = useState<PostListItem[]>(initial.items)
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor)
  const [hasMore, setHasMore] = useState<boolean>(initial.nextCursor !== null)
  const [isLoading, setIsLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 사용자별 반응·북마크 — 무한 스크롤로 새 페이지 도달 시 머지
  const [myReactions, setMyReactions] = useState<Record<string, ReactionKind>>(initialMyReactions)
  const [myBookmarks, setMyBookmarks] = useState<Set<string>>(() => new Set(initialMyBookmarks))

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

      // 새 페이지의 사용자 반응·북마크를 기존 상태에 머지
      if (json.data.myReactions) {
        setMyReactions((prev) => ({ ...prev, ...json.data.myReactions }))
      }
      if (Array.isArray(json.data.myBookmarks)) {
        setMyBookmarks((prev) => {
          const next = new Set(prev)
          for (const id of json.data.myBookmarks as string[]) next.add(id)
          return next
        })
      }
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
    /*
     * stagger 컨테이너 — motion.div 로 교체
     * - shouldReduceMotion=true: initial/animate/variants 모두 undefined → 즉시 표시
     * - shouldReduceMotion=false: feedContainer variants 로 stagger 제어
     * className/key 등 기존 속성 유지
     */
    <motion.div
      className="space-y-3"
      variants={shouldReduceMotion ? undefined : feedContainer}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
    >
      {items.map((p, index) => {
        /*
         * 초기 마운트 카드 여부 판별
         * initialCountRef.current 미만 인덱스 = 첫 SSR 데이터 카드 → stagger 적용
         * 그 이상 인덱스 = 무한 스크롤로 추가된 카드 → variants 없이 즉시 표시
         */
        const isInitialCard = !shouldReduceMotion && index < initialCount

        return isInitialCard ? (
          /*
           * 초기 카드: motion.div + listItem variants
           * 부모(feedContainer)의 staggerChildren 이 각 자식의 등장 타이밍을 50ms 간격으로 제어
           */
          <motion.div key={p.id} variants={listItem}>
            <PostCard
              post={p}
              currentUserId={currentUserId}
              initialMyReaction={myReactions[p.id] ?? null}
              initialMyBookmark={myBookmarks.has(p.id)}
            />
          </motion.div>
        ) : (
          /*
           * 무한 스크롤 추가 카드: 일반 div — 즉시 표시, 시간 차 없음
           */
          <div key={p.id}>
            <PostCard
              post={p}
              currentUserId={currentUserId}
              initialMyReaction={myReactions[p.id] ?? null}
              initialMyBookmark={myBookmarks.has(p.id)}
            />
          </div>
        )
      })}
      {hasMore && (
        <div ref={sentinelRef} className="py-6 flex justify-center">
          {isLoading && (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="読み込み中" />
          )}
        </div>
      )}
    </motion.div>
  )
}
