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
    /* 별점 입력 컨테이너 */
    <div className="flex" role="group" aria-label="별점 선택">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const isActive = star <= (hoverValue ?? value)
        return (
          <button
            key={star}
            type="button"
            className={cn(
              'flex min-h-[44px] min-w-[44px] items-center justify-center transition-transform active:scale-90',
              isActive ? 'text-yellow-400' : 'text-muted-foreground/40'
            )}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            aria-label={`${star}점`}
            aria-pressed={star <= value}
          >
            <Star
              size={26}
              className={cn(
                'transition-colors',
                isActive ? 'fill-yellow-400' : 'fill-none'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
