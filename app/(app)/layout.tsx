/**
 * 앱 셸 레이아웃 — 하단 탭 바 + FAB + 게시글 작성 시트 + 신고 시트 통합
 *
 * pb-[88px]: 탭 바(56px) + 8px 여백 + FAB(24px) 합산 여백
 * BottomTabBar: 3탭(掲示板/探索/マイ) + 중앙 FAB 슬롯
 * WriteFab: PenSquare 플로팅 버튼, z-40
 * WriteBottomSheet: 80vh 게시글 작성 Sheet, Zustand로 제어
 * ReportBottomSheet: 50vh 신고 Sheet, Zustand(useReportSheet)로 제어
 * WelcomeModal: 최초 로그인 시 1회만 표시 — profiles.onboarded_at == null 조건
 */

import { BottomTabBar } from '@/components/community/bottom-tab-bar'
import { WriteFab } from '@/components/community/write-fab'
import { WriteBottomSheet } from '@/components/community/write-bottom-sheet'
import { ReportBottomSheet } from '@/components/community/report-sheet'
import { PostActionsSheet } from '@/components/community/post-actions-sheet'
import { AutoLogoutGuard } from '@/components/auth/auto-logout-guard'
import { WelcomeModal } from '@/components/community/welcome-modal'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 환영 모달 표시 여부 — 로그인 사용자 중 onboarded_at == null 일 때만 true
  // nickname 은 타이틀 「ようこそ、{nickname}さん。」 에 사용 (없으면 「ようこそ。」)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let showWelcome = false
  let welcomeNickname: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at, nickname')
      .eq('id', user.id)
      .maybeSingle()
    showWelcome = profile?.onboarded_at == null
    welcomeNickname = profile?.nickname ?? null
  }

  return (
    <>
      {/* 모바일 우선 768px 가운데 정렬 + 하단 탭 바·FAB 만큼 padding */}
      <main className="mx-auto w-full max-w-[768px] pb-[88px]">{children}</main>
      <BottomTabBar />
      <WriteFab />
      <WriteBottomSheet />
      {/* 신고 시트 — 모든 (app) 라우트에서 ⋯ 메뉴 → openReport() 로 호출 가능 */}
      <ReportBottomSheet />
      {/* 게시글 액션 시트 — ⋯ 메뉴 → openActions() 로 호출 가능 */}
      <PostActionsSheet />
      {/* 비활성 30분 자동 로그아웃 감시 — UI 없음 */}
      <AutoLogoutGuard />
      {/* 최초 1회 환영 모달 — 닉네임으로 개인화 */}
      <WelcomeModal shouldOpen={showWelcome} nickname={welcomeNickname} />
    </>
  )
}
