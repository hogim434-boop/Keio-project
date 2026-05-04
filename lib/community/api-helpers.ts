/**
 * API 라우트 공통 헬퍼
 *
 * - withAuth: createClient → getUser → 401 게이트 → handler 호출 → PostgrestError 변환
 * - ok / err: 일관 응답 envelope `{ ok, data | error }`
 * - pgErrorToResponse: PostgrestError code → HTTP status 매핑
 *   23505(unique)→409 / 23514(check)→422 / 23503(fk)→400 / 기타→500
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type ApiHandler<T> = (
  supabase: SupabaseClient<Database>,
  user: User,
) => Promise<T>

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status })
}

export function err(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code, message, ...extra } },
    { status },
  )
}

interface PostgrestLike {
  code?: string
  message?: string
  details?: string
}

function isPostgrestError(e: unknown): e is PostgrestLike {
  return typeof e === 'object' && e !== null && 'code' in e && typeof (e as { code?: unknown }).code === 'string'
}

export function pgErrorToResponse(e: unknown): NextResponse {
  if (e instanceof Error && e.message === 'UNAUTHORIZED') {
    return err('UNAUTHORIZED', '로그인이 필요합니다', 401)
  }
  if (isPostgrestError(e)) {
    const code = e.code
    const msg = e.message ?? 'database error'
    if (code === '23505') return err('CONFLICT', msg, 409)
    if (code === '23514') return err('VALIDATION', msg, 422)
    if (code === '23503') return err('FK_VIOLATION', msg, 400)
    return err('DB_ERROR', msg, 500)
  }
  const msg = e instanceof Error ? e.message : 'internal error'
  return err('INTERNAL', msg, 500)
}

export async function withAuth<T>(handler: ApiHandler<T>): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'ログインが必要です', 401)
  try {
    const data = await handler(supabase, user)
    return ok(data)
  } catch (e) {
    return pgErrorToResponse(e)
  }
}
