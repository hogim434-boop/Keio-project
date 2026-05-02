// 마이 페이지 Server Component
// 더미 데이터를 가공하여 MyClient(Client Component)에 props로 전달

import { DUMMY_REVIEWS, DUMMY_COURSES } from '@/lib/dummy-data'
import { MyClient } from './_components/my-client'

// 임시 더미 사용자 정보
// TODO: 실제 Supabase 인증 사용자 정보로 교체 필요
const DUMMY_USER = {
  name: '匿名ユーザー',
  campus: '三田',
  department: '経済学部',
}

// course-1에 해당하는 리뷰만 필터링 (내 리뷰 시뮬레이션)
// TODO: 로그인한 사용자 ID 기반으로 필터링하도록 변경 필요
const MY_REVIEWS = DUMMY_REVIEWS.filter((r) => r.courseId === 'course-1')

export default function MyPage() {
  // 리뷰 데이터를 MyClient에서 사용할 형태로 변환
  const reviews = MY_REVIEWS.map((review) => {
    const course = DUMMY_COURSES.find((c) => c.id === review.courseId)
    return {
      id: review.id,
      courseName: course?.name ?? '-',
      overallRating: review.ratings.overall,
      createdAt: review.createdAt,
      comment: review.comment,
    }
  })

  return <MyClient user={DUMMY_USER} reviews={reviews} />
}
