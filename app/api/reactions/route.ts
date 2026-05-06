/**
 * /api/reactions
 *  POST  추천/비추천 토글 — toggleReaction 위임
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ReactionKindSchema,
  ReactionTargetTypeSchema,
} from '@/types/community'
import { toggleReaction } from '@/lib/community/reactions'
import { err, withAuth } from '@/lib/community/api-helpers'

const BodySchema = z.object({
  targetType: ReactionTargetTypeSchema,
  targetId: z.string().uuid('対象IDが正しくありません'),
  kind: ReactionKindSchema,
})

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION', 'リクエストボディが不正です', 400)
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION', '入力値が不正です', 422, { issues: parsed.error.flatten() })
  }

  return withAuth(req, async (supabase) => {
    return toggleReaction(supabase, parsed.data)
  })
}
