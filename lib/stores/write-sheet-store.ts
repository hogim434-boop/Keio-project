/**
 * write-bottom-sheet 전역 열림/닫힘 상태 — Zustand
 *
 * 사용 예시:
 *   const open  = useWriteSheet(s => s.open)   // WriteFab
 *   const close = useWriteSheet(s => s.close)  // WriteBottomSheet
 *   const isOpen = useWriteSheet(s => s.isOpen) // WriteBottomSheet
 *
 * 'use client' 컴포넌트에서만 사용 — SSR 경계 주의.
 */

import { create } from 'zustand'

interface WriteSheetState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useWriteSheet = create<WriteSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
