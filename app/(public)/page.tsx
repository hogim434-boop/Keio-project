import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    /* 화면 세로 중앙 정렬 컨테이너 */
    <div className="mx-auto max-w-[768px] px-4 min-h-[calc(100dvh-56px)] flex flex-col justify-center">

      {/* 히어로 섹션 */}
      <section className="flex flex-col items-center text-center gap-6">

        {/* 앱 타이틀 및 서브타이틀 */}
        <div className="space-y-3">
          <h1 className="text-6xl font-bold tracking-tight">KEIO SHARE</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            게이오 재학생을 위한<br />익명 강의 리뷰 플랫폼
          </p>
        </div>

        {/* CTA 버튼 영역 */}
        <div className="flex gap-3">
          <Button asChild size="lg" className="rounded-full h-12 px-8">
            <Link href="/signup">시작하기</Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="rounded-full h-12 px-8">
            <Link href="/login">로그인</Link>
          </Button>
        </div>

      </section>

    </div>
  )
}
