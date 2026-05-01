'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  onChange: (value: number) => void
  max?: number
}

export function StarRatingInput({ value, onChange, max = 5 }: Props) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  return (
    <div className="flex">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const isActive = star <= (hoverValue ?? value)
        return (
          <button
            key={star}
            type="button"
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center',
              isActive ? 'text-yellow-400' : 'text-muted-foreground'
            )}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
          >
            <Star
              size={28}
              className={cn(isActive ? 'fill-yellow-400' : 'fill-none')}
            />
          </button>
        )
      })}
    </div>
  )
}
