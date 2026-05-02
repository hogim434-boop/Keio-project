'use client'

// 마이 페이지 클라이언트 컴포넌트
// 프로필 카드, 리뷰 목록, 로그아웃 버튼을 Framer Motion 애니메이션과 함께 렌더링

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Star, User, MessageSquare } from 'lucide-react'
import { listContainer, listItem } from '@/lib/motion-variants'
import { LogoutButton } from './logout-button'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

type UserInfo = {
  name: string
  campus: string
  department: string
}

type ReviewWithCourse = {
  id: string
  courseName: string
  overallRating: number
  createdAt: string
  comment: string
}

type Props = {
  user: UserInfo
  reviews: ReviewWithCourse[]
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function MyClient({ user, reviews }: Props) {
  // 시스템의 모션 감소 설정을 감지 (접근성)
  const shouldReduce = useReducedMotion()

  return (
    // 최상위 래퍼: stagger 애니메이션으로 자식 요소를 순차 등장
    <motion.div
      variants={shouldReduce ? {} : listContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[768px] px-4 py-6 space-y-6"
    >
      {/* ── 프로필 카드 ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={shouldReduce ? {} : listItem}
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        {/* 아바타 + 이름/소속 */}
        <div className="flex items-center gap-3">
          {/* 아바타 원형: 호버 시 살짝 확대 */}
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <User size={22} className="text-muted-foreground" />
          </motion.div>

          {/* 이름 및 소속 정보 */}
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground">
              {user.campus} · {user.department}
            </p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-border" />

        {/* 프로필 설정 링크: 호버 시 오른쪽으로 2px 이동 */}
        <Link
          href="/my/profile"
          className="flex items-center justify-between text-sm font-medium text-foreground transition-colors"
          aria-label="프로필 설정 페이지로 이동"
        >
          <motion.div
            className="flex items-center justify-between w-full"
            whileHover={shouldReduce ? {} : { x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <span>프로필 설정</span>
            <ChevronRight size={16} />
          </motion.div>
        </Link>
      </motion.div>

      {/* ── 내 리뷰 섹션 헤더 ────────────────────────────────────────────────── */}
      <motion.h2
        variants={shouldReduce ? {} : listItem}
        className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
      >
        내 리뷰 ({reviews.length})
      </motion.h2>

      {/* ── 리뷰 목록 또는 빈 상태 ───────────────────────────────────────────── */}
      {reviews.length === 0 ? (
        // 리뷰가 없을 때 빈 상태 표시
        <motion.div
          variants={shouldReduce ? {} : listItem}
          className="flex flex-col items-center gap-3 py-12 text-center"
          role="status"
          aria-label="리뷰 없음"
        >
          <MessageSquare size={32} className="text-muted-foreground/40" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">아직 작성한 리뷰가 없습니다</p>
            <p className="text-xs text-muted-foreground/70">강의를 수강 후 리뷰를 남겨보세요</p>
          </div>
        </motion.div>
      ) : (
        // 리뷰 카드 목록: 각 카드 호버 시 살짝 위로 이동
        reviews.map((review) => (
          <motion.div
            key={review.id}
            variants={shouldReduce ? {} : listItem}
            whileHover={
              shouldReduce
                ? {}
                : { y: -1, boxShadow: '0 2px 12px oklch(0 0 0 / 0.06)' }
            }
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            {/* 강의명 + 평점 */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug flex-1 min-w-0 truncate">
                {review.courseName}
              </p>
              <div className="flex items-center gap-1 shrink-0" aria-label={`평점 ${review.overallRating.toFixed(1)}`}>
                <Star size={12} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
                <span className="text-sm font-bold">{review.overallRating.toFixed(1)}</span>
              </div>
            </div>

            {/* 작성일 */}
            <p className="text-xs text-muted-foreground">
              <time dateTime={review.createdAt}>{review.createdAt}</time>
            </p>

            {/* 리뷰 본문 */}
            <p className="text-sm leading-relaxed text-foreground/90">{review.comment}</p>
          </motion.div>
        ))
      )}

      {/* ── 로그아웃 버튼 ────────────────────────────────────────────────────── */}
      <motion.div variants={shouldReduce ? {} : listItem} className="pt-2">
        {/* TODO: 실제 로그아웃 로직은 LogoutButton 내부에서 구현 */}
        <LogoutButton />
      </motion.div>
    </motion.div>
  )
}
