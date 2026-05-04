/**
 * 게시글 상세 조회 (fetchPostWithComments)
 *
 * post + category + author + 댓글 트리(1단계 대댓글) + 내 reaction/bookmark.
 * is_anonymous=true 인 row 의 author 는 server-side 에서 null 마스킹.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Post, Comment, Category } from '@/types/database'
import type { ReactionKind } from '@/types/community'

interface AuthorMeta {
  nickname: string | null
  campus?: string | null
  department?: string | null
}

export interface PostDetail extends Post {
  category: Category | null
  author: AuthorMeta | null
}

export interface CommentNode extends Comment {
  author: AuthorMeta | null
  replies: CommentNode[]
}

export interface PostDetailResult {
  post: PostDetail
  comments: CommentNode[]
  myReaction: ReactionKind | null
  myBookmark: boolean
}

function maskAuthorPost(p: PostDetail): PostDetail {
  return p.is_anonymous ? { ...p, author: null } : p
}

function maskAuthorComment(c: CommentNode): CommentNode {
  return c.is_anonymous ? { ...c, author: null } : c
}

function buildCommentTree(rows: CommentNode[]): CommentNode[] {
  const byId = new Map<string, CommentNode>()
  rows.forEach((r) => byId.set(r.id, { ...r, replies: [] }))
  const roots: CommentNode[] = []
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.replies.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots.map((r) => ({ ...maskAuthorComment(r), replies: r.replies.map(maskAuthorComment) }))
}

export async function fetchPostWithComments(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<PostDetailResult | null> {
  const { data: postRaw, error: postErr } = await supabase
    .from('posts')
    .select('*, category:categories(*), author:profiles(nickname,campus,department)')
    .eq('id', postId)
    .eq('is_deleted', false)
    .maybeSingle()
  if (postErr) throw postErr
  if (!postRaw) return null

  const post = maskAuthorPost(postRaw as unknown as PostDetail)

  const { data: commentsRaw, error: commentsErr } = await supabase
    .from('comments')
    .select('*, author:profiles(nickname)')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
  if (commentsErr) throw commentsErr

  const comments = buildCommentTree((commentsRaw ?? []) as unknown as CommentNode[])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let myReaction: ReactionKind | null = null
  let myBookmark = false

  if (user) {
    const { data: rx } = await supabase
      .from('reactions')
      .select('reaction')
      .eq('user_id', user.id)
      .eq('target_type', 'post')
      .eq('target_id', postId)
      .maybeSingle()
    myReaction = (rx?.reaction as ReactionKind | undefined) ?? null

    const { data: bm } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()
    myBookmark = !!bm
  }

  return { post, comments, myReaction, myBookmark }
}
