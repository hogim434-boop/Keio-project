'use client'

/**
 * useNotifications — 알림 데이터 관리 훅
 *
 * - 마운트 시 미읽음 카운트만 가볍게 fetch (목록은 패널 열 때 refresh()로)
 * - markRead / markAllRead: 낙관적 업데이트 후 PATCH, 실패 시 롤백
 * - window focus 이벤트: refreshUnreadCount() 자동 호출
 */

import { useState, useCallback, useEffect } from 'react'
import type { NotificationListItem } from '@/types/notification'

interface UseNotificationsReturn {
  items: NotificationListItem[]
  unreadCount: number
  loading: boolean
  error: string | null
  /** 목록 + 카운트 전부 재조회 (패널 열릴 때 호출) */
  refresh: () => Promise<void>
  /** 카운트만 가볍게 재조회 (마운트·포커스 시 호출) */
  refreshUnreadCount: () => Promise<void>
  /** 특정 알림 ID를 읽음 처리 (낙관적) */
  markRead: (ids: string[]) => Promise<void>
  /** 모든 알림 일괄 읽음 처리 (낙관적) */
  markAllRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [items, setItems] = useState<NotificationListItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ────────────────────────────────────────────────────
  // 목록 + 카운트 전체 fetch
  // ────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (!res.ok) {
        // 401(비로그인)은 조용히 무시
        if (res.status !== 401) setError('通知の読み込みに失敗しました')
        return
      }
      const json = await res.json()
      // { ok: true, data: { items, unreadCount } } 구조
      if (json.ok && json.data) {
        setItems(json.data.items ?? [])
        setUnreadCount(json.data.unreadCount ?? 0)
      }
    } catch {
      setError('通知の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // ────────────────────────────────────────────────────
  // 카운트만 가볍게 fetch (limit=1 로 최소 데이터)
  // ────────────────────────────────────────────────────
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1')
      if (!res.ok) return // 401 등은 조용히 무시
      const json = await res.json()
      if (json.ok && json.data) {
        setUnreadCount(json.data.unreadCount ?? 0)
      }
    } catch {
      // 카운트 갱신 실패는 무시 (UX 영향 최소화)
    }
  }, [])

  // ────────────────────────────────────────────────────
  // 특정 알림 읽음 처리 (낙관적 업데이트)
  // ────────────────────────────────────────────────────
  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return

      // 함수형 업데이터 패턴을 사용해 items/unreadCount를 의존성 배열에서 제거.
      // 롤백 스냅샷은 setItems 업데이터 내부에서 prev로 안전하게 캡처.
      // (React는 setState 배치 처리 시 순서를 보장하므로 snapshotItems은 항상 유효)
      let snapshotItems: NotificationListItem[] = []
      let reducedCount = 0

      setItems((prev) => {
        snapshotItems = prev
        reducedCount = ids.filter(
          (id) => prev.some((item) => item.id === id && !item.is_read),
        ).length
        return prev.map((item) =>
          ids.includes(item.id) ? { ...item, is_read: true } : item,
        )
      })
      setUnreadCount((prev) => Math.max(0, prev - reducedCount))

      // 2) 서버 PATCH
      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        if (!res.ok) throw new Error('PATCH failed')
      } catch {
        // 3) 실패 시 롤백
        setItems(snapshotItems)
        setUnreadCount(
          snapshotItems.filter((item) => !item.is_read).length,
        )
      }
    },
    [],
  )

  // ────────────────────────────────────────────────────
  // 전체 일괄 읽음 처리 (낙관적 업데이트)
  // ────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    // 함수형 업데이터 패턴으로 items/unreadCount 의존성 제거.
    // snapshotItems는 setItems 업데이터 내부에서 캡처.
    let snapshotItems: NotificationListItem[] = []

    // 1) 낙관적: 모두 is_read = true, unreadCount = 0
    setItems((prev) => {
      snapshotItems = prev
      return prev.map((item) => ({ ...item, is_read: true }))
    })
    setUnreadCount(0)

    // 2) 서버 PATCH
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: 'all' }),
      })
      if (!res.ok) throw new Error('PATCH failed')
    } catch {
      // 3) 실패 시 롤백
      setItems(snapshotItems)
      setUnreadCount(snapshotItems.filter((item) => !item.is_read).length)
    }
  }, [])

  // ────────────────────────────────────────────────────
  // 마운트 시 카운트만 초기 fetch
  // ────────────────────────────────────────────────────
  useEffect(() => {
    refreshUnreadCount()
  }, [refreshUnreadCount])

  // ────────────────────────────────────────────────────
  // 탭 포커스 복귀 시 카운트 자동 갱신
  // ────────────────────────────────────────────────────
  useEffect(() => {
    const onFocus = () => refreshUnreadCount()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshUnreadCount])

  return {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    refreshUnreadCount,
    markRead,
    markAllRead,
  }
}
