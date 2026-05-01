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
    <div className={cn('space-y-2.5', className)}>
      {AXES.map(({ key, label }) => {
        const value = ratings[key]
        const percent = (value / 5) * 100

        return (
          <div key={key} className="flex items-center gap-3">
            {/* 평가 항목 라벨 */}
            <span className="w-[5.5rem] shrink-0 text-xs text-muted-foreground leading-none">
              {label}
            </span>
            {/* 바 차트 트랙 */}
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={5}
              aria-label={`${label}: ${value.toFixed(1)}`}
            >
              {/* 바 차트 채움 */}
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${percent}%` }}
              />
            </div>
            {/* 수치 */}
            <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums">
              {value.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
