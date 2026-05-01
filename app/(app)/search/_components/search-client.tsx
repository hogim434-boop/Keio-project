'use client'

import { useRef, useEffect, useState } from 'react'
import { Search, FileSearch } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CourseCard } from '@/components/course-card'
import type { DummyCourse } from '@/lib/dummy-data'

type Props = {
  courses: DummyCourse[]
}

export function SearchClient({ courses }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  /* 페이지 진입 시 검색 인풋 자동 포커스 */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = query.trim()
    ? courses.filter(
        (c) => c.name.includes(query) || c.professor.includes(query)
      )
    : courses

  /* 검색어가 있을 때만 결과 수 표시 */
  const showResultCount = query.trim().length > 0

  return (
    <div className="mx-auto max-w-[768px] px-4 py-4 space-y-4">

      {/* 검색 인풋 */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          placeholder="강의명 · 교수명으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label="강의 검색"
        />
      </div>

      {/* 검색 결과 수 표시 (검색어 있을 때만) */}
      {showResultCount && (
        <p className="text-xs text-muted-foreground px-1">
          {results.length > 0
            ? `${results.length}건의 강의를 찾았습니다`
            : '검색 결과가 없습니다'}
        </p>
      )}

      {/* 검색 결과 목록 또는 빈 상태 */}
      {results.length === 0 ? (
        /* 빈 상태 - 검색어가 있지만 결과가 없는 경우 */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FileSearch size={36} className="text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? `"${query}"에 해당하는 강의가 없습니다`
                : '강의를 검색해보세요'}
            </p>
            {query.trim() && (
              <p className="text-xs text-muted-foreground/70">
                다른 키워드로 검색해 보세요
              </p>
            )}
          </div>
        </div>
      ) : (
        /* 강의 카드 목록 */
        <div className="space-y-3">
          {results.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      )}

    </div>
  )
}
