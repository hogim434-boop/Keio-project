'use client'

/// <reference types="react/canary" />
/**
 * 게시글 카드 컴포넌트 — 인라인 ❤️ 추천 / 🔖 북마크 포함
 *
 * 기능:
 *  - 카드 본문 클릭 → /posts/[id] 이동 (router.push + transitionTypes)
 *  - ❤️ / 🔖 클릭은 e.stopPropagation() 으로 navigate 차단
 *  - 낙관적 업데이트 후 /api/reactions, /api/bookmarks 호출
 *  - 401 → /login 리다이렉트, 실패 시 롤백 + sonner toast
 *  - Framer Motion whileTap scale 0.92 (prefers-reduced-motion 대응)
 *  - ARIA: role=button / aria-label / aria-pressed / tabIndex / focus-visible
 *  - 터치 영역 min-h-[44px] (WCAG 2.5.5)
 *  - View Transitions: 카드 → 상세 페이지 shared element morph
 *    - <ViewTransition name={`post-card-${id}`}> 로 카드 제목/본문 영역을 감쌈
 *    - 상세 페이지의 동일 name 과 자동 morph 연결
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ViewTransition } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { springTap } from '@/lib/motion-variants'
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { PostListItem } from '@/lib/community/posts'
import type { ReactionKind, CategorySlug } from '@/types/community'
import { getCategoryEmoji } from '@/lib/community/categories'
import { usePostActionsSheet } from '@/lib/stores/post-actions-sheet-store'
import { formatJstDate } from '@/lib/locale/date'
import { cn } from '@/lib/utils'
import { LikeParticles } from '@/components/community/like-particles'

/** PostCard 컴포넌트 props */
export interface PostCardProps {
  post: PostListItem
  /** 현재 로그인 유저의 초기 반응 상태 (SSR 에서 전달) */
  initialMyReaction?: ReactionKind | null
  /** 현재 로그인 유저의 초기 북마크 상태 (SSR 에서 전달) */
  initialMyBookmark?: boolean
  /** 현재 로그인 유저 ID — isOwner 판단에 사용 (null = 미인증) */
  currentUserId?: string | null
}

