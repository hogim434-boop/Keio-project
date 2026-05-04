'use client'

// BottomTabBar — 임시 정리 버전 (Task 007-E)
// Phase 4 Task 012에서 3탭(게시판/탐색/마이) + 중앙 FAB 구조로 재작성 예정.
// 강의·검색·커뮤니티 라우트는 게시판 피벗으로 폐기됨 → 임시로 마이 탭만 유지.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// 임시 탭 목록 — Phase 4 Task 012에서 3탭+FAB로 재작성 예정
const TABS = [
  { href: '/',    icon: Home, label: '게시판' },
  { href: '/my',  icon: User, label: '마이'   },
]

export function BottomTabBar() {
  const pathname = usePathname()
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

  return (
    /* 하단 고정 내비게이션 바 — body의 max-w-[768px] 제약 안에서 fixed 배치 */
    <nav
      className="pb-safe fixed bottom-0 left-1/2 w-full max-w-[768px] -translate-x-1/2 border-t bg-background/95 backdrop-blur-sm"
      aria-label="하단 탭 내비게이션"
    >
      <div className="flex h-14 items-stretch">
        {TABS.map(({ href, icon: Icon, label }) => {
          // 홈('/')은 정확히 일치할 때만 활성, 나머지는 startsWith로 판단
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              // relative — 활성 인디케이터(absolute 요소)의 기준점
              className="relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] transition-opacity active:opacity-60"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* 활성 탭 슬라이딩 인디케이터 — 상단에 얇은 바 형태로 표시 */}
              {isActive && (
                <motion.span
                  // layoutId를 통해 탭 전환 시 인디케이터가 슬라이드 이동
                  layoutId="tab-indicator"
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-foreground"
                  // 스프링 물리 기반 전환 — 자연스러운 슬라이딩 느낌
                  transition={
                    shouldReduce
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 30 }
                  }
                />
              )}

              {/* 아이콘 — whileTap으로 탭 시 살짝 수축하는 마이크로인터랙션 */}
              <motion.div
                whileTap={shouldReduce ? {} : { scale: 0.82 }}
                transition={{ duration: 0.15 }}
              >
                <Icon
                  size={22}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                  // 활성 탭은 굵게, 비활성은 조금 얇게
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>

              {/* 탭 레이블 */}
              <span
                className={cn(
                  'text-xs transition-colors',
                  isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
