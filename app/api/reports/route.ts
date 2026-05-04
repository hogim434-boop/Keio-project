/**
 * /api/reports
 *  POST  신고 — ReportFormSchema.safeParse 후 INSERT
 *
 * UNIQUE(reporter_id, target_type, target_id) — 동일 신고자가 동일 대상 중복 신고 시 23505 → 409
 */

import { NextResponse } from 'next/server'
import { ReportFormSchema } from '@/types/community'
import { err, withAuth } from '@/lib/community/api-helpers'

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION', 'リクエストボディが不正です', 400)
  }

  const parsed = ReportFormSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION', '入力値が不正です', 422, { issues: parsed.error.flatten() })
  }

  return withAuth(async (supabase, user) => {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: parsed.data.targetType,
        target_id: parsed.data.targetId,
        reason: parsed.data.reason,
        description: parsed.data.description ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  })
}
