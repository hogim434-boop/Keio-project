/**
 * 게시글 액션 시트 전역 열림/닫힘 + 대상 상태 — Zustand
 *
 * 사용 예시:
 *   const openActions = usePostActionsSheet((s) => s.open)    // ⋯ 메뉴 버튼
 *   const { isOpen, target, close } = usePostActionsSheet()   // PostActionsSheet
 *
 * 'use client' 컴포넌트에서만 사용 — SSR 경계 주의.
 */

import { create } from 'zustand'

/** 액션 시트 대상 — 게시글 id, 본인 여부, 미리보기 텍스트 */
export type PostActionsTarget = {
  /** 대상 게시글 UUID */
  id: string
  /** 본인 게시글 여부 (削除する 노출 제어) */
  isOwner: boolean
  /** 시트 표시용 제목 미리보기 (선택) */
  preview?: string
}

interface PostActionsSheetState {
  /** 시트 열림 여부 */
  isOpen: boolean
  /** 현재 대상 (null = 미설정) */
  target: PostActionsTarget | null
  /** 시트를 열고 대상 설정 */
  open: (target: PostActionsTarget) => void
  /** 시트 닫힘 + 대상 초기화 */
  close: () => void
}

export const usePostActionsSheet = create<PostActionsSheetState>((set) => ({
  isOpen: false,
  target: null,
  open: (target) => set({ isOpen: true, target }),
  close: () => set({ isOpen: false, target: null }),
}))
