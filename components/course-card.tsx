import Link from 'next/link'
import { Star } from 'lucide-react'
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
  const fullStars = Math.round(avgRating)

  return (
    <Link href={`/courses/${id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="px-4 py-3">
          <p className="font-medium leading-snug">{name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {professor} · {campus}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={cn(
                    i < fullStars
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviewCount}件)</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
