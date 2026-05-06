'use client'

/**
 * 알림 목록 패널 컴포넌트
 *
 * - 헤더: 「通知」 타이틀 + 미읽음 있을 때 「全て既読にする」 버튼
 * - 본문: loading / error / empty / 알림 목록 (div + overflow-y-auto)
 * - 폭: 360px (모바일은 100vw - 1rem)
 * - 항목 사이: divide-y divide-border/50
 * - 알림 목록: 컨테이너 단위 fade-in
 * - 빈 상태: 🌸 떠다니는 애니메이션 + 설명 텍스트 2줄
 */

import { motion } from 'framer-motion'
import { NotificationItem } from '@/components/community/notification-item'
import type { NotificationListItem } from '@/types/notification'

/** NotificationPanel props */
interface NotificationPanelProps {
  items: NotificationListItem[]
  unreadCount: number
  loading?: boolean
  error?: string | null
  onItemClick?: (item: NotificationListItem) => void
  onMarkAllRead?: () => void
  /** 에러 시 재시도 콜백 — 전달하면 「再試行」 버튼이 표시됨 */
  onRetry?: () => void
}

/**
 * 스켈레톤 한 줄 — loading 상태에서 3개 표시
 * index를 받아 CSS animation-delay로 시간차 적용
 */
function SkeletonRow({ index = 0 }: { index?: number }) {
  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 animate-pulse"
      // 100ms 간격으로 시간차 로딩 느낌
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 아바타 자리 */}
      <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
      {/* 텍스트 자리 */}
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-3/4 rounded-md bg-muted" />
        <div className="h-2.5 w-1/2 rounded-md bg-muted" />
      </div>
    </div>
  )
}

export function NotificationPanel({
  items,
  unreadCount,
  loading = false,
  error = null,
  onItemClick,
  onMarkAllRead,
  onRetry,
}: NotificationPanelProps) {
  return (
    <div className="rounded-lg border bg-popover text-popover-foreground shadow-md w-[min(360px,calc(100vw-1rem))]">
      {/* ── 패널 헤더 ── */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">通知</h3>

        {/* 미읽음이 있을 때만 「全て既読にする」 표시 */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => onMarkAllRead?.()}
            className="text-xs text-primary hover:underline"
          >
            全て既読にする
          </button>
        )}
      </div>

      {/*
       * ── 패널 본문 ──
       * iOS Safari 호환을 위한 핵심 속성들:
       *  - max-h: 작은 화면 보호 (viewport-6rem vs 480px 중 작은 값)
       *  - overflow-y-auto: 콘텐츠가 max-h 넘으면 스크롤
       *  - overscroll-contain: 끝까지 스크롤 시 페이지로 chain 안 됨
       *  - touch-pan-y: 「세로 스크롤만 받음」 명시 — iOS 터치 인식 안정화
       *  - WebkitOverflowScrolling: iOS 구버전 momentum scroll 호환
       */}
      <div
        className="max-h-[min(480px,calc(100vh-6rem))] overflow-y-auto overscroll-contain touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* 로딩 상태: 스켈레톤 3개 (각각 시간차 적용) */}
        {loading && (
          <div>
            <SkeletonRow index={0} />
            <SkeletonRow index={1} />
            <SkeletonRow index={2} />
          </div>
        )}

        {/* 에러 상태 */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm text-muted-foreground">読み込みに失敗しました</p>
            {/* onRetry prop이 전달된 경우에만 재시도 버튼 표시 */}
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry()}
                className="text-xs text-primary hover:underline"
              >
                再試行
              </button>
            )}
          </div>
        )}

        {/* 빈 상태 — 폴리시 버전
         * 🌸 이모지: y [0 → -3 → 0] 3초마다 반복 → 살짝 떠다니는 효과
         * 텍스트 2줄: 제목 + 보조 설명 (text-xs, 60% opacity)
         */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <motion.span
              className="text-3xl select-none"
              aria-hidden="true"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              🌸
            </motion.span>
            <p className="text-sm text-muted-foreground">
              通知はまだありません
            </p>
            <p className="text-xs text-muted-foreground/60 px-6 leading-relaxed">
              コメントやリアクションがあるとここに表示されます
            </p>
          </div>
        )}

        {/* 알림 목록 — 컨테이너 단위 fade-in
         *
         * 이전엔 항목별 stagger motion.div 였으나 두 가지 이유로 단순화:
         *  1) iOS에서 transform inline style이 다수 자식에 남으면 부모의
         *     overflow scroll 인식이 종종 깨짐 (layer-promotion 충돌)
         *  2) 알림이 많을수록 stagger 지연이 누적되어 오히려 답답함
         * 컨테이너 한 번만 부드럽게 등장 → 항목들은 평범한 div 로 두어 iOS scroll 안정.
         */}
        {!loading && !error && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="divide-y divide-border/50"
          >
            {items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onClick={onItemClick}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
