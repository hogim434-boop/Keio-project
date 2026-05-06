/**
 * /api/notifications
 *  GET    알림 목록 + 미읽음 수 조회 (?limit=20)
 *  PATCH  알림 읽음 처리 — { ids: string[] | 'all' }
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { err, ok, pgErrorToResponse, withAuth } from '@/lib/community/api-helpers'
import { MarkReadRequestSchema } from '@/types/notification'
import {
  fetchNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from '@/lib/notifications/server'

// limit 쿼리 파라미터 검증 스키마 (기본 20, 1~50)
const LimitSchema = z
  .string()
  .optional()
  .transform((v) => (v ? parseInt(v, 10) : 20))
  .pipe(z.number().int().min(1).max(50))

/**
 * GET /api/notifications?limit=20
 *
 * 인증 필수. 미인증 시 401 반환.
 * limit 파라미터 검증이 조기 err 반환을 필요로 하므로 직접 인증 확인 방식 유지.
 * fetchNotifications + getUnreadCount를 병렬 실행하여 응답 지연 최소화.
 * 응답: { ok: true, data: { items: NotificationListItem[], unreadCount: number } }
 */
export async function GET(req: Request): Promise<NextResponse> {
  // 인증 확인
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHORIZED', 'ログインが必要です', 401)

  // limit 파라미터 검증
  const url = new URL(req.url)
  const limitRaw = url.searchParams.get('limit') ?? undefined
  const limitParsed = LimitSchema.safeParse(limitRaw)
  if (!limitParsed.success) {
    return err('VALIDATION', 'limitの値が正しくありません（1〜50）', 422)
  }
  const limit = limitParsed.data

  try {
    // 목록 조회 + 미읽음 수를 병렬 실행
    const [items, unreadCount] = await Promise.all([
      fetchNotifications(supabase, { limit }),
      getUnreadCount(supabase),
    ])

    return ok({ items, unreadCount })
  } catch (e) {
    return pgErrorToResponse(e)
  }
}

/**
 * PATCH /api/notifications
 * body: { ids: string[] | 'all' }
 *
 * 인증 필수. 미인증 시 401 반환.
 * ids === 'all': 본인의 모든 미읽음 알림 일괄 처리 (markAllRead)
 * ids === string[]: 지정 ID만 읽음 처리 (markRead)
 * 응답: { ok: true, data: { updatedCount: number } }
 */
export async function PATCH(req: Request): Promise<NextResponse> {
  // 요청 바디를 미리 파싱 — Request body는 1회만 소비 가능하므로 withAuth 호출 전에 처리
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION', 'リクエストボディが不正です', 400)
  }

  // zod 스키마로 바디 검증
  const parsed = MarkReadRequestSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION', '入力値が不正です', 422, { issues: parsed.error.flatten() })
  }

  return withAuth(req, async (supabase) => {
    const { ids } = parsed.data
    const updatedCount =
      ids === 'all' ? await markAllRead(supabase) : await markRead(supabase, ids)

    return { updatedCount }
  })
}
