import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
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
      <section className="rounded-lg border p-4 space-y-1">
        <p className="font-semibold">{DUMMY_USER.name}</p>
        <p className="text-sm text-muted-foreground">
          {DUMMY_USER.campus} · {DUMMY_USER.department}
        </p>
        <Link
          href="/my/profile"
          className="flex items-center gap-1 text-sm text-primary mt-2"
        >
          프로필 설정
          <ChevronRight size={14} />
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          내 리뷰 ({MY_REVIEWS.length})
        </h2>
        {MY_REVIEWS.map((review) => {
          const course = DUMMY_COURSES.find((c) => c.id === review.courseId)
          return (
            <div key={review.id} className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{course?.name ?? '-'}</p>
                <span className="text-sm font-semibold">
                  ★ {review.ratings.overall.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{review.createdAt}</p>
              <p className="text-sm leading-relaxed">{review.comment}</p>
            </div>
          )
        })}
      </section>

      <LogoutButton />
    </div>
  )
}
