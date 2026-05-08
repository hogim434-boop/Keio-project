'use client'

/**
 * AutoLogoutGuard — 비활성 자동 로그아웃 감시 컴포넌트
 *
 * UI 없음(return null). useAutoLogout 훅을 마운트하고,
 * 만료 시 signOut → 일본어 토스트 → /login 리다이렉트 처리만 담당.
 *
 * app/(app)/layout.tsx 에 한 번만 마운트되어
 * 모든 인증 라우트에 자동 적용된다.
 */

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAutoLogout, AUTO_LOGOUT_STORAGE_KEY } from '@/hooks/use-auto-logout'
import { createClient } from '@/lib/supabase/client'

/** 자동 로그아웃 감시 컴포넌트 — UI 없음 */
export function AutoLogoutGuard() {
  const router = useRouter()

  /**
   * 비활성 만료 시 실행되는 콜백.
   *
   * signOut 실패 여부와 관계없이 토스트를 띄우고 /login으로 보낸다.
   * (토큰이 이미 만료된 상태일 가능성이 높으므로, 화면을 이탈하는 것이 최우선)
   */
  useAutoLogout(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      // 다음 로그인 시 옛 timestamp로 즉시 만료 판정되는 것을 방지
      try { localStorage.removeItem(AUTO_LOGOUT_STORAGE_KEY) } catch {}
      // signOut 성공·실패 모두 토스트 + 리다이렉트
      toast.warning('セッションが期限切れです。再度ログインしてください。')
      router.replace('/login')
    }
  })

  // UI 없음 — 감시 역할만 담당
  return null
}
