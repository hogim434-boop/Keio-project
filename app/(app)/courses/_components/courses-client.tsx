'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CourseCard } from '@/components/course-card'
import type { DummyCourse } from '@/lib/dummy-data'

const CAMPUSES = ['全て', '三田', '日吉', 'SFC'] as const
type CampusFilter = (typeof CAMPUSES)[number]

type Props = {
  courses: DummyCourse[]
}

export function CoursesClient({ courses }: Props) {
  const [selected, setSelected] = useState<CampusFilter>('全て')

  const filtered =
    selected === '全て' ? courses : courses.filter((c) => c.campus === selected)

  return (
    <div className="mx-auto max-w-[768px] px-4 py-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CAMPUSES.map((campus) => (
          <button
            key={campus}
            onClick={() => setSelected(campus)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              selected === campus
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-muted'
            )}
          >
            {campus}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            해당 캠퍼스 강의가 없습니다
          </p>
        ) : (
          filtered.map((course) => <CourseCard key={course.id} {...course} />)
        )}
      </div>
    </div>
  )
}
