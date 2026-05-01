'use client'

import { useRef, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CourseCard } from '@/components/course-card'
import type { DummyCourse } from '@/lib/dummy-data'

type Props = {
  courses: DummyCourse[]
}

export function SearchClient({ courses }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = query.trim()
    ? courses.filter(
        (c) => c.name.includes(query) || c.professor.includes(query)
      )
    : courses

  return (
    <div className="mx-auto max-w-[768px] px-4 py-4 space-y-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          placeholder="강의명·교수명으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {results.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      )}
    </div>
  )
}
