/**
 * /api/posts/[id]
 *  GET     게시글 상세 + 댓글 트리 + 내 reaction/bookmark
 *  DELETE  본인(또는 admin) soft delete (is_deleted=true)
 *
 * Next.js 16: params 가 Promise 로 전달됨.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPostWithComments } from '@/lib/community/post-detail'
import { err, ok, pgErrorToResponse, withAuth } from '@/lib/community/api-helpers'
import { z } from 'zod'

const ParamsSchema = z.object({ id: z.string().uuid() })

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params
  const parsed = ParamsSchema.safeParse({ id })
  if (!parsed.success) return err('VALIDATION', 'IDが正しくありません', 422)

  try {
    const supabase = await createClient()
    const result = await fetchPostWithComments(supabase, parsed.data.id)
    if (!result) return err('NOT_FOUND', '投稿が見つかりません', 404)
    return ok(result)
  } catch (e) {
    return pgErrorToResponse(e)
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params
  const parsed = ParamsSchema.safeParse({ id })
  if (!parsed.success) return err('VALIDATION', 'IDが正しくありません', 422)

  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', parsed.data.id)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error('FORBIDDEN_OR_NOT_FOUND')
    }
    return { id: parsed.data.id }
  })
}
