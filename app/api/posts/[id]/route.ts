/**
 * /api/posts/[id]
 *  GET     게시글 상세 + 댓글 트리 + 내 reaction/bookmark
 *  PATCH   본인(또는 admin) 게시글 수정 — 제목/본문/카테고리/익명여부
 *  DELETE  본인(또는 admin) soft delete (is_deleted=true)
 *
 * Next.js 16: params 가 Promise 로 전달됨.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPostWithComments } from '@/lib/community/post-detail'
import { err, ok, pgErrorToResponse, withAuth } from '@/lib/community/api-helpers'
import { PostFormSchema } from '@/types/community'
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params
  const parsedParams = ParamsSchema.safeParse({ id })
  if (!parsedParams.success) return err('VALIDATION', 'IDが正しくありません', 422)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION', 'リクエストボディが不正です', 400)
  }

  const parsed = PostFormSchema.safeParse(body)
  if (!parsed.success) {
    return err('VALIDATION', '入力値が不正です', 422, { issues: parsed.error.flatten() })
  }

  return withAuth(req, async (supabase) => {
    // categorySlug → category_id 매핑 (POST 와 동일 패턴)
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', parsed.data.categorySlug)
      .maybeSingle()
    if (catErr) throw catErr
    if (!cat) throw new Error('CATEGORY_NOT_FOUND')

    // RLS posts_update_self 가 비본인 row 를 차단 → count=0 으로 권한 부재 판별
    // updated_at 은 posts_set_updated_at 트리거가 자동 갱신
    const { error, count } = await supabase
      .from('posts')
      .update(
        {
          title: parsed.data.title,
          body: parsed.data.body,
          category_id: cat.id,
          is_anonymous: parsed.data.isAnonymous,
        },
        { count: 'exact' },
      )
      .eq('id', parsedParams.data.id)
      .eq('is_deleted', false)
    if (error) throw error
    if (!count || count === 0) {
      throw new Error('FORBIDDEN_OR_NOT_FOUND')
    }
    return { id: parsedParams.data.id }
  })
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params
  const parsed = ParamsSchema.safeParse({ id })
  if (!parsed.success) return err('VALIDATION', 'IDが正しくありません', 422)

  return withAuth(req, async (supabase) => {
    // soft delete 후 is_deleted=true 가 된 row 는 select 정책으로 가려지므로
    // .select() 대신 count 로 영향 행 수 확인 — RLS 가 비본인을 차단하면 count=0
    const { error, count } = await supabase
      .from('posts')
      .update({ is_deleted: true }, { count: 'exact' })
      .eq('id', parsed.data.id)
    if (error) throw error
    if (!count || count === 0) {
      throw new Error('FORBIDDEN_OR_NOT_FOUND')
    }
    return { id: parsed.data.id }
  })
}
