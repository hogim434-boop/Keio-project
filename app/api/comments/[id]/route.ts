/**
 * /api/comments/[id]
 *  DELETE  댓글 소프트 삭제 — is_deleted=true 업데이트
 *
 * Next.js 16: params 가 Promise 로 전달됨.
 * RLS: 본인(user_id 일치) 또는 admin 만 삭제 가능 (DB 정책).
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, err } from '@/lib/community/api-helpers'

const ParamsSchema = z.object({ id: z.string().uuid() })

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params
  const parsed = ParamsSchema.safeParse({ id })
  if (!parsed.success) return err('VALIDATION', 'IDが正しくありません', 422)

  return withAuth(req, async (supabase, user) => {
    // PostgREST 경유 UPDATE 시 RLS 평가 컨텍스트의 auth.uid() 가 NULL 로
    // 평가되어 self 정책이 결정적으로 false → "new row violates RLS" 발생.
    // SECURITY DEFINER RPC 안에서 호출자 검증 + UPDATE 를 캡슐화하여 우회.
    const { error } = await supabase.rpc('soft_delete_comment', {
      p_id: parsed.data.id,
    })
    if (error) {
      // 진단용 — PostgrestError 풀필드 (dev only)
      if (process.env.NODE_ENV !== 'production') {
        console.error('[soft_delete_comment]', {
          userId: user.id,
          commentId: parsed.data.id,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
      }
      // 42501 = UNAUTHORIZED / FORBIDDEN, P0002 = NOT_FOUND
      if (error.code === '42501') throw new Error('FORBIDDEN_OR_NOT_FOUND')
      throw error
    }
    return { id: parsed.data.id }
  })
}
