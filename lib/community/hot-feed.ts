/**
 * 핫 피드 — 최근 24시간 reaction_up TOP 3 (F014)
 *
 * 게시판 홈 최상단 캐러셀 데이터. is_deleted=false 이중 보장,
 * 익명 게시글은 author=null 마스킹.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PostListItem } from './posts'

export async function fetchHotPosts(
  supabase: SupabaseClient<Database>,
): Promise<PostListItem[]> {
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  const { data, error } = await supabase
    .from('posts')
    .select('*, category:categories(slug,name,type), author:profiles(nickname)')
    .eq('is_deleted', false)
    .gt('created_at', dayAgo)
    .order('reaction_up', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)
  if (error) throw error

  const rows = (data ?? []) as PostListItem[]
  return rows.map((p) => ({ ...p, author: p.is_anonymous ? null : p.author }))
}
