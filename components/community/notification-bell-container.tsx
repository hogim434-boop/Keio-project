'use client'

/**
 * NotificationBellContainer — 알림 종 + 패널 통합 클라이언트 컨테이너
 *
 * useNotifications 훅으로 데이터를 관리하고,
 * NotificationBell + NotificationPanel을 결합해 헤더에 바로 삽입 가능한 형태로 제공.
 *
 * 동작:
 *  - 패널 열릴 때(onOpenChange(true)): refresh() 호출 → 최신 목록 fetch
 *  - 항목 클릭: 미읽음이면 markRead(), 삭제되지 않은 게시글이면 라우팅
 *  - 전체 읽음: markAllRead()
 *  - unreadCount 증가 감지 → shake 상태를 700ms 동안 true → 벨 흔들림 트리거
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationBell } from '@/components/community/notification-bell'
import { NotificationPanel } from '@/components/community/notification-panel'
import type { NotificationListItem } from '@/types/notification'

export function NotificationBellContainer() {
  const router = useRouter()
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } =
    useNotifications()

  // ── 벨 흔들림 로직 ──────────────────────────────────────────
  // 이전 unreadCount를 ref로 추적 (렌더링 트리거 없이 값 보존)
  const prevCountRef = useRef(unreadCount)
  // shake: true 동안 NotificationBell에 흔들림 애니메이션 전달
  const [shake, setShake] = useState(false)

  useEffect(() => {
    // 이전보다 카운트가 증가했을 때만 흔들림
    if (unreadCount > prevCountRef.current) {
      setShake(true)
      // 벨 흔들림 애니메이션(0.6초) + 여유(0.1초) = 700ms 후 false로 리셋
      const t = setTimeout(() => setShake(false), 700)
      prevCountRef.current = unreadCount
      return () => clearTimeout(t)
    }
    // 감소하거나 동일한 경우에도 ref 업데이트
    prevCountRef.current = unreadCount
  }, [unreadCount])
  // ────────────────────────────────────────────────────────────

  // 팝오버 열릴 때 최신 알림 목록 fetch
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) refresh()
    },
    [refresh],
  )

  // 알림 항목 클릭: 읽음 처리 + 페이지 이동
  const handleItemClick = useCallback(
    (item: NotificationListItem) => {
      // 미읽음이면 비동기로 읽음 처리 (await 안 함 — UI 블로킹 방지)
      if (!item.is_read) markRead([item.id])

      // 삭제되지 않은 게시글이 있으면 라우팅
      if (item.post && !item.post.is_deleted) {
        // 댓글 알림이면 해당 댓글로 anchor 이동
        const hash = item.comment_id ? `#comment-${item.comment_id}` : ''
        router.push(`/posts/${item.post.id}${hash}`)
      }
    },
    [markRead, router],
  )

  return (
    <NotificationBell
      unreadCount={unreadCount}
      shake={shake}
      onOpenChange={handleOpenChange}
    >
      <NotificationPanel
        items={items}
        unreadCount={unreadCount}
        loading={loading}
        error={error}
        onItemClick={handleItemClick}
        onMarkAllRead={markAllRead}
        onRetry={refresh}
      />
    </NotificationBell>
  )
}
