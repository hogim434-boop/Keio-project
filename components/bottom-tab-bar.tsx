'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// 하단 탭 목록 (4탭: 강의 · 검색 · 커뮤니티 · 마이)
const TABS = [
  { href: '/courses',   icon: Home,          label: '강의'    },
  { href: '/search',    icon: Search,        label: '검색'    },
  { href: '/community', icon: MessageSquare, label: '커뮤니티' },
  { href: '/my',        icon: User,          label: '마이'    },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    /* 하단 고정 내비게이션 바 */
    <nav
      className="pb-safe fixed bottom-0 left-1/2 w-full max-w-[768px] -translate-x-1/2 border-t bg-background/95 backdrop-blur-sm"
      aria-label="하단 탭 내비게이션"
    >
      <div className="flex h-14 items-stretch">
        {TABS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] transition-opacity active:opacity-60"
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  'text-[10px] transition-colors',
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
