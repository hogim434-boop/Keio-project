'use client'

/**
 * 로그아웃 버튼 컴포넌트
 *
 * Supabase signOut 호출 → router.replace('/landing').
 * 로그아웃 중 Loader2 스피너 표시.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/** 로그아웃 버튼 */
export function LogoutButton() {
  const router = useRouter()
  const [isOut, setIsOut] = useState(false)

  /** 로그아웃 처리 — Supabase signOut → /landing 리다이렉트 */
  async function handleLogout(): Promise<void> {
    if (isOut) return
    setIsOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/landing')
    } catch {
      setIsOut(false)
      toast.error('ログアウトに失敗しました')
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleLogout}
      disabled={isOut}
      aria-label="ログアウト"
    >
      {isOut ? <Loader2 className="size-4 animate-spin" /> : 'ログアウト'}
    </Button>
  )
}
