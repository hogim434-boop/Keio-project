'use client'

/**
 * 게시글 상세 액션 바 — ❤ 좋아요 / 👎 싫어요 / 💬 댓글 수 / 🔖 북마크 / ⋯ 더보기
 *
 * 낙관적(Optimistic) UI 업데이트:
 *  - 좋아요/싫어요 토글 시 즉시 카운터 반영 후 API 호출
 *  - 실패 시 롤백 + 일본어 토스트 에러
 * Framer Motion: 탭 시 0.92 scale 애니메이션 (접근성: prefers-reduced-motion 존중)
 * ⋯ 클릭 → PostActionsSheet 열림 (削除/通報 통합)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Heart,
  ThumbsDown,
  Bookmark,
  MoreHorizontal,
  Loader2,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ReactionKind } from '@/types/community'
import { cn } from '@/lib/utils'
import { usePostActionsSheet } from '@/lib/stores/post-actions-sheet-store'
import { LikeParticles } from '@/components/community/like-particles'

export interface PostDetailActionsProps {
  postId: string
  ownerUserId: string
  currentUserId: string | null
  reactionUp: number
  reactionDown: number
  commentCount: number
  initialMyReaction: ReactionKind | null
  initialMyBookmark: boolean
}

export function PostDetailActions({
  postId,
  ownerUserId,
  currentUserId,
  reactionUp: initialReactionUp,
  reactionDown: initialReactionDown,
  commentCount,
  initialMyReaction,
  initialMyBookmark,
}: PostDetailActionsProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()

  // 본인 게시글 여부
  const isOwner = currentUserId === ownerUserId

  // 낙관적 상태 — 반응(좋아요/싫어요)
  const [myReaction, setMyReaction] = useState<ReactionKind | null>(initialMyReaction)
  const [reactionUp, setReactionUp] = useState(initialReactionUp)
  const [reactionDown, setReactionDown] = useState(initialReactionDown)

  // 북마크 상태
  const [bookmarked, setBookmarked] = useState(initialMyBookmark)

  // 로딩 상태
  const [isReacting, setIsReacting] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  /**
   * 파티클 발사 트리거 — null → 'up' 첫 좋아요 클릭 시에만 true
   * 650ms 후 자동 false 리셋 (LikeParticles duration 600ms + 여유 50ms)
   */
  const [showParticles, setShowParticles] = useState(false)

  // 게시글 액션 시트 열기 핸들러
  const openActions = usePostActionsSheet((s) => s.open)

  /**
   * 반응(좋아요/싫어요) 토글 핸들러
   * 낙관적 업데이트 6케이스:
   *  null+up → up+1 / null+down → down+1
   *  up+null → up-1 / down+null → down-1
   *  up→down → up-1, down+1 / down→up → down-1, up+1
   */
  const handleReaction = async (kind: ReactionKind) => {
    if (isReacting) return

    // 다음 상태 계산
    const before = myReaction
    const next: ReactionKind | null = before === kind ? null : kind

    // 낙관적 카운터 보정
    const prevUp = reactionUp
    const prevDown = reactionDown
    const prevReaction = myReaction

    if (before === null && next === 'up') {
      setReactionUp((v) => v + 1)
      // ④ 파티클 발사: 처음으로 좋아요를 누른 순간에만
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 650)
    } else if (before === null && next === 'down') {
      setReactionDown((v) => v + 1)
    } else if (before === 'up' && next === null) {
      setReactionUp((v) => v - 1)
    } else if (before === 'down' && next === null) {
      setReactionDown((v) => v - 1)
    } else if (before === 'up' && next === 'down') {
      setReactionUp((v) => v - 1)
      setReactionDown((v) => v + 1)
    } else if (before === 'down' && next === 'up') {
      setReactionDown((v) => v - 1)
      setReactionUp((v) => v + 1)
    }

    setMyReaction(next)
    setIsReacting(true)

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'post', targetId: postId, kind }),
      })

      if (res.status === 401) {
        router.replace('/login')
        return
      }

      const json = await res.json()
      if (!json.ok) {
        // 롤백
        setMyReaction(prevReaction)
        setReactionUp(prevUp)
        setReactionDown(prevDown)
        toast.error('反応に失敗しました')
      }
    } catch {
      // 네트워크 에러 시 롤백
      setMyReaction(prevReaction)
      setReactionUp(prevUp)
      setReactionDown(prevDown)
      toast.error('反応に失敗しました')
    } finally {
      setIsReacting(false)
    }
  }

  /**
   * 북마크 토글 핸들러
   * 낙관적 토글 후 실패 시 롤백
   */
  const handleBookmark = async () => {
    if (isBookmarking) return

    const prev = bookmarked
    setBookmarked(!prev)
    setIsBookmarking(true)

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })

      if (res.status === 401) {
        setBookmarked(prev)
        router.replace('/login')
        return
      }

      const json = await res.json()
      if (!json.ok) {
        setBookmarked(prev)
        toast.error('ブックマークに失敗しました')
      } else {
        // 서버 응답 값으로 동기화
        setBookmarked(json.data.bookmarked)
      }
    } catch {
      setBookmarked(prev)
      toast.error('ブックマークに失敗しました')
    } finally {
      setIsBookmarking(false)
    }
  }

  /**
   * ⋯ 더보기 메뉴 — PostActionsSheet 열기
   * 本人 여부를 isOwner 로 전달해 삭제 버튼 노출 제어
   */
  const handleMenu = () => {
    openActions({ id: postId, isOwner })
  }

  // Framer Motion tap 애니메이션 (접근성 설정 존중)
  const tapScale = shouldReduceMotion ? {} : { scale: 0.92 }

  return (
    <div className="flex items-center gap-1 px-4 py-3 border-y bg-background">
      {/* 좌측 그룹: 좋아요 / 싫어요 / 댓글 수 */}
      <div className="flex items-center gap-1">
        {/* 좋아요 버튼 — 4단계 choreography */}
        {/* relative: LikeParticles 의 absolute 기준점 */}
        <motion.button
          whileTap={tapScale}
          onClick={() => handleReaction('up')}
          disabled={isReacting}
          aria-label={`いいね ${reactionUp}件`}
          aria-pressed={myReaction === 'up'}
          className={cn(
            'relative min-h-[44px] px-3 py-2 rounded-full text-xs flex items-center gap-1.5 transition-colors',
            myReaction === 'up'
              ? 'text-red-500 bg-red-50 dark:bg-red-950'
              : 'text-muted-foreground hover:bg-muted',
            isReacting && 'opacity-50',
          )}
        >
          {/* ④ 파티클: trigger=true 일 때 흩날림 (null→'up' 첫 클릭만) */}
          <LikeParticles trigger={showParticles} />

          {isReacting && myReaction === 'up' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            /* ② 하트 pop: key 전환으로 remount → animate 재실행 */
            <motion.span
              key={myReaction === 'up' ? 'liked' : 'unliked'}
              animate={
                shouldReduceMotion
                  ? undefined
                  : myReaction === 'up'
                    ? { scale: [1, 1.45, 1] }
                    : { scale: 1 }
              }
              transition={{
                duration: 0.35,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="flex items-center"
            >
              {/* ① 색 전환: transition-colors 150ms (CSS) */}
              <Heart
                className={cn(
                  'size-4 transition-colors duration-150',
                  myReaction === 'up' && 'fill-red-500',
                )}
              />
            </motion.span>
          )}

          {/* ③ 숫자 ticker: reactionUp 바뀔 때마다 슬롯처럼 스크롤 */}
          <span className="relative inline-block min-w-[1ch] tabular-nums overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={reactionUp}
                initial={shouldReduceMotion ? {} : { y: 8, opacity: 0 }}
                animate={shouldReduceMotion ? {} : { y: 0, opacity: 1 }}
                exit={shouldReduceMotion ? {} : { y: -8, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block"
              >
                {reactionUp}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.button>

        {/* 싫어요 버튼 */}
        <motion.button
          whileTap={tapScale}
          onClick={() => handleReaction('down')}
          disabled={isReacting}
          aria-label={`よくない ${reactionDown}件`}
          aria-pressed={myReaction === 'down'}
          className={cn(
            'min-h-[44px] px-3 py-2 rounded-full text-xs flex items-center gap-1.5 transition-colors',
            myReaction === 'down'
              ? 'text-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'text-muted-foreground hover:bg-muted',
            isReacting && 'opacity-50',
          )}
        >
          {isReacting && myReaction === 'down' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ThumbsDown
              className={cn(
                'size-4',
                myReaction === 'down' && 'fill-blue-500',
              )}
            />
          )}
          <span>{reactionDown}</span>
        </motion.button>

        {/* 댓글 수 (읽기 전용, 앵커 이동) */}
        <a
          href="#comments"
          aria-label={`コメント ${commentCount}件`}
          className="min-h-[44px] px-3 py-2 rounded-full text-xs flex items-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle className="size-4" />
          <span>{commentCount}</span>
        </a>
      </div>

      {/* 우측 그룹: 북마크 + ⋯ 더보기 */}
      <div className="ml-auto flex items-center gap-1">
        {/* 북마크 버튼 */}
        <motion.button
          whileTap={tapScale}
          onClick={handleBookmark}
          disabled={isBookmarking}
          aria-label="ブックマーク"
          aria-pressed={bookmarked}
          className={cn(
            'min-h-[44px] px-3 py-2 rounded-full text-xs flex items-center gap-1.5 transition-colors',
            bookmarked
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950'
              : 'text-muted-foreground hover:bg-muted',
            isBookmarking && 'opacity-50',
          )}
        >
          {isBookmarking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Bookmark
              className={cn('size-4', bookmarked && 'fill-amber-500')}
            />
          )}
        </motion.button>

        {/* ⋯ 더보기 메뉴 버튼 — PostActionsSheet 열기 */}
        <motion.button
          whileTap={tapScale}
          onClick={handleMenu}
          aria-label="メニューを開く"
          className="min-h-[44px] px-3 py-2 rounded-full text-xs flex items-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <MoreHorizontal className="size-4" />
        </motion.button>
      </div>
    </div>
  )
}
