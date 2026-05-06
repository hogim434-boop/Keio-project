/**
 * /api/comments
 *  POST  댓글 작성 — CommentFormSchema.safeParse 후 INSERT
 *
 * 트리거 comments_apply_post_counter 가 posts.comment_count 자동 갱신.
 */

import { NextResponse } from 'next/server'
import { CommentFormSchema } from '@/types/community'
import { err, withAuth } from '@/lib/community/api-helpers'

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION', 'リクエストボディが不正です', 400)
  }

  const parsed = CommentFormSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION', '入力値が不正です', 422, { issues: parsed.error.flatten() })
  }

  return withAuth(req, async (supabase, user) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: parsed.data.postId,
        user_id: user.id,
        parent_id: parsed.data.parentId,
        body: parsed.data.body,
        is_anonymous: parsed.data.isAnonymous,
      })
      .select()
      .single()
    if (error) throw error
    return data
  })
}
