/**
 * /api/bookmarks
 *  POST  북마크 토글 — toggleBookmark 위임
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { toggleBookmark } from '@/lib/community/bookmarks'
import { err, withAuth } from '@/lib/community/api-helpers'

const BodySchema = z.object({
  postId: z.string().uuid('投稿IDが正しくありません'),
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

  return withAuth(async (supabase) => {
    return toggleBookmark(supabase, parsed.data.postId)
  })
}
