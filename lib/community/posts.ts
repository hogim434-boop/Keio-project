/**
 * 게시글 목록 조회 (fetchPosts) + keyset 페이징
 *
 * Server Component / Route Handler 양쪽에서 재사용. supabase 클라이언트는 DI 로 받는다.
 * 익명 게시글은 server-side 에서 author=null 로 마스킹. RLS + .eq(is_deleted,false) 이중 보장.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Post, Category } from '@/types/database'
import type { CategorySlug } from '@/types/community'

export interface PostListItem extends Post {
  category: Pick<Category, 'slug' | 'name' | 'type'> | null
  author: { nickname: string | null } | null
}

export interface FetchPostsOpts {
  categorySlug?: CategorySlug
  sort: 'latest' | 'popular'
  cursor?: string | null
  limit?: number
  search?: string
}

export interface FetchPostsResult {
  items: PostListItem[]
  nextCursor: string | null
}

interface CursorState {
  created_at: string
  id: string
  reaction_up?: number
}

function encodeCursor(state: CursorState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url')
}

function decodeCursor(s: string | null | undefined): CursorState | null {
  if (!s) return null
  try {
    return JSON.parse(Buffer.from(s, 'base64url').toString('utf-8')) as CursorState
  } catch {
    return null
  }
}

export async function fetchPosts(
  supabase: SupabaseClient<Database>,
  opts: FetchPostsOpts,
): Promise<FetchPostsResult> {
  const limit = opts.limit ?? 20

  let categoryId: string | null = null
  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', opts.categorySlug)
      .maybeSingle()
    if (!cat) return { items: [], nextCursor: null }
    categoryId = cat.id
  }

  let q = supabase
    .from('posts')
    .select('*, category:categories(slug,name,type), author:profiles(nickname)')
    .eq('is_deleted', false)
    .limit(limit + 1)

  if (categoryId) q = q.eq('category_id', categoryId)

  if (opts.search && opts.search.trim().length > 0) {
    const term = opts.search.trim().replace(/[%_]/g, '')
    q = q.or(`title.ilike.%${term}%,body.ilike.%${term}%`)
  }

  const cur = decodeCursor(opts.cursor)

  if (opts.sort === 'latest') {
    q = q.order('created_at', { ascending: false }).order('id', { ascending: false })
    if (cur) q = q.lt('created_at', cur.created_at)
  } else {
    q = q
      .order('reaction_up', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
    if (cur && typeof cur.reaction_up === 'number') q = q.lte('reaction_up', cur.reaction_up).lt('created_at', cur.created_at)
  }

  const { data, error } = await q
  if (error) throw error

  const rows = (data ?? []) as PostListItem[]
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  const masked: PostListItem[] = items.map((p) => ({
    ...p,
    author: p.is_anonymous ? null : p.author,
  }))

  let nextCursor: string | null = null
  if (hasMore) {
    const last = items[items.length - 1]
    nextCursor = encodeCursor({
      created_at: last.created_at,
      id: last.id,
      reaction_up: opts.sort === 'popular' ? last.reaction_up : undefined,
    })
  }

  return { items: masked, nextCursor }
}
