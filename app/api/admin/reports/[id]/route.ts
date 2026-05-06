/**
 * /api/admin/reports/[id]
 *  PATCH  어드민 신고 처리 — admin_resolve_report RPC 호출 위임
 *
 * 액션:
 *   { action: 'delete' }  → 대상 soft-delete + 같은 target 모든 pending → 'processed' 일괄
 *   { action: 'dismiss' } → 같은 target 모든 pending → 'dismissed' 일괄
 *
 * RPC 자체에 is_admin() 가드 + FOR UPDATE 잠금이 있어 race-safe.
 * pgErrorToResponse 가 ERRCODE 자동 매핑:
 *   42501 → 403 PERMISSION_DENIED (관리자 아님)
 *   P0002 → 404 NOT_FOUND          (신고 미존재)
 *   22023 → 422 VALIDATION         (잘못된 action 또는 이미 처리됨)
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { err, withAuth } from '@/lib/community/api-helpers'

const PatchSchema = z.object({
  action: z.enum(['delete', 'dismiss']),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // Next.js 16 — params 는 Promise
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION', 'リクエストボディが不正です', 400)
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION', '無効なアクションです', 422, {
      issues: parsed.error.flatten(),
    })
  }

  return withAuth(req, async (supabase) => {
    const { data, error } = await supabase.rpc('admin_resolve_report', {
      p_report_id: id,
      p_action: parsed.data.action,
    })
    if (error) throw error
    return data
  })
}
