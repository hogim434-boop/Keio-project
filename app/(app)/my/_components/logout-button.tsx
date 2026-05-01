'use client'

import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => alert('로그아웃 기능은 Task 006에서 구현됩니다')}
    >
      로그아웃
    </Button>
  )
}
