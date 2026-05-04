/**
 * 신고 바텀 시트 전역 열림/닫힘 + 신고 대상 상태 — Zustand
 *
 * 사용 예시:
 *   const openReport = useReportSheet((s) => s.open)    // ⋯ 메뉴 버튼
 *   const { isOpen, target, close } = useReportSheet()  // ReportBottomSheet
 *
 * 'use client' 컴포넌트에서만 사용 — SSR 경계 주의.
 */

import { create } from 'zustand'

/** 신고 대상 — 게시글 또는 댓글 */
export type ReportTarget = {
  /** 대상 종류: 게시글(post) 또는 댓글(comment) */
  type: 'post' | 'comment'
  /** 대상 UUID */
  id: string
  /** 시트 안내문 표시용 미리보기 (선택) */
  preview?: string
}

interface ReportSheetState {
  /** 시트 열림 여부 */
  isOpen: boolean
  /** 현재 신고 대상 (null = 미설정) */
  target: ReportTarget | null
  /** 시트를 열고 대상 설정 */
  open: (target: ReportTarget) => void
  /** 시트 닫힘 + 대상 초기화 */
  close: () => void
}

export const useReportSheet = create<ReportSheetState>((set) => ({
  isOpen: false,
  target: null,
  open: (target) => set({ isOpen: true, target }),
  close: () => set({ isOpen: false, target: null }),
}))
