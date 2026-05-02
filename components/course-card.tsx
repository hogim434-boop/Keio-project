'use client'

import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { listItem } from '@/lib/motion-variants'

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
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

  return (
    /*
     * 외부 motion.div: listContainer의 stagger 애니메이션을 상속받아
     * 목록에서 카드들이 순차적으로 등장하는 효과를 담당
     */
    <motion.div variants={shouldReduce ? {} : listItem}>
      <Link href={`/courses/${id}`} className="block group">
        {/*
         * 내부 motion.div: hover/tap 인터랙션 전담
         * whileHover: y:-2 (살짝 뜨는 효과) + 그림자 + 테두리 색 변경
         * whileTap: scale:0.985 (눌리는 느낌)
         * OKLCH 직접값 사용 — Framer Motion은 CSS 변수 보간 불가
         */}
        <motion.div
          whileHover={
            shouldReduce
              ? {}
              : {
                  y: -2,
                  boxShadow: '0 4px 20px oklch(0 0 0 / 0.08)',
                  borderColor: 'oklch(0.708 0 0)',
                }
          }
          whileTap={shouldReduce ? {} : { scale: 0.985 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="rounded-xl border border-border bg-card px-4 py-3.5"
        >
          {/* 강의명 + 이동 아이콘 */}
          <div className="flex items-start justify-between gap-2">
            {/* font-semibold로 강의명 가독성 향상 */}
            <p className="font-semibold leading-snug flex-1 min-w-0">{name}</p>
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
            {/* font-bold로 평점 숫자 강조 */}
            <span className="text-sm font-bold tabular-nums">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount}件)
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
