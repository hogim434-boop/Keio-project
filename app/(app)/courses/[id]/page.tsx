import { notFound } from 'next/navigation'
import { DUMMY_COURSES, getReviewsByCourseId } from '@/lib/dummy-data'
import { RatingBarChart } from '@/components/rating-bar-chart'
import { ReviewSheet } from './_components/review-sheet'

const STYLE_TAGS = ['板書あり', '少人数', '自由参加', 'ディスカッション']

type Props = {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params
  const course = DUMMY_COURSES.find((c) => c.id === id)
  if (!course) notFound()

  const reviews = getReviewsByCourseId(id)

  return (
    <div className="mx-auto max-w-[768px] px-4 py-4 space-y-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-xl font-bold leading-snug">{course.name}</h1>
        <p className="text-sm text-muted-foreground">
          {course.professor} · {course.campus} · {course.department}
        </p>
        <p className="text-sm text-muted-foreground">
          리뷰 {course.reviewCount}件
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">5축 평가</h2>
        <RatingBarChart ratings={course.ratings} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">수업 스타일</h2>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          리뷰 ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            아직 리뷰가 없습니다
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  익명 · {review.createdAt}
                </span>
                <span className="text-sm font-semibold">
                  ★ {review.ratings.overall.toFixed(1)}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </section>

      <ReviewSheet />
    </div>
  )
}
