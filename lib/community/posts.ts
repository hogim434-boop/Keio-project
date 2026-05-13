/**
 * 게시글 목록 조회 (fetchPosts) + keyset 페이징
 *
 * Server Component / Route Handler 양쪽에서 재사용. supabase 클라이언트는 DI 로 받는다.
 * 익명 게시글은 server-side 에서 author=null 로 마스킹. RLS + .eq(is_deleted,false) 이중 보장.
 */

import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Post, Category } from '@/types/database'
import type { CategorySlug, ReactionKind } from '@/types/community'

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

/**
 * cursor payload 스키마 — PostgREST `.or()` 필터에 직접 보간되므로
 * 형식 검증 없이 사용하면 인젝션 위험이 있다. 디코딩 직후 zod 로 강제 검증.
 *   - published_at: ISO 8601 datetime (예약 발행 도입 후 정렬·필터 키)
 *   - id: UUID
 *   - reaction_up: 0 이상 정수 (popular 정렬에서만 사용)
 */
const CursorStateSchema = z.object({
  published_at: z.string().datetime({ offset: true }),
  id: z.string().uuid(),
  reaction_up: z.number().int().min(0).optional(),
})
type CursorState = z.infer<typeof CursorStateSchema>

function encodeCursor(state: CursorState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url')
}

function decodeCursor(s: string | null | undefined): CursorState | null {
  if (!s) return null
  try {
    const raw = JSON.parse(Buffer.from(s, 'base64url').toString('utf-8'))
    const parsed = CursorStateSchema.safeParse(raw)
    return parsed.success ? parsed.data : null
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

  // RLS posts_select_visible 이 published_at <= now() 를 강제하지만,
  // 명시적으로도 필터하여 인덱스 사용 + 가독성 확보
  const nowIso = new Date().toISOString()

  let q = supabase
    .from('posts')
    .select('*, category:categories(slug,name,type), author:profiles(nickname)')
    .eq('is_deleted', false)
    .lte('published_at', nowIso)
    .limit(limit + 1)

  if (categoryId) q = q.eq('category_id', categoryId)

  if (opts.search && opts.search.trim().length > 0) {
    const term = opts.search.trim().replace(/[%_]/g, '')
    q = q.or(`title.ilike.%${term}%,body.ilike.%${term}%`)
  }

  const cur = decodeCursor(opts.cursor)

  if (opts.sort === 'latest') {
    q = q.order('published_at', { ascending: false }).order('id', { ascending: false })
    // (published_at, id) 복합 커서: 동일 ms 발행 게시글 중복/누락 방지
    if (cur) {
      q = q.or(
        `published_at.lt.${cur.published_at},and(published_at.eq.${cur.published_at},id.lt.${cur.id})`,
      )
    }
  } else {
    q = q
      .order('reaction_up', { ascending: false })
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
    // (reaction_up, published_at, id) 3-key 복합 커서
    if (cur && typeof cur.reaction_up === 'number') {
      q = q.or(
        `reaction_up.lt.${cur.reaction_up},` +
          `and(reaction_up.eq.${cur.reaction_up},published_at.lt.${cur.published_at}),` +
          `and(reaction_up.eq.${cur.reaction_up},published_at.eq.${cur.published_at},id.lt.${cur.id})`,
      )
    }
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
      published_at: last.published_at,
      id: last.id,
      reaction_up: opts.sort === 'popular' ? last.reaction_up : undefined,
    })
  }

  return { items: masked, nextCursor }
}

/**
 * 현재 로그인 사용자의 게시글별 반응(up/down) 및 북마크 여부를 batch 조회
 *
 * 게시판 목록 화면에서 카드별로 ❤️/🔖 활성 상태를 표시하기 위해 사용.
 * 비로그인 사용자나 빈 postIds 의 경우 빈 결과 반환.
 *
 * RLS:
 *   - reactions: SELECT 전체 허용 → user_id 필터로 본인 데이터만 추출
 *   - bookmarks: SELECT 본인만 허용 → 자동으로 본인 행만 반환
 */
export async function fetchMyReactionsAndBookmarks(
  supabase: SupabaseClient<Database>,
  postIds: string[],
): Promise<{ myReactions: Record<string, ReactionKind>; myBookmarks: string[] }> {
  if (postIds.length === 0) return { myReactions: {}, myBookmarks: [] }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { myReactions: {}, myBookmarks: [] }

  const [rxRes, bmRes] = await Promise.all([
    supabase
      .from('reactions')
      .select('target_id, reaction')
      .eq('user_id', user.id)
      .eq('target_type', 'post')
      .in('target_id', postIds),
    supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds),
  ])

  const myReactions: Record<string, ReactionKind> = {}
  for (const r of rxRes.data ?? []) {
    myReactions[r.target_id as string] = r.reaction as ReactionKind
  }
  const myBookmarks = (bmRes.data ?? []).map((b) => b.post_id as string)

  return { myReactions, myBookmarks }
}
