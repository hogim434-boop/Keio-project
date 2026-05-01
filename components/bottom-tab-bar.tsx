'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/courses', icon: Home, label: '강의' },
  { href: '/search', icon: Search, label: '검색' },
  { href: '/my', icon: User, label: '마이' },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav className="pb-safe fixed bottom-0 left-1/2 w-full max-w-[768px] -translate-x-1/2 border-t bg-background">
      <div className="flex h-14 items-stretch">
        {TABS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px]"
            >
              <Icon
                size={24}
                className={isActive ? 'text-primary' : 'text-muted-foreground'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  'text-[10px]',
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
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
