'use client'

/**
 * 알림 단건 아이템 컴포넌트
 *
 * - actor 익명 여부에 따라 표시명 결정
 * - notification type별 액션 문구 (일본어)
 * - 게시글 제목 / 댓글 발췌 서브텍스트
 * - 미읽음이면 배경 강조 + 우측 파란 점 표시 (펄스 애니메이션)
 * - 시간: date-fns formatDistanceToNowStrict + ja locale
 * - hover/tap 미세 인터랙션 (framer-motion)
 */

import { useMemo } from 'react'
import { User } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNowStrict } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { NotificationListItem } from '@/types/notification'

/** NotificationItem props */
interface NotificationItemProps {
  item: NotificationListItem
  /** 클릭 시 부모가 라우팅 + 읽음처리 수행 */
  onClick?: (item: NotificationListItem) => void
}

/**
 * actor 표시명 반환
 * - actor_is_anonymous true → 匿名のユーザー
 * - actor null → 不明なユーザー
 * - 그 외 → nickname 또는 名無しさん
 */
function getActorName(item: NotificationListItem): string {
  if (item.actor_is_anonymous) return '匿名のユーザー'
  if (!item.actor) return '不明なユーザー'
  return item.actor.nickname ?? '名無しさん'
}

/**
 * notification type별 액션 문구 반환
 */
function getActionText(item: NotificationListItem): string {
  const actor = getActorName(item)
  switch (item.type) {
    case 'comment':
      return `${actor}さんがあなたの投稿にコメントしました`
    case 'reply':
      return `${actor}さんがあなたのコメントに返信しました`
    case 'reaction_post':
      return `${actor}さんがあなたの投稿にいいねしました`
    case 'reaction_comment':
      return `${actor}さんがあなたのコメントにいいねしました`
    default:
      return `${actor}さんからの通知`
  }
}

export function NotificationItem({ item, onClick }: NotificationItemProps) {
  /**
   * 상대 시간 문자열 (일본어) — 예: 3分前, 2時間前
   * created_at이 바뀌지 않는 한 재계산하지 않도록 useMemo로 메모이제이션
   */
  const relativeTime = useMemo(
    () =>
      formatDistanceToNowStrict(new Date(item.created_at), {
        locale: ja,
        addSuffix: true,
      }),
    [item.created_at],
  )

  return (
    /*
     * motion.div: whileTap 으로 클릭 시 살짝 눌리는 피드백
     * scale: 0.98 — 거의 티 안 나지만 손가락으로 누르는 느낌을 줌
     * transition duration: 0.12초 — 마이크로인터랙션은 빠르게
     */
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(item)}
      onKeyDown={(e) => {
        // 키보드 접근성: Enter / Space 로 클릭 처리
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(item)
        }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer',
        'hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        /* 미읽음 배경 강조 */
        !item.is_read && 'bg-primary/5',
      )}
    >
      {/* 좌측: 아바타 + 리액션 타입일 때 👍 오버레이 */}
      <div className="relative shrink-0 mt-0.5">
        {/* 32×32 원형 아바타 (User 아이콘 fallback) */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <User className="h-4 w-4" />
        </div>

        {/* 리액션 타입: 우측 하단 👍 오버레이 */}
        {item.type.startsWith('reaction_') && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-background text-[9px] leading-none"
            aria-hidden="true"
          >
            👍
          </span>
        )}
      </div>

      {/* 중앙: 액션 문구 + 게시글/댓글 서브텍스트 */}
      <div className="min-w-0 flex-1">
        {/* 액션 문구 */}
        <p className="text-sm font-semibold leading-snug text-foreground">
          {getActionText(item)}
        </p>

        {/* 게시글 제목 서브텍스트 */}
        {item.post && (
          <p
            className={cn(
              'mt-0.5 line-clamp-1 text-xs',
              item.post.is_deleted
                ? 'italic text-muted-foreground/60'
                : 'text-muted-foreground',
            )}
          >
            {item.post.is_deleted ? '削除された投稿' : item.post.title}
          </p>
        )}

        {/* 댓글 발췌 서브텍스트 (comment_excerpt 있을 때만) */}
        {item.comment_excerpt && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground/70">
            {item.comment_excerpt}
          </p>
        )}
      </div>

      {/* 우측: 시간 + 미읽음 점 */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {/* 상대 시간 */}
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          {relativeTime}
        </span>

        {/* 미읽음 파란 점 (8×8) — 부드러운 펄스 애니메이션
         * scale [1 → 1.25 → 1]: 살짝 커졌다 돌아오는 심장박동 느낌
         * opacity [1 → 0.7 → 1]: 동시에 희미해졌다 다시 선명해짐
         * duration 1.8초, repeat Infinity: 읽지 않은 동안 계속 펄스
         */}
        {!item.is_read && (
          <motion.span
            className="h-2 w-2 rounded-full bg-primary"
            aria-label="未読"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>
    </motion.div>
  )
}
