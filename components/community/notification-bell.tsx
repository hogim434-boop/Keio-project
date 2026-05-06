'use client'

/**
 * 알림 종 아이콘 컴포넌트 — Popover 트리거
 *
 * - 미읽음 수에 따라 빨간 배지 표시 (99+ 클리핑)
 * - Popover align="end" 로 헤더 우측 정렬에 맞게 열림
 * - aria-label="通知" + aria-live="polite" (배지 카운트 접근성)
 * - onOpenChange: Phase 4에서 알림 fetch 트리거로 연결
 * - shake: 새 알림 도착 시 벨 아이콘 살짝 흔들림 (framer-motion)
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'
import { motion, useAnimationControls } from 'framer-motion'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** NotificationBell props */
interface NotificationBellProps {
  /** 미읽음 알림 수 */
  unreadCount: number
  /** NotificationPanel 등 팝오버 내부에 렌더링할 콘텐츠 */
  children: ReactNode
  /** 팝오버 열림/닫힘 변경 시 콜백 — Phase 4 fetch 트리거 용 */
  onOpenChange?: (open: boolean) => void
  /**
   * 새 알림 도착 시 true → 벨이 한 번 흔들림
   * container에서 unreadCount 증가를 감지해 잠깐 true로 바꿔주면 됨
   */
  shake?: boolean
}

export function NotificationBell({
  unreadCount,
  children,
  onOpenChange,
  shake = false,
}: NotificationBellProps) {
  // framer-motion 애니메이션 제어 인스턴스
  const controls = useAnimationControls()

  // 패널 열림 상태 — body 스크롤 잠금에 사용
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!shake) return

    // 벨 흔들림 시퀀스
    // rotate: [0, -10, 10, -8, 8, -4, 4, 0] — 물리적인 종 흔들림 느낌
    // duration 0.6초, easeInOut 으로 자연스러운 감속
    controls.start({
      rotate: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    })
  }, [shake, controls])

  /**
   * iOS Safari 호환 body scroll lock
   *
   * 모바일 Safari는 inner overflow 영역의 터치를 부모 body로 전파시켜
   * 패널 안 알림을 스크롤하려 하면 페이지 전체가 먼저 스크롤됨.
   * `overscroll-behavior: contain` 만으로는 부족한 케이스.
   *
   * 해결: 패널 열렸을 때 body 자체를 position:fixed 로 고정하여 스크롤 차단,
   *       닫을 때 원래 스크롤 위치로 복원. (CSS overflow:hidden 만으로는
   *       iOS에서 종종 작동 안 해서 이 트릭을 사용함)
   */
  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const body = document.body
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'

    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      // 원래 스크롤 위치로 복원
      window.scrollTo(0, scrollY)
    }
  }, [open])

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        onOpenChange?.(o)
      }}
    >
      {/* ── 트리거: 종 아이콘 버튼 ── */}
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="通知"
          className={cn(
            'relative inline-flex items-center justify-center rounded-full p-2 transition-colors',
            'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {/*
           * motion.span 으로 Bell 아이콘만 감쌈
           * inline-block 필수: rotate transform이 적용되려면 block 레벨이어야 함
           */}
          <motion.span
            animate={controls}
            className="inline-block"
            style={{ transformOrigin: 'top center' }}
          >
            <Bell className="h-5 w-5" />
          </motion.span>

          {/* 미읽음 배지 — unreadCount > 0 일 때만 표시 */}
          {unreadCount > 0 && (
            <span
              aria-live="polite"
              aria-atomic="true"
              className={cn(
                'absolute right-1 top-1 flex min-w-4 h-4 items-center justify-center',
                'rounded-full bg-red-500 px-[3px]',
                'text-[10px] font-semibold leading-none text-white',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* ── 팝오버 콘텐츠: NotificationPanel이 children으로 들어옴 ──
       *
       * collisionPadding: 모바일에서 우측 정렬 시 화면 가장자리로부터 8px 여백 보장
       * data-[state=open]:!animate-none: shadcn 기본 zoom-in 애니메이션 제거
       *   → iOS 에서 transform 잔여로 inner scroll 인식이 깨지는 현상 차단
       */}
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="p-0 w-auto border-0 shadow-none bg-transparent data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
