'use client'

/**
 * 커뮤니티 하단 내비게이션 바 — 3탭 균등 분배 (1:1:1)
 *
 * 레이아웃:
 *   [ 掲示板 ][ 探索 ][ マイ ]   ← 각 1/3 씩 차지
 *   FAB 는 fixed z-40 으로 가로 정중앙(探索 위치) 에 별도 부유
 *
 * - layoutId='tab-indicator' 슬라이딩 인디케이터 (Framer Motion)
 * - whileTap scale 0.82 마이크로인터랙션
 * - useReducedMotion — 시스템 "모션 줄이기" 대응
 * - pb-safe: iOS 홈 바 safe-area 여백
 * - z-30: FAB(z-40) 보다 낮은 레이어
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** 3탭 — 掲示板 / 探索 / マイ. 각자 화면 1/3 씩 균등 분배 */
const TABS = [
  { href: '/',        icon: Home,   label: '掲示板' },
  { href: '/explore', icon: Search, label: '探索'   },
  { href: '/my',      icon: User,   label: 'マイ'   },
] as const

type TabItem = { href: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string }

/** 탭 활성 여부 판단 — '/'는 정확 일치, 나머지는 startsWith */
function isTabActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

/** 개별 탭 렌더링 컴포넌트 */
function TabItem({ href, icon: Icon, label, pathname, shouldReduce }: TabItem & { pathname: string; shouldReduce: boolean | null }) {
  const active = isTabActive(href, pathname)

  return (
    <Link
      href={href}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] transition-opacity active:opacity-60"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {/* 활성 탭 슬라이딩 인디케이터 — 상단 얇은 바 */}
      {active && (
        <motion.span
          layoutId="tab-indicator"
          className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-foreground"
          transition={
            shouldReduce
              ? { duration: 0 }
              : { type: 'spring', stiffness: 450, damping: 30 }
          }
        />
      )}

      {/* 아이콘 — whileTap 수축 마이크로인터랙션 */}
      <motion.div
        whileTap={shouldReduce ? {} : { scale: 0.82 }}
        transition={{ duration: 0.15 }}
      >
        <Icon
          size={22}
          className={cn(
            'transition-colors',
            active ? 'text-foreground' : 'text-muted-foreground'
          )}
          strokeWidth={active ? 2.5 : 2}
        />
      </motion.div>

      {/* 탭 레이블 */}
      <span
        className={cn(
          'text-xs transition-colors',
          active ? 'text-foreground font-semibold' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </Link>
  )
}

/** 커뮤니티 하단 탭 바 — (app)/layout.tsx 에서 사용 */
export function BottomTabBar() {
  const pathname = usePathname()
  const shouldReduce = useReducedMotion()

  return (
    <nav
      className="pb-safe fixed bottom-0 left-1/2 w-full max-w-[768px] -translate-x-1/2 border-t bg-background/95 backdrop-blur-sm z-30"
      aria-label="タブナビゲーション"
    >
      <div className="flex h-14 items-stretch">
        {/* 3탭 균등 분배 — 각 link 의 flex-1 로 1/3 씩 차지 */}
        {TABS.map((tab) => (
          <TabItem
            key={tab.href}
            {...tab}
            pathname={pathname}
            shouldReduce={shouldReduce}
          />
        ))}
      </div>
    </nav>
  )
}
