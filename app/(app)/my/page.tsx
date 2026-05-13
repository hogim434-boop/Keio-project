/**
 * 마이페이지 (Server Component)
 *
 * ?tab 파라미터로 투고 / 댓글 / 북마크 탭 분기.
 * 프로필 헤더 + MyTabs + 탭별 카드 리스트 + 하단 ログアウト.
 * 미인증 시 /login 리다이렉트.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { fetchMyPosts, fetchMyComments, fetchMyBookmarks } from '@/lib/community/my'
import { MyTabs } from '@/components/community/my-tabs'
import { MyPostCard } from '@/components/community/my-post-card'
import { MyCommentCard } from '@/components/community/my-comment-card'
import { MyBookmarkCard } from '@/components/community/my-bookmark-card'
import { MyTabContent } from '@/components/community/my-tab-content'
import { LogoutButton } from '@/components/community/logout-button'
import { NotificationBellContainer } from '@/components/community/notification-bell-container'
import { getCampusLabel, getDepartmentLabel } from '@/lib/locale/labels'
import { CAMPUS_VALUES, DEPARTMENT_VALUES, type Campus, type Department } from '@/types/domain'

/** 유효한 탭 값 목록 */
const TAB_VALUES = ['posts', 'comments', 'bookmarks'] as const
type TabValue = (typeof TAB_VALUES)[number]

/** 마이페이지 — ?tab 분기 Server Component */
export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Next.js 16: searchParams 를 await 으로 받음
  const sp = await searchParams
  const tab: TabValue = (TAB_VALUES as readonly string[]).includes(sp.tab ?? '')
    ? (sp.tab as TabValue)
    : 'posts'

  // 인증 확인 — 미인증 시 /login 리다이렉트
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 프로필 조회 (nickname / campus / department)
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, campus, department')
    .eq('id', user.id)
    .maybeSingle()

  // 탭별 데이터 페칭 — 해당 탭만 쿼리 (불필요한 쿼리 방지)
  const [posts, comments, bookmarks] =
    tab === 'posts'
      ? [await fetchMyPosts(supabase, user.id), [], []]
      : tab === 'comments'
        ? [[], await fetchMyComments(supabase, user.id), []]
        : [[], [], await fetchMyBookmarks(supabase, user.id)]

  return (
    <div>
      {/* 상단 헤더 — 다른 페이지와 동일한 sticky 패턴 (반투명 + backdrop-blur). 우측에 알림 종 + 설정
           sticky-header-shadow: 스크롤 진입 시 미세한 그림자 등장 (Phase 2 #14) */}
      <header className="sticky-header-shadow sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold">マイページ</h1>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBellContainer />
          <Link
            href="/my/profile"
            aria-label="設定"
            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </header>

      {/* 프로필 섹션 */}
      <section className="px-4 py-4 border-b flex items-center gap-3">
        {/*
         * animate-avatar-pop: globals.css 의 avatar-pop 키프레임을 사용.
         * scale 0.88→1.0, cubic-bezier(0.34, 1.56, 0.64, 1) — back-out 오버슈트 곡선.
         * "살짝 튀어오르며 착지"하는 따뜻한 등장감. duration 0.5s.
         * Server Component 이므로 JS 없이 순수 CSS 로 동작.
         */}
        <div
          className="size-14 rounded-full bg-muted flex items-center justify-center text-2xl animate-avatar-pop"
          aria-hidden
        >
          👤
        </div>
        <div className="flex-1 min-w-0">
          {/* 닉네임 — 큰 타이포 SNS 친화 */}
          <p className="text-lg font-bold tracking-tight truncate">{profile?.nickname ?? '匿名'}</p>
          <p className="text-xs text-muted-foreground truncate">
            {/* DB 저장값 → 일본어 라벨 매핑. 매핑 실패(레거시 값) 시 원본 그대로 표시 */}
            {profile?.campus
              ? (CAMPUS_VALUES.includes(profile.campus as Campus)
                  ? getCampusLabel(profile.campus as Campus)
                  : profile.campus)
              : '—'}{' '}
            /{' '}
            {profile?.department
              ? (DEPARTMENT_VALUES.includes(profile.department as Department)
                  ? getDepartmentLabel(profile.department as Department)
                  : profile.department)
              : '—'}
          </p>
        </div>
        {/* プロフィール編集 링크 — /my/profile 재활용 */}
        <Button asChild variant="outline" size="sm">
          <Link href="/my/profile">プロフィール編集</Link>
        </Button>
      </section>

      {/* 탭 세그먼트 컨트롤 — Suspense 로 감싸기 (useSearchParams 사용) */}
      <Suspense fallback={<div className="h-[60px]" aria-hidden />}>
        <MyTabs />
      </Suspense>

      {/* 탭 콘텐츠 — MyTabContent 로 위임 (stagger entrance + remount on tab change) */}
      <section className="px-4 py-4">
        {/* 투고 탭 */}
        {tab === 'posts' && (
          /*
           * key={tab} 은 MyTabContent 내부에서 처리.
           * Server Component → Client Component 에 JSX 를 children 으로 전달하는
           * 정상적인 React 패턴 (직렬화 없이 tree 로 전달됨).
           */
          <MyTabContent
            tab="posts"
            isEmpty={posts.length === 0}
            emptyEmoji="🌸"
            emptyLabel="まだ投稿がありません"
          >
            {posts.map((p) => (
              <MyPostCard key={p.id} post={p} />
            ))}
          </MyTabContent>
        )}

        {/* 댓글 탭 */}
        {tab === 'comments' && (
          <MyTabContent
            tab="comments"
            isEmpty={comments.length === 0}
            emptyEmoji="💬"
            emptyLabel="まだコメントがありません"
          >
            {comments.map((c) => (
              <MyCommentCard key={c.id} comment={c} />
            ))}
          </MyTabContent>
        )}

        {/* 북마크 탭 */}
        {tab === 'bookmarks' && (
          <MyTabContent
            tab="bookmarks"
            isEmpty={bookmarks.length === 0}
            emptyEmoji="🔖"
            emptyLabel="まだブックマークがありません"
          >
            {bookmarks.map((b) => (
              <MyBookmarkCard key={b.id} bookmark={b} />
            ))}
          </MyTabContent>
        )}
      </section>

      {/* 법적 문서 진입점 — 가이드라인 / 약관 / 개인정보 (Task 022 F013) */}
      <nav
        aria-label="法的文書"
        className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground py-4 border-t border-border/50"
      >
        <Link href="/guidelines" className="hover:text-foreground transition-colors">
          コミュニティガイドライン
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          プライバシーポリシー
        </Link>
      </nav>

      {/* 하단 로그아웃 버튼 — 보더 통일 */}
      <section className="px-4 py-4 border-t border-border/50">
        <LogoutButton />
      </section>
    </div>
  )
}
