'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CourseCard } from '@/components/course-card'
import { listContainer, emptyState } from '@/lib/motion-variants'
import type { DummyCourse } from '@/lib/dummy-data'

const CAMPUSES = ['全て', '三田', '日吉', 'SFC'] as const
type CampusFilter = (typeof CAMPUSES)[number]

type Props = {
  courses: DummyCourse[]
}

export function CoursesClient({ courses }: Props) {
  const [selected, setSelected] = useState<CampusFilter>('全て')
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

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
        {CAMPUSES.map((campus) => {
          const isActive = selected === campus
          return (
            /*
             * motion.button: whileTap으로 탭 시 수축 마이크로인터랙션
             * overflow-hidden: layoutId pill이 버튼 경계를 벗어나지 않도록
             */
            <motion.button
              key={campus}
              onClick={() => setSelected(campus)}
              aria-pressed={isActive}
              whileTap={shouldReduce ? {} : { scale: 0.95 }}
              className="relative shrink-0 rounded-full border px-4 py-1.5 text-sm overflow-hidden"
            >
              {/*
               * 활성 필터 슬라이딩 배경 — layoutId로 캠퍼스 전환 시 배경이 슬라이드 이동
               * absolute inset-0으로 버튼 전체를 덮는 배경 역할
               */}
              {isActive && (
                <motion.span
                  layoutId="campus-pill"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={
                    shouldReduce
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 30 }
                  }
                />
              )}
              {/*
               * 텍스트는 relative z-10으로 배경 위에 표시
               * 활성: 흰 텍스트 (primary 배경 위), 비활성: 흐린 텍스트
               */}
              <span
                className={cn(
                  'relative z-10 font-medium transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {campus}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/*
       * AnimatePresence mode="wait": 필터가 바뀌면 이전 목록이 사라진 후 새 목록 등장
       * 이렇게 해야 stagger 애니메이션이 매번 새로 실행됨
       */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          /* 빈 상태 — scale+opacity로 부드럽게 등장 */
          <motion.div
            key="empty"
            variants={shouldReduce ? {} : emptyState}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <BookOpen size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              해당 캠퍼스의 강의가 없습니다
            </p>
          </motion.div>
        ) : (
          /*
           * 강의 목록 — key={selected}로 필터 변경 시 컴포넌트 재마운트
           * listContainer variants로 자식 CourseCard들이 순차 등장
           */
          <motion.div
            key={selected}
            variants={shouldReduce ? {} : listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filtered.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
