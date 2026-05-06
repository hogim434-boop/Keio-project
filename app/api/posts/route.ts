/**
 * /api/posts
 *  GET   목록 조회 (categorySlug, sort, cursor, limit, q)
 *  POST  게시글 작성 — PostFormSchema.safeParse 후 INSERT
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPosts } from '@/lib/community/posts'
import { err, ok, pgErrorToResponse, withAuth } from '@/lib/community/api-helpers'
import {
  CategorySlugSchema,
  PostFormSchema,
} from '@/types/community'
import type { CategorySlug } from '@/types/community'

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url)
  const sortRaw = url.searchParams.get('sort')
  const sort: 'latest' | 'popular' = sortRaw === 'popular' ? 'popular' : 'latest'
  const categorySlugRaw = url.searchParams.get('categorySlug')
  const cursor = url.searchParams.get('cursor')
  const limitRaw = url.searchParams.get('limit')
  const limit = limitRaw ? Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 20)) : 20
  const search = url.searchParams.get('q') ?? undefined

  let categorySlug: CategorySlug | undefined
  if (categorySlugRaw) {
    const parsed = CategorySlugSchema.safeParse(categorySlugRaw)
    if (!parsed.success) return err('VALIDATION', 'カテゴリが正しくありません', 422)
    categorySlug = parsed.data
  }

  try {
    const supabase = await createClient()
    const result = await fetchPosts(supabase, { sort, categorySlug, cursor, limit, search })
    return ok(result)
  } catch (e) {
    return pgErrorToResponse(e)
  }
}

export async function POST(req: Request): Promise<NextResponse> {
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

  return withAuth(req, async (supabase, user) => {
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', parsed.data.categorySlug)
      .maybeSingle()
    if (catErr) throw catErr
    if (!cat) throw new Error('CATEGORY_NOT_FOUND')

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        category_id: cat.id,
        title: parsed.data.title,
        body: parsed.data.body,
        is_anonymous: parsed.data.isAnonymous,
      })
      .select()
      .single()
    if (error) throw error
    return data
  })
}
