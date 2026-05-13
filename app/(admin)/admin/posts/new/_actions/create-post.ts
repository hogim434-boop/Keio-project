'use server'

/**
 * 어드민 게시물 작성·예약 Server Action
 *
 * - 어드민이 시드 계정(seed.*) 명의로 대리 게시
 * - scheduled_at 비어 있으면 즉시 발행, 있으면 미래 시각 예약
 * - RLS posts_insert_admin (is_admin()) 이 백엔드 권한 보강
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const FormSchema = z.object({
  user_id: z.string().uuid({ message: '投稿者の選択が無効です' }),
  category_id: z.string().uuid({ message: 'カテゴリの選択が無効です' }),
  title: z.string().trim().min(1, 'タイトルを入力してください').max(120),
  body: z.string().trim().min(1, '本文を入力してください').max(5000),
  is_anonymous: z.boolean(),
  // datetime-local 입력은 timezone 없는 ISO 문자열 ("YYYY-MM-DDTHH:mm"). 빈값 허용.
  scheduled_at: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined)),
})

export interface CreatePostState {
  ok: boolean
  message?: string
}

export async function createScheduledPost(
  _prev: CreatePostState | undefined,
  formData: FormData,
): Promise<CreatePostState> {
  const supabase = await createClient()

  // 1. server-side 권한 재검증 (layout 가드 우회 가능성 차단)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: '認証が必要です' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return { ok: false, message: '管理者権限が必要です' }

  // 2. 폼 검증
  const parsed = FormSchema.safeParse({
    user_id: formData.get('user_id'),
    category_id: formData.get('category_id'),
    title: formData.get('title'),
    body: formData.get('body'),
    is_anonymous: formData.get('is_anonymous') === 'on',
    scheduled_at: formData.get('scheduled_at'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? '入力が無効です' }
  }

  // 3. published_at 계산
  //    - scheduled_at 없으면 즉시 발행 (now)
  //    - scheduled_at 있으면 그 시각으로 (브라우저 타임존 기준 → ISO 변환)
  //    - 과거 시각은 즉시 발행으로 캡 (사용성)
  const now = new Date()
  let publishedAt: Date = now
  if (parsed.data.scheduled_at) {
    const candidate = new Date(parsed.data.scheduled_at)
    if (Number.isNaN(candidate.getTime())) {
      return { ok: false, message: '予約日時の形式が正しくありません' }
    }
    publishedAt = candidate < now ? now : candidate
  }

  // 4. INSERT
  const { error } = await supabase.from('posts').insert({
    user_id: parsed.data.user_id,
    category_id: parsed.data.category_id,
    title: parsed.data.title,
    body: parsed.data.body,
    is_anonymous: parsed.data.is_anonymous,
    published_at: publishedAt.toISOString(),
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  // 5. 캐시 무효화 + 리다이렉트
  revalidatePath('/admin/posts')
  revalidatePath('/')
  redirect('/admin/posts')
}
