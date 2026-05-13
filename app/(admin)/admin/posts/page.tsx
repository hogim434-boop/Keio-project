/**
 * 어드민 게시물 관리 페이지 (Server Component)
 *
 * 탭:
 *   - 予約待ち (scheduled): published_at > now()
 *   - 公開済み (published): published_at <= now()
 *
 * 행별 액션:
 *   - 予約待ち → 즉시 발행 (publishNowAction) / 削除
 *   - 公開済み → 削除
 *
 * RLS posts_select_admin (is_admin()) 이 미발행 게시물 가시화를 보장.
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { publishNowAction, softDeletePostAction } from './_actions/manage-posts'

export const dynamic = 'force-dynamic'

type Tab = 'scheduled' | 'published'

interface PostRow {
  id: string
  title: string
  body: string
  is_anonymous: boolean
  published_at: string
  created_at: string
  category: { name: string | null; slug: string | null } | null
  author: { nickname: string | null; email: string | null } | null
}

function formatJst(iso: string): string {
  // 일본 시간(JST) 기준으로 표시
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(iso))
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab: Tab = sp.tab === 'published' ? 'published' : 'scheduled'

  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  let q = supabase
    .from('posts')
    .select(
      `id, title, body, is_anonymous, published_at, created_at,
       category:categories(name, slug),
       author:profiles(nickname, email)`,
    )
    .eq('is_deleted', false)
    .limit(50)

  if (tab === 'scheduled') {
    q = q.gt('published_at', nowIso).order('published_at', { ascending: true })
  } else {
    q = q.lte('published_at', nowIso).order('published_at', { ascending: false })
  }

  const { data, error } = await q
  if (error) throw error

  const posts = (data ?? []) as unknown as PostRow[]

  return (
    <div className="mx-auto max-w-[768px] px-4 py-4">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">投稿管理</h1>
        <Link href="/admin/posts/new">
          <Button size="sm">+ 新規投稿</Button>
        </Link>
      </div>

      {/* 탭 */}
      <div className="mb-4">
        <div
          className="flex gap-1 rounded-full bg-muted p-1"
          role="tablist"
          aria-label="投稿フィルター"
        >
          <Link
            href="/admin/posts?tab=scheduled"
            role="tab"
            aria-selected={tab === 'scheduled'}
            className={cn(
              'flex-1 min-h-[36px] py-2 text-sm font-medium rounded-full text-center transition-colors',
              tab === 'scheduled'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            予約待ち
          </Link>
          <Link
            href="/admin/posts?tab=published"
            role="tab"
            aria-selected={tab === 'published'}
            className={cn(
              'flex-1 min-h-[36px] py-2 text-sm font-medium rounded-full text-center transition-colors',
              tab === 'published'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            公開済み
          </Link>
        </div>
      </div>

      {/* 목록 */}
      {posts.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {tab === 'scheduled' ? '予約中の投稿はありません' : '公開済みの投稿はありません'}
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              {/* 메타 */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {p.category?.name ?? '—'}
                </span>
                <span>
                  {p.author?.nickname ?? '(無名)'}
                  {p.author?.email ? ` (${p.author.email})` : ''}
                </span>
                {p.is_anonymous && (
                  <span className="rounded-full border border-border px-2 py-0.5">
                    匿名
                  </span>
                )}
              </div>

              {/* 본문 */}
              <h2 className="text-base font-semibold leading-tight">{p.title}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {p.body}
              </p>

              {/* 시각 */}
              <div className="text-xs text-muted-foreground">
                {tab === 'scheduled' ? '公開予定: ' : '公開: '}
                {formatJst(p.published_at)} JST
              </div>

              {/* 액션 */}
              <div className="flex gap-2 pt-1">
                {tab === 'scheduled' && (
                  <form action={publishNowAction}>
                    <input type="hidden" name="post_id" value={p.id} />
                    <Button type="submit" size="sm" variant="default">
                      今すぐ公開
                    </Button>
                  </form>
                )}
                <form action={softDeletePostAction}>
                  <input type="hidden" name="post_id" value={p.id} />
                  <Button type="submit" size="sm" variant="outline">
                    削除
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
