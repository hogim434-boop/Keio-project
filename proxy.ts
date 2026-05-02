import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (이 줄을 지우면 안 됩니다)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // /auth/* 경로는 OAuth 콜백 처리 — 프록시에서 개입하지 않음
  if (pathname.startsWith('/auth/')) return supabaseResponse

  const isSetupPath = pathname === '/signup/setup' || pathname.startsWith('/signup/setup/')
  const isLoginPath = pathname === '/login'
  const isSignupPath = pathname === '/signup' && !isSetupPath
  const protectedPaths = ['/my']

  if (user) {
    // Google OAuth로 로그인했지만 비밀번호를 아직 설정하지 않은 사용자
    const provider = user.app_metadata?.provider as string | undefined
    const passwordSet = user.user_metadata?.password_set as boolean | undefined
    const needsSetup = provider === 'google' && passwordSet !== true

    if (needsSetup) {
      // /signup/setup 외 모든 경로에서 setup으로 강제 이동
      if (!isSetupPath) {
        return NextResponse.redirect(new URL('/signup/setup', request.url))
      }
      return supabaseResponse
    }

    // 계정 설정이 완료된 사용자: 로그인·회원가입·setup 페이지에서 내보냄
    if (isLoginPath || isSignupPath || isSetupPath) {
      return NextResponse.redirect(new URL('/courses', request.url))
    }
  }

  if (!user) {
    // 미로그인 상태에서 setup 접근 → 회원가입으로
    if (isSetupPath) {
      return NextResponse.redirect(new URL('/signup', request.url))
    }
    // 보호된 경로 접근 → 로그인으로
    if (protectedPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
