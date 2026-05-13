/**
 * 어드민 게시물 작성·예약 페이지 (Server Component)
 *
 * - 인증/권한은 (admin)/layout.tsx 에서 1차 가드
 * - 시드 계정(email LIKE 'seed.%')과 활성 카테고리를 SSR 로 로드
 * - PostForm 에 props 로 전달
 */

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from './_components/post-form'

export const dynamic = 'force-dynamic'

export default async function AdminNewPostPage() {
  const supabase = await createClient()

  const [seedRes, categoriesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, nickname')
      .like('email', 'seed.%')
      .order('email', { ascending: true }),
    supabase
      .from('categories')
      .select('id, slug, name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">投稿の作成・予約</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            シードアカウントで投稿を作成・予約します
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          一覧に戻る
        </Link>
      </div>

      {/* 폼 */}
      <PostForm
        seedAccounts={seedRes.data ?? []}
        categories={categoriesRes.data ?? []}
      />
    </div>
  )
}
