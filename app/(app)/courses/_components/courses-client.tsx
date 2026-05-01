'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
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

      {/* 캠퍼스 필터 칩 목록 */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="group"
        aria-label="캠퍼스 필터"
      >
        {CAMPUSES.map((campus) => (
          <button
            key={campus}
            onClick={() => setSelected(campus)}
            aria-pressed={selected === campus}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
              selected === campus
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground hover:bg-muted/60'
            )}
          >
            {campus}
          </button>
        ))}
      </div>

      {/* 강의 목록 또는 빈 상태 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          /* 빈 상태 - 아이콘과 메시지 표시 */
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BookOpen size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              해당 캠퍼스의 강의가 없습니다
            </p>
          </div>
        ) : (
          filtered.map((course) => <CourseCard key={course.id} {...course} />)
        )}
      </div>

    </div>
  )
}
