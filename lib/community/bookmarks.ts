/**
 * 북마크 토글 (toggleBookmark)
 *
 * 토글-only — 기존 row 있으면 DELETE, 없으면 INSERT.
 * UNIQUE(user_id, post_id) 가 중복 방지.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface ToggleBookmarkResult {
  bookmarked: boolean
}

export async function toggleBookmark(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<ToggleBookmarkResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')

  const { data: existing, error: selErr } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()
  if (selErr) throw selErr

  if (existing) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id)
    if (error) throw error
    return { bookmarked: false }
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, post_id: postId })
  if (error) throw error
  return { bookmarked: true }
}
