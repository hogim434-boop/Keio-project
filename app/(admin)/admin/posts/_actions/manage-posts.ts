'use server'

/**
 * 어드민 게시물 관리 액션
 *
 * - publishNowAction: 예약 게시물을 즉시 발행 (published_at = now())
 * - softDeletePostAction: 게시물을 soft delete (is_deleted = true)
 *
 * 권한: RLS posts_update_admin / posts_delete_admin (is_admin()) 가 백엔드 보강.
 *   Server Action 진입 시 server-side 에서 1차 재검증.
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const IdSchema = z.string().uuid()

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') throw new Error('FORBIDDEN')

  return supabase
}

export async function publishNowAction(formData: FormData) {
  const id = IdSchema.parse(formData.get('post_id'))
  const supabase = await assertAdmin()

  const { error } = await supabase
    .from('posts')
    .update({ published_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/posts')
  revalidatePath('/')
}

export async function softDeletePostAction(formData: FormData) {
  const id = IdSchema.parse(formData.get('post_id'))
  const supabase = await assertAdmin()

  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/admin/posts')
  revalidatePath('/')
}
