import { HeroSection } from './_components/hero-section'

/**
 * LandingPage — 랜딩 페이지 (공개 접근 가능)
 *
 * Server Component: HeroSection만 불러와서 렌더링.
 * 실제 애니메이션 로직은 HeroSection('use client')에 격리되어 있어
 * 서버/클라이언트 경계가 명확함.
 */
export default function LandingPage() {
  return (
    /* 화면 세로 중앙 정렬 컨테이너 */
    <div className="mx-auto max-w-[768px] px-4 min-h-dvh flex flex-col justify-center">
      <HeroSection />
    </div>
  )
}
