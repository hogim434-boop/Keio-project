import Link from 'next/link'
import { ChevronRight, Star, User, MessageSquare } from 'lucide-react'
import { DUMMY_REVIEWS, DUMMY_COURSES } from '@/lib/dummy-data'
import { LogoutButton } from './_components/logout-button'

const DUMMY_USER = {
  name: '匿名ユーザー',
  campus: '三田',
  department: '経済学部',
}

const MY_REVIEWS = DUMMY_REVIEWS.filter((r) => r.courseId === 'course-1')

export default function MyPage() {
  return (
    <div className="mx-auto max-w-[768px] px-4 py-6 space-y-6">

      {/* 프로필 카드 */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        {/* 아바타 + 사용자 정보 */}
        <div className="flex items-center gap-3">
          {/* 아바타 아이콘 */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0">
            <User size={22} className="text-muted-foreground" />
          </div>
          {/* 이름 + 캠퍼스/학부 */}
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold truncate">{DUMMY_USER.name}</p>
            <p className="text-sm text-muted-foreground">
              {DUMMY_USER.campus} · {DUMMY_USER.department}
            </p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-border" />

        {/* 프로필 설정 링크 */}
        <Link
          href="/my/profile"
          className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>프로필 설정</span>
          <ChevronRight size={16} />
        </Link>
      </section>

      {/* 내 리뷰 섹션 */}
      <section className="space-y-3">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">내 리뷰</h2>
          <span className="text-xs text-muted-foreground">({MY_REVIEWS.length})</span>
        </div>

        {MY_REVIEWS.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              아직 작성한 리뷰가 없습니다
            </p>
          </div>
        ) : (
          /* 리뷰 카드 목록 */
          MY_REVIEWS.map((review) => {
            const course = DUMMY_COURSES.find((c) => c.id === review.courseId)
            return (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2"
              >
                {/* 강의명 + 평점 */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug flex-1 min-w-0 truncate">
                    {course?.name ?? '-'}
                  </p>
                  {/* 평점 표시 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">
                      {review.ratings.overall.toFixed(1)}
                    </span>
                  </div>
                </div>
                {/* 작성일 */}
                <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                {/* 리뷰 내용 */}
                <p className="text-sm leading-relaxed text-foreground/90">
                  {review.comment}
                </p>
              </div>
            )
          })
        )}
      </section>

      {/* 로그아웃 버튼 */}
      <div className="pt-2">
        <LogoutButton />
      </div>

    </div>
  )
}
