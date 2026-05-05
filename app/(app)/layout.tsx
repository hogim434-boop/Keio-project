/**
 * 앱 셸 레이아웃 — 하단 탭 바 + FAB + 게시글 작성 시트 + 신고 시트 통합
 *
 * pb-[88px]: 탭 바(56px) + 8px 여백 + FAB(24px) 합산 여백
 * BottomTabBar: 3탭(掲示板/探索/マイ) + 중앙 FAB 슬롯
 * WriteFab: PenSquare 플로팅 버튼, z-40
 * WriteBottomSheet: 80vh 게시글 작성 Sheet, Zustand로 제어
 * ReportBottomSheet: 50vh 신고 Sheet, Zustand(useReportSheet)로 제어
 */

import { BottomTabBar } from '@/components/community/bottom-tab-bar'
import { WriteFab } from '@/components/community/write-fab'
import { WriteBottomSheet } from '@/components/community/write-bottom-sheet'
import { ReportBottomSheet } from '@/components/community/report-sheet'
import { PostActionsSheet } from '@/components/community/post-actions-sheet'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    </>
  )
}