export function PostCard({
  post,
  initialMyReaction = null,
  initialMyBookmark = false,
  currentUserId = null,
}: PostCardProps) {
  const router = useRouter()
  /** 접근성: prefers-reduced-motion 감지 */
  const reduce = useReducedMotion()
  const openActions = usePostActionsSheet((s) => s.open)

  // 인라인 반응 상태 (낙관적 업데이트)
  const [myReaction, setMyReaction] = useState<ReactionKind | null>(initialMyReaction)
  const [reactionUp, setReactionUp] = useState<number>(post.reaction_up)
  const [reactionDown, setReactionDown] = useState<number>(post.reaction_down)
  const [bookmarked, setBookmarked] = useState<boolean>(initialMyBookmark)

  // 중복 클릭 방지 플래그
  const [isReacting, setIsReacting] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  /**
   * 파티클 발사 트리거 — null → 'up' 첫 좋아요 클릭 시에만 true
   * 600ms 후 자동으로 false 로 리셋되어 다음 클릭에서도 재발사 가능
   */
  const [showParticles, setShowParticles] = useState(false)

  /** ❤️ 추천 토글 핸들러 — 낙관적 업데이트 후 API 호출 */
  async function handleReaction(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isReacting) return

    const before = myReaction
    const next: ReactionKind | null = before === 'up' ? null : 'up'

    // 낙관적 카운터 업데이트
    setMyReaction(next)
    if (before === 'up' && next === null) {
      // 추천 취소
      setReactionUp((c) => Math.max(0, c - 1))
    } else if (before === 'down' && next === 'up') {
      // 비추천 → 추천 전환
      setReactionDown((c) => Math.max(0, c - 1))
      setReactionUp((c) => c + 1)
    } else if (before === null && next === 'up') {
      // 추천 추가
      setReactionUp((c) => c + 1)
      // ④ 파티클 발사: 처음으로 좋아요를 누른 순간에만
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 650)
    }

    setIsReacting(true)
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'post', targetId: post.id, kind: 'up' }),
      })
      const json = await res.json() as { ok: boolean; error?: { message?: string } }
      if (!json.ok) {
        // 미인증 → 로그인 페이지 이동
        if (res.status === 401) { router.replace('/login'); return }
        throw new Error(json.error?.message ?? 'reaction failed')
      }
    } catch {
      // 실패 시 롤백
      setMyReaction(before)
      setReactionUp(post.reaction_up)
      setReactionDown(post.reaction_down)
      toast.error('反応に失敗しました')
    } finally {
      setIsReacting(false)
    }
  }

  /** 🔖 북마크 토글 핸들러 — 낙관적 업데이트 후 API 호출 */
  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isBookmarking) return

    const before = bookmarked
    setBookmarked(!before)
    setIsBookmarking(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const json = await res.json() as { ok: boolean; data?: { bookmarked: boolean }; error?: { message?: string } }
      if (!json.ok) {
        // 미인증 → 로그인 페이지 이동
        if (res.status === 401) { router.replace('/login'); return }
        throw new Error(json.error?.message ?? 'bookmark failed')
      }
      // 서버 응답으로 최종 정합
      if (json.data !== undefined) {
        setBookmarked(json.data.bookmarked)
      }
    } catch {
      // 실패 시 롤백
      setBookmarked(before)
      toast.error('ブックマークに失敗しました')
    } finally {
      setIsBookmarking(false)
    }
  }

  /** ⋯ 메뉴 핸들러 — PostActionsSheet 열기 */
  function handleMenu(e: React.MouseEvent) {
    e.stopPropagation()
    openActions({
      id: post.id,
      isOwner: !!currentUserId && currentUserId === post.user_id,
      preview: post.title,
    })
  }

  /** 게시글 상세 페이지로 이동 — View Transition 트리거 포함 */
  function navigateToDetail() {
    // transitionTypes: ['nav-forward'] — 상세 페이지 진입 방향 태그
    // next.config.ts 의 viewTransition: true 가 활성화된 경우에만 동작
    // 미지원 브라우저에서는 일반 router.push 와 동일하게 fallback
    router.push(`/posts/${post.id}`, { transitionTypes: ['nav-forward'] })
  }

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={navigateToDetail}
      onKeyDown={(e) => {
        // 키보드 접근성: Enter / Space 로 상세 이동
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigateToDetail()
        }
      }}
      className="border rounded-lg p-4 transition-colors hover:bg-muted/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      // ── cardLift 효과 ──────────────────────────────────────────────
      // hover: y:-2px (살짝 떠오름) + scale:1.005 (미세 확대) + 그림자 강화
      // tap:   scale:0.985 (살짝 눌리는 물리적 피드백)
      // reduce-motion 시: 모든 motion 효과 비활성화 (접근성)
      // boxShadow 는 transform/opacity 가 아니지만 카드 lift 의도상 함께 적용
      // ──────────────────────────────────────────────────────────────
      whileHover={
        reduce
          ? undefined
          : {
              y: -2,
              scale: 1.005,
              boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)',
            }
      }
      whileTap={
        reduce
          ? undefined
          : {
              scale: 0.985,
              y: 0,
            }
      }
      // springTap (stiffness:500, damping:30, mass:0.6) 재사용
      // 좋아요 버튼의 springTap 과 동일한 물리 계수로 전체 일관성 유지
      // 단, PostCard 는 더 큰 요소이므로 stiffness:400, damping:28 로 소폭 완화
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
        // springTap 에서 mass 값 참조 (0.6)
        mass: (springTap as { mass: number }).mass,
      }}
    >
      {/* 카테고리 배지 + 작성자 정보 + ⋯ 메뉴 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
          {post.category && getCategoryEmoji(post.category.slug as CategorySlug)}{' '}
          {post.category?.name ?? '—'}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {post.author?.nickname ?? '匿名'} ·{' '}
          {formatJstDate(post.created_at)}
        </span>
        <button
          type="button"
          onClick={handleMenu}
          aria-label="メニュー"
          className="ml-auto p-1.5 rounded-md hover:bg-muted text-muted-foreground"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/*
       * View Transitions shared element — 카드 제목+본문 영역
       * name: `post-content-${post.id}` — 상세 페이지와 동일한 name 으로 morph 연결
       * share="post-morph" — globals.css 의 ::view-transition-image-pair(.post-morph) 로
       *   400ms blur-via 애니메이션 적용
       * default="none" — 관련 없는 전환(다른 카드 클릭, 탭 전환 등)에서는 애니메이션 없음
       */}
      <ViewTransition name={`post-content-${post.id}`} share="post-morph" default="none">
        <div>
          {/* 제목 (1줄 클램프) */}
          <h3 className="font-semibold mb-1 line-clamp-1">{post.title}</h3>

          {/* 본문 미리보기 (2줄 클램프) */}
          <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
        </div>
      </ViewTransition>

      {/* 인라인 액션 row: 추천 / 댓글 수 / 북마크 */}
      <div className="flex items-center gap-1 mt-3">
        {/* 추천 버튼 — 4단계 choreography */}
        {/* relative: LikeParticles 의 absolute 기준점 */}
        <motion.button
          type="button"
          onClick={handleReaction}
          disabled={isReacting}
          whileTap={reduce ? {} : { scale: 0.92 }}
          aria-label="推薦する"
          aria-pressed={myReaction === 'up'}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full text-xs transition-colors disabled:opacity-50',
            myReaction === 'up'
              ? 'text-red-500 bg-red-50'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {/* ④ 파티클: trigger=true 일 때 흩날림 (null→'up' 첫 클릭만) */}
          <LikeParticles trigger={showParticles} />

          {/* ② 하트 pop: key 전환으로 컴포넌트가 remount → animate 재실행
               liked/unliked 두 상태 각각 별도 motion.span으로 처리 */}
          <motion.span
            key={myReaction === 'up' ? 'liked' : 'unliked'}
            animate={
              reduce
                ? undefined
                : myReaction === 'up'
                  ? { scale: [1, 1.45, 1] }
                  : { scale: 1 }
            }
            transition={{
              duration: 0.35,
              // back-out 스프링 — 1.45x 오버슈팅 후 1x 로 안착
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="flex items-center"
          >
            {/* ① 색 전환: transition-colors 150ms (CSS) */}
            <Heart
              className={cn(
                'size-4 transition-colors duration-150',
                myReaction === 'up' && 'fill-current',
              )}
            />
          </motion.span>

          {/* ③ 숫자 ticker: reactionUp 바뀔 때마다 옛 숫자 fade-up out → 새 숫자 fade-down in */}
          <span className="relative inline-block min-w-[1ch] tabular-nums overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={reactionUp}
                initial={reduce ? {} : { y: 8, opacity: 0 }}
                animate={reduce ? {} : { y: 0, opacity: 1 }}
                exit={reduce ? {} : { y: -8, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block"
              >
                {reactionUp}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.button>

        {/* 댓글 수 (클릭 불필요 — 카드 전체 클릭으로 상세 이동) */}
        <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground">
          <MessageCircle className="size-4" />
          {post.comment_count}
        </div>

        {/* 북마크 버튼 — 오른쪽 정렬 */}
        <motion.button
          type="button"
          onClick={handleBookmark}
          disabled={isBookmarking}
          whileTap={reduce ? {} : { scale: 0.92 }}
          aria-label="ブックマーク"
          aria-pressed={bookmarked}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full text-xs transition-colors ml-auto disabled:opacity-50',
            bookmarked
              ? 'text-amber-500 bg-amber-50'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          <Bookmark className={cn('size-4', bookmarked && 'fill-current')} />
        </motion.button>
      </div>
    </motion.article>
  )
}
