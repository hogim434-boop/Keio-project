import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const KEIO_DOMAINS = ['@keio.jp', '@g.keio.ac.jp', '@sfc.keio.ac.jp']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/signup?error=auth', origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/signup?error=auth', origin))
  }

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const isKeio = KEIO_DOMAINS.some((domain) => email.endsWith(domain))

  if (!isKeio) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/signup?error=domain', origin))
  }

  // 비밀번호 미설정 사용자 → 계정 설정 페이지로
  const passwordSet = user?.user_metadata?.password_set === true
  if (!passwordSet) {
    return NextResponse.redirect(new URL('/signup/setup', origin))
  }

  return NextResponse.redirect(new URL('/courses', origin))
}
