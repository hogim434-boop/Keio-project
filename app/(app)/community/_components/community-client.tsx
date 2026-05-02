'use client'

// 자유게시판 클라이언트 컴포넌트 - 탭 필터 + 게시글 목록
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PostCard } from './post-card'
import { PostComposeSheet } from './post-compose-sheet'
import { getPostsByTab } from '@/lib/dummy-community'
import { pageHeader, listContainer, emptyState } from '@/lib/motion-variants'
import type { DummyPost, PostTab } from '@/lib/dummy-community'

// 탭 목록
const TABS: PostTab[] = ['全て', '最新', '人気']

type Props = {
  posts: DummyPost[]
}

export function CommunityClient({ posts: _posts }: Props) {
  // 선택된 탭 상태 (기본값: '全て')
  const [selectedTab, setSelectedTab] = useState<PostTab>('全て')
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

  // 선택된 탭에 따라 게시글 목록 필터링/정렬
  const filteredPosts = getPostsByTab(selectedTab)

  return (
    <div className="mx-auto max-w-[768px] px-4 py-5 space-y-4 pb-24">

      {/* 페이지 제목 — 위에서 살짝 내려오는 진입 효과 */}
      <motion.h1
        variants={shouldReduce ? {} : pageHeader}
        initial="hidden"
        animate="visible"
        className="text-xl font-bold"
      >
        자유게시판
      </motion.h1>

      {/* 탭 필터 칩 목록 */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="group"
        aria-label="게시글 탭 필터"
      >
        {TABS.map((tab) => {
          const isActive = selectedTab === tab
          return (
            /*
             * motion.button: whileTap 마이크로인터랙션
             * py-1 → py-1.5로 터치 타겟 확대 (최소 44px 권장)
             * overflow-hidden: layoutId pill이 버튼 경계를 벗어나지 않도록
             */
            <motion.button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              aria-pressed={isActive}
              whileTap={shouldReduce ? {} : { scale: 0.95 }}
              className="relative shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap overflow-hidden"
            >
              {/*
               * 활성 탭 슬라이딩 배경 — layoutId로 탭 전환 시 배경이 슬라이드 이동
               * absolute inset-0으로 버튼 전체를 덮는 배경 역할
               */}
              {isActive && (
                <motion.span
                  layoutId="community-tab-pill"
                  className="absolute inset-0 bg-foreground rounded-full"
                  transition={
                    shouldReduce
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 450, damping: 30 }
                  }
                />
              )}
              {/*
               * 텍스트는 relative z-10으로 배경 위에 표시
               * 활성: 배경 반전 텍스트, 비활성: 흐린 텍스트
               */}
              <span
                className={cn(
                  'relative z-10 transition-colors',
                  isActive ? 'text-background font-medium' : 'text-foreground/60'
                )}
              >
                {tab}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/*
       * AnimatePresence mode="wait": 탭이 바뀌면 이전 목록이 사라진 후 새 목록 등장
       * key={selectedTab}로 탭 변경 시 컴포넌트 재마운트 → stagger 재실행
       */}
      <AnimatePresence mode="wait">
        {filteredPosts.length === 0 ? (
          /* 빈 상태 — scale+opacity로 부드럽게 등장 */
          <motion.div
            key="empty"
            variants={shouldReduce ? {} : emptyState}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <MessageSquare size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">게시글이 없습니다</p>
            {/* 첫 게시글 유도 문구 */}
            <p className="text-xs text-muted-foreground/70">
              첫 번째 게시글을 작성해보세요
            </p>
          </motion.div>
        ) : (
          /* 게시글 목록 — listContainer로 PostCard 순차 등장 */
          <motion.div
            key={selectedTab}
            variants={shouldReduce ? {} : listContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 게시글 작성 FAB */}
      <PostComposeSheet />
    </div>
  )
}
