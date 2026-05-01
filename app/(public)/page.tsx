import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CourseCard } from '@/components/course-card'
import { DUMMY_COURSES } from '@/lib/dummy-data'

const topCourses = [...DUMMY_COURSES]
  .sort((a, b) => b.avgRating - a.avgRating)
  .slice(0, 3)

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-[768px] px-4 py-8 space-y-10">
      <section className="flex flex-col items-center gap-4 py-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">塾ログ</h1>
        <p className="text-muted-foreground text-base max-w-xs">
          게이오 재학생을 위한 익명 강의 리뷰 플랫폼
        </p>
        <div className="flex gap-3 mt-2">
          <Button asChild>
            <Link href="/signup">시작하기</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </section>

      <section>
        <Link href="/search" className="block">
          <Input
            placeholder="강의명·교수명으로 검색"
            readOnly
            className="cursor-pointer pointer-events-none"
          />
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">인기 강의</h2>
        <div className="space-y-3">
          {topCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </section>
    </div>
  )
}
