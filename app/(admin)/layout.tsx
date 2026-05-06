/**
 * 어드민 라우트 그룹 layout — 이중 검증 (defense-in-depth)
 *
 * proxy.ts 가 1차 게이트(미들웨어 단계)이지만 Server Action·직접 RSC 요청 등
 * 미들웨어 우회 가능성을 차단하기 위해 server-side 에서도 user + role 재검증.
 *   - 미인증 → /login
 *   - 비admin → /
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <>
      {/* 어드민 헤더 - 상단 고정 */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
        {/* 앱 이름 */}
        <span className="text-base font-bold tracking-tight">KEIO SHARE</span>
        {/* 어드민 배지 (일본어 — 일본 학생 대상 서비스) */}
        <span className="text-xs font-medium text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
          管理者
        </span>
      </header>

      {/* 어드민 콘텐츠 영역 */}
      <main>{children}</main>
    </>
  )
}
