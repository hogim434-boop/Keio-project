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
      {/* 상단 헤더 — 다른 페이지와 동일한 sticky 패턴 (반투명 + backdrop-blur). 우측에 알림 종 + 설정 */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center">
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
        <div
          className="size-14 rounded-full bg-muted flex items-center justify-center text-2xl"
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

      {/* 탭 콘텐츠 — 선택된 탭에 따라 카드 리스트 렌더 */}
      <section className="px-4 py-4 space-y-3">
        {/* 투고 탭 */}
        {tab === 'posts' &&
          (posts.length === 0 ? (
            /* 빈 상태 — 보라 글로우 이모지 + 안내 텍스트 */
            <div className="py-16 text-center space-y-3">
              <p className="text-4xl" aria-hidden>🌸</p>
              <p className="text-sm text-muted-foreground">まだ投稿がありません</p>
            </div>
          ) : (
            posts.map((p) => <MyPostCard key={p.id} post={p} />)
          ))}

        {/* 댓글 탭 */}
        {tab === 'comments' &&
          (comments.length === 0 ? (
            /* 빈 상태 — 댓글 없음 안내 */
            <div className="py-16 text-center space-y-3">
              <p className="text-4xl" aria-hidden>💬</p>
              <p className="text-sm text-muted-foreground">まだコメントがありません</p>
            </div>
          ) : (
            comments.map((c) => <MyCommentCard key={c.id} comment={c} />)
          ))}

        {/* 북마크 탭 */}
        {tab === 'bookmarks' &&
          (bookmarks.length === 0 ? (
            /* 빈 상태 — 북마크 없음 안내 */
            <div className="py-16 text-center space-y-3">
              <p className="text-4xl" aria-hidden>🔖</p>
              <p className="text-sm text-muted-foreground">まだブックマークがありません</p>
            </div>
          ) : (
            bookmarks.map((b) => <MyBookmarkCard key={b.id} bookmark={b} />)
          ))}
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
