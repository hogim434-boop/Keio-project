/**
 * 마이페이지 데이터 페칭 함수
 *
 * 내 게시글 / 내 댓글 / 내 북마크 3종.
 * Server Component 또는 Route Handler 에서 supabase 클라이언트를 DI 받아 호출.
 * 각 50건 hard limit. is_deleted=false 필터로 소프트 삭제 반영.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PostListItem } from '@/lib/community/posts'

/** 내 댓글 1건 */
export interface MyComment {
  id: string
  body: string
  created_at: string
  post_id: string
  /** 댓글이 달린 게시글 제목 (게시글이 삭제된 경우 null) */
  post_title: string | null
}

/** 내 북마크 1건 */
export interface MyBookmark {
  id: string
  created_at: string
  /** 북마크된 게시글 (게시글이 삭제된 경우 null) */
  post: PostListItem | null
}

/**
 * 내가 작성한 게시글 50건 조회
 * category + author FK 별칭 포함 (PostListItem 타입 호환)
 */
export async function fetchMyPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PostListItem[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, category:categories(slug,name,type), author:profiles(nickname)')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as unknown as PostListItem[]
}

/**
 * 내가 작성한 댓글 50건 조회
 * post:posts(title) FK 별칭으로 원본 게시글 제목 포함
 */
export async function fetchMyComments(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MyComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, post_id, post:posts(title)')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((row) => {
    // FK 별칭 post 의 실제 타입이 unknown 이므로 타입 narrowing
    const postTitle =
      row.post && typeof row.post === 'object' && 'title' in row.post
        ? ((row.post as { title: string }).title ?? null)
        : null
    return {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      post_id: row.post_id,
      post_title: postTitle,
    }
  })
}

/**
 * 내 북마크 50건 조회
 * post FK 별칭으로 게시글 전체 + category + author 포함 (PostListItem 타입 호환)
 */
export async function fetchMyBookmarks(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MyBookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(
      'id, created_at, post:posts(*, category:categories(slug,name,type), author:profiles(nickname))',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    post: (row.post ?? null) as unknown as PostListItem | null,
  }))
}
