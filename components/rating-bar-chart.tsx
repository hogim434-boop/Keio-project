import { cn } from '@/lib/utils'
import type { DummyRatings } from '@/lib/dummy-data'

const AXES: { key: keyof DummyRatings; label: string }[] = [
  { key: 'overall', label: '総合評価' },
  { key: 'attendance', label: '出席チェック' },
  { key: 'examDifficulty', label: '試験難易度' },
  { key: 'gradingEase', label: '単位取得' },
  { key: 'teachingStyle', label: '授業スタイル' },
]

type Props = {
  ratings: DummyRatings
  className?: string
}

export function RatingBarChart({ ratings, className }: Props) {
  return (
    <div className={cn('space-y-3', className)}>
      {AXES.map(({ key, label }) => {
        const value = ratings[key]
        const percent = (value / 5) * 100

        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-none"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-xs font-medium">
              {value.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
