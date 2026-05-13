import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isKeioEmail } from '@/types/auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/signup?error=auth', origin))
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/signup?error=auth', origin))
  }

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''

  if (!isKeioEmail(email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/signup?error=domain', origin))
  }

  // 비밀번호 미설정 사용자 → 계정 설정 페이지로
  const passwordSet = user?.user_metadata?.password_set === true
  if (!passwordSet) {
    return NextResponse.redirect(new URL('/signup/setup', origin))
  }

  return NextResponse.redirect(new URL('/', origin))
}
