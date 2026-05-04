/**
 * 앱 셸 레이아웃 — 하단 탭 바 + FAB + 게시글 작성 시트 통합
 *
 * pb-[88px]: 탭 바(56px) + 8px 여백 + FAB(24px) 합산 여백
 * BottomTabBar: 3탭(掲示板/探索/マイ) + 중앙 FAB 슬롯
 * WriteFab: PenSquare 플로팅 버튼, z-40
 * WriteBottomSheet: 80vh 게시글 작성 Sheet, Zustand로 제어
 */

import { BottomTabBar } from '@/components/community/bottom-tab-bar'
import { WriteFab } from '@/components/community/write-fab'
import { WriteBottomSheet } from '@/components/community/write-bottom-sheet'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 하단 탭 바 + FAB 높이만큼 패딩 확보 */}
      <main className="pb-[88px]">{children}</main>
      <BottomTabBar />
      <WriteFab />
      <WriteBottomSheet />
    </>
  )
}
