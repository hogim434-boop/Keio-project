/**
 * 어드민 신고 큐 페이지 — SSR (Server Component)
 *
 * 인증/권한 가드는 (admin)/layout.tsx 에서 담당. 이 페이지는 데이터 fetch만 수행.
 *
 * SSR 흐름:
 *   1. ?tab 쿼리로 'pending' / 'done' 탭 결정
 *   2. reports 테이블에서 상태별 최신 50건 조회
 *   3. 같은 target 신고 건수를 in-memory Map 으로 집계
 *   4. posts / comments batch fetch (Promise.all + .in())
 *   5. preview Map 구성 후 ReportCard 에 전달
 *
 * 탭 전환: <Link href="?tab=..."> — SSR searchParams Promise 패턴
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { ReportCard } from './_components/report-card'

/** preview Map 의 값 타입 */
interface PreviewEntry {
  title?: string
  body: string
  isDeleted: boolean
  postId?: string
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Next.js 16 — searchParams 는 Promise
  const sp = await searchParams
  const tab: 'pending' | 'done' = sp.tab === 'done' ? 'done' : 'pending'

  const supabase = await createClient()

  /* ─────────────────────────────────────
   * 1. 신고 목록 조회 (상태별 최신 50건)
   * ───────────────────────────────────── */
  const statuses = tab === 'pending' ? ['pending'] : ['processed', 'dismissed']

  const { data: rawReports, error } = await supabase
    .from('reports')
    .select('id, target_type, target_id, reason, description, status, created_at')
    .in('status', statuses)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  const reports = rawReports ?? []

  /* ─────────────────────────────────────
   * 2. 같은 target 신고 건수 in-memory 집계
   * ───────────────────────────────────── */
  const counts = new Map<string, number>()

  /** target_type:target_id 복합 키 */
  const keyOf = (r: { target_type: string; target_id: string }) =>
    `${r.target_type}:${r.target_id}`

  for (const r of reports) {
    counts.set(keyOf(r), (counts.get(keyOf(r)) ?? 0) + 1)
  }

  /* ─────────────────────────────────────
   * 3. 대상 미리보기 batch fetch
   *    posts + comments 를 Promise.all 로 병렬 조회
   * ───────────────────────────────────── */
  const postIds = [
    ...new Set(reports.filter((r) => r.target_type === 'post').map((r) => r.target_id)),
  ]
  const commentIds = [
    ...new Set(reports.filter((r) => r.target_type === 'comment').map((r) => r.target_id)),
  ]

  const [postsRes, commentsRes] = await Promise.all([
    postIds.length
      ? supabase
          .from('posts')
          .select('id, title, body, is_deleted, is_anonymous')
          .in('id', postIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; body: string; is_deleted: boolean; is_anonymous: boolean }>, error: null }),
    commentIds.length
      ? supabase
          .from('comments')
          .select('id, body, is_deleted, post_id')
          .in('id', commentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; body: string; is_deleted: boolean; post_id: string }>, error: null }),
  ])

  /* ─────────────────────────────────────
   * 4. preview Map 구성
   *    key = "target_type:target_id"
   * ───────────────────────────────────── */
  const previews = new Map<string, PreviewEntry>()

  for (const p of postsRes.data ?? []) {
    previews.set(`post:${p.id}`, {
      title: p.title,
      body: p.body,
      isDeleted: p.is_deleted,
    })
  }

  for (const c of commentsRes.data ?? []) {
    previews.set(`comment:${c.id}`, {
      body: c.body,
      isDeleted: c.is_deleted,
      postId: c.post_id,
    })
  }

  /* ─────────────────────────────────────
   * 5. 렌더
   * ───────────────────────────────────── */
  return (
    <div className="mx-auto max-w-[768px]">
      {/* 탭 헤더 — sort-toggle.tsx 의 세그먼트 스타일 패턴 차용 */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex gap-1 p-1 rounded-full bg-muted"
          role="tablist"
          aria-label="通報フィルター"
        >
          {/* 未処理 탭 */}
          <Link
            href="/admin?tab=pending"
            role="tab"
            aria-selected={tab === 'pending'}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-full text-center transition-colors min-h-[36px]',
              tab === 'pending'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            未処理
          </Link>

          {/* 処理済み 탭 */}
          <Link
            href="/admin?tab=done"
            role="tab"
            aria-selected={tab === 'done'}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-full text-center transition-colors min-h-[36px]',
              tab === 'done'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            処理済み
          </Link>
        </div>
      </div>

      {/* 신고 큐 본문 */}
      <div className="px-4 py-2 space-y-3">
        {reports.length === 0 ? (
          /* 빈 상태 메시지 */
          <div className="py-12 text-center text-sm text-muted-foreground">
            {tab === 'pending' ? '未処理の通報はありません' : '処理済みの通報はありません'}
          </div>
        ) : (
          reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              preview={previews.get(keyOf(r))}
              count={counts.get(keyOf(r)) ?? 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
