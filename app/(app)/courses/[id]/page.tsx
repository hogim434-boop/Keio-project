import { notFound } from 'next/navigation'
import { Star, MessageSquare } from 'lucide-react'
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
    <div className="mx-auto max-w-[768px] px-4 py-5 space-y-6 pb-24">

      {/* 강의 기본 정보 */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold leading-snug">{course.name}</h1>
        <p className="text-sm text-muted-foreground">
          {course.professor} · {course.campus} · {course.department}
        </p>
        {/* 총 평점 + 리뷰 수 요약 */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">
              {course.avgRating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            리뷰 {course.reviewCount}件
          </span>
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 5축 평가 섹션 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">5축 평가</h2>
        <RatingBarChart ratings={course.ratings} />
      </section>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 수업 스타일 태그 섹션 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">수업 스타일</h2>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 리뷰 목록 섹션 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          리뷰 <span className="text-muted-foreground font-normal">({reviews.length})</span>
        </h2>

        {reviews.length === 0 ? (
          /* 리뷰 빈 상태 */
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              아직 리뷰가 없습니다<br />
              <span className="text-xs">첫 번째 리뷰를 남겨보세요</span>
            </p>
          </div>
        ) : (
          /* 리뷰 카드 목록 */
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2.5"
              >
                {/* 리뷰 헤더 - 작성자 정보 + 평점 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    익명 · {review.createdAt}
                  </span>
                  {/* 총합 평점 표시 */}
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">
                      {review.ratings.overall.toFixed(1)}
                    </span>
                  </div>
                </div>
                {/* 리뷰 본문 */}
                <p className="text-sm leading-relaxed text-foreground">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 리뷰 작성 FAB - review-sheet 내부에 포함 */}
      <ReviewSheet />
    </div>
  )
}
