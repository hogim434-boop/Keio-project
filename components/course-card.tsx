import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  name: string
  professor: string
  campus: string
  avgRating: number
  reviewCount: number
}

export function CourseCard({ id, name, professor, campus, avgRating, reviewCount }: Props) {
  /* 평균 평점 기준으로 채워진 별 수 계산 */
  const fullStars = Math.round(avgRating)

  return (
    <Link href={`/courses/${id}`} className="block group">
      <Card className="transition-all group-hover:ring-foreground/20 group-hover:bg-muted/30">
        <CardContent className="px-4 py-3.5">
          {/* 강의명 + 이동 아이콘 */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium leading-snug flex-1 min-w-0">{name}</p>
            <ChevronRight
              size={16}
              className="text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors"
            />
          </div>

          {/* 교수명 · 캠퍼스 */}
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {professor} · {campus}
          </p>

          {/* 별점 + 평점 숫자 + 리뷰 수 */}
          <div className="mt-2.5 flex items-center gap-1.5">
            {/* 별점 아이콘 5개 */}
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={cn(
                    i < fullStars
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-muted-foreground/40'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount}件)
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
