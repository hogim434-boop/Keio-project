'use client'

// 자유게시판 클라이언트 컴포넌트 - 탭 필터 + 게시글 목록
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PostCard } from './post-card'
import { PostComposeSheet } from './post-compose-sheet'
import { getPostsByTab } from '@/lib/dummy-community'
import type { DummyPost, PostTab } from '@/lib/dummy-community'

// 탭 목록
const TABS: PostTab[] = ['全て', '最新', '人気']

type Props = {
  posts: DummyPost[]
}

export function CommunityClient({ posts: _posts }: Props) {
  // 선택된 탭 상태 (기본값: '全て')
  const [selectedTab, setSelectedTab] = useState<PostTab>('全て')

  // 선택된 탭에 따라 게시글 목록 필터링/정렬
  const filteredPosts = getPostsByTab(selectedTab)

  return (
    <div className="mx-auto max-w-[768px] px-4 py-5 space-y-4 pb-24">

      {/* 페이지 제목 */}
      <h1 className="text-xl font-bold">자유게시판</h1>

      {/* 탭 필터 칩 목록 */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="group"
        aria-label="게시글 탭 필터"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            aria-pressed={selectedTab === tab}
            className={cn(
              'rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors',
              selectedTab === tab
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 게시글 목록 또는 빈 상태 */}
      {filteredPosts.length === 0 ? (
        /* 게시글 빈 상태 */
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageSquare size={36} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">게시글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}

      {/* 게시글 작성 FAB */}
      <PostComposeSheet />
    </div>
  )
}
