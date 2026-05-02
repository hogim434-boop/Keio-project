'use client'

import { useRef, useEffect, useState } from 'react'
import { Search, FileSearch } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { CourseCard } from '@/components/course-card'
import { listContainer, emptyState } from '@/lib/motion-variants'
import type { DummyCourse } from '@/lib/dummy-data'

type Props = {
  courses: DummyCourse[]
}

export function SearchClient({ courses }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  // 검색 인풋 포커스 여부 — 포커스 시 인풋이 살짝 확대되는 효과
  const [isFocused, setIsFocused] = useState(false)
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

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

      {/*
       * 검색 인풋 래퍼 — 포커스 시 scale:1.01로 살짝 확대
       * 사용자에게 "입력 가능 상태"임을 시각적으로 피드백
       */}
      <motion.div
        className="relative"
        animate={shouldReduce ? {} : (isFocused ? { scale: 1.01 } : { scale: 1 })}
        transition={{ duration: 0.15 }}
      >
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          placeholder="강의명 · 교수명으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-9"
          aria-label="강의 검색"
        />
      </motion.div>

      {/*
       * 검색 결과 수 표시 — AnimatePresence로 등장/퇴장 애니메이션
       * height: 0 → 'auto'로 레이아웃 변화 없이 부드럽게 나타남
       */}
      <AnimatePresence>
        {showResultCount && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            // text-sm + text-foreground/70으로 가독성 향상
            className="text-sm text-foreground/70 px-1"
          >
            {results.length > 0
              ? `${results.length}건의 강의를 찾았습니다`
              : '검색 결과가 없습니다'}
          </motion.p>
        )}
      </AnimatePresence>

      {/*
       * AnimatePresence mode="wait": 빈 상태 ↔ 결과 목록 전환 시
       * 이전 상태가 완전히 사라진 후 새 상태가 등장
       */}
      <AnimatePresence mode="wait">
        {results.length === 0 ? (
          /* 빈 상태 — scale+opacity로 부드럽게 등장 */
          <motion.div
            key="empty"
            variants={shouldReduce ? {} : emptyState}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <FileSearch size={36} className="text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {query.trim()
                  ? `"${query}"에 해당하는 강의가 없습니다`
                  : '강의를 검색해보세요'}
              </p>
              {query.trim() && (
                /* text-muted-foreground (이전 /70 제거)로 가독성 개선 */
                <p className="text-xs text-muted-foreground">
                  다른 키워드로 검색해 보세요
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          /*
           * 강의 목록 — listContainer로 CourseCard 순차 등장
           * key="results"는 고정 (검색어 변경으로 재마운트하지 않음)
           */
          <motion.div
            key="results"
            variants={shouldReduce ? {} : listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {results.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
