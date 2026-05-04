'use client'

/**
 * 게시글 상세 댓글 스레드 — Client 래퍼 컴포넌트
 *
 * CommentList + CommentForm 을 묶어 返信 상태(replyTo)를 공유.
 * page.tsx(Server Component) 에서 props 전달만 담당하고,
 * 클라이언트 상태(返信 모드)는 이 컴포넌트에서 관리.
 */

import { useState } from 'react'
import { CommentList } from '@/components/community/comment-list'
import { CommentForm } from '@/components/community/comment-form'
import type { CommentNode } from '@/lib/community/post-detail'

export interface PostDetailThreadProps {
  comments: CommentNode[]
  postId: string
  currentUserId: string | null
}

export function PostDetailThread({
  comments,
  postId,
  currentUserId,
}: PostDetailThreadProps) {
  // 返信 모드 상태 — { id: 부모 댓글 ID, preview: 미리보기 텍스트 }
  const [replyTo, setReplyTo] = useState<{ id: string; preview: string } | null>(null)

  return (
    <>
      <CommentList
        comments={comments}
        currentUserId={currentUserId}
        onReply={setReplyTo}
      />
      <CommentForm
        postId={postId}
        replyTo={replyTo}
        onSubmitted={() => setReplyTo(null)}
        onCancelReply={() => setReplyTo(null)}
      />
    </>
  )
}
