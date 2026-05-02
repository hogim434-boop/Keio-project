import { createClient } from '@/lib/supabase/server'
import { DUMMY_REVIEWS, DUMMY_COURSES } from '@/lib/dummy-data'
import { MyClient } from './_components/my-client'

const MY_REVIEWS = DUMMY_REVIEWS.filter((r) => r.courseId === 'course-1')

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userInfo = {
    name: user?.user_metadata?.nickname || user?.email?.split('@')[0] || '사용자',
    campus: user?.user_metadata?.campus ?? '',
    department: user?.user_metadata?.department ?? '',
  }

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

  return <MyClient user={userInfo} reviews={reviews} />
}
