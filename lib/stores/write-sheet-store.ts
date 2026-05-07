/**
 * write-bottom-sheet 전역 열림/닫힘 상태 — Zustand
 *
 * 사용 예시:
 *   const open  = useWriteSheet(s => s.open)         // WriteFab — 신규 작성
 *   const openForEdit = useWriteSheet(s => s.openForEdit) // 編集 — 기존 게시글 수정
 *   const close = useWriteSheet(s => s.close)        // WriteBottomSheet
 *   const isOpen = useWriteSheet(s => s.isOpen)      // WriteBottomSheet
 *   const editTarget = useWriteSheet(s => s.editTarget) // 편집 대상 (null = 신규)
 *
 * 'use client' 컴포넌트에서만 사용 — SSR 경계 주의.
 */

import { create } from 'zustand'
import type { CategorySlug } from '@/types/community'

/** 편집 대상 — 기존 게시글의 수정 가능 필드 + id */
export type WriteSheetEditTarget = {
  id: string
  title: string
  body: string
  categorySlug: CategorySlug
  isAnonymous: boolean
}

interface WriteSheetState {
  isOpen: boolean
  /** null = 신규 작성, 객체 있음 = 편집 모드 */
  editTarget: WriteSheetEditTarget | null
  /** 신규 작성으로 시트 열기 */
  open: () => void
  /** 편집 모드로 시트 열기 — 기존 게시글 데이터 prefill */
  openForEdit: (target: WriteSheetEditTarget) => void
  /** 시트 닫기 — editTarget 도 초기화 */
  close: () => void
}

export const useWriteSheet = create<WriteSheetState>((set) => ({
  isOpen: false,
  editTarget: null,
  open: () => set({ isOpen: true, editTarget: null }),
  openForEdit: (target) => set({ isOpen: true, editTarget: target }),
  close: () => set({ isOpen: false, editTarget: null }),
}))
