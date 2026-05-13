'use client'

/**
 * 어드민 게시물 작성·예약 폼 (Client Component)
 *
 * - 시드 계정 선택, 카테고리 선택, 익명 토글, 예약 시각 입력
 * - 빈칸 채우기 템플릿 칩으로 백지 공포(白紙恐怖) 완화
 * - useActionState 로 Server Action 결과 표시
 */

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  createScheduledPost,
  type CreatePostState,
} from '../_actions/create-post'

interface SeedAccount {
  id: string
  email: string
  nickname: string | null
}

interface CategoryItem {
  id: string
  slug: string
  name: string
}

// 빈칸 채우기 템플릿 (Phase 2 콘텐츠 전략 기반)
const TEMPLATES: { label: string; text: string }[] = [
  { label: '昼ごはん', text: '今日の学食ランチ、___円使った。みんなはどう？' },
  { label: '移動時間', text: '日吉から三田、移動時間___分。みなさんは？' },
  { label: '授業', text: '___の授業、楽単 or 鬼？ 一言で教えて' },
  { label: 'バイト', text: 'バイト探し中。___で時給___円ってアリ？' },
  { label: '教授', text: '___教授の___、単位取れた人いる？' },
  { label: 'サークル', text: '___サークル、新歓どんな感じ？' },
]

const INITIAL_STATE: CreatePostState = { ok: false }

export function PostForm({
  seedAccounts,
  categories,
}: {
  seedAccounts: SeedAccount[]
  categories: CategoryItem[]
}) {
  const [state, formAction] = useActionState(createScheduledPost, INITIAL_STATE)
  const [body, setBody] = useState('')

  return (
    <form action={formAction} className="space-y-5">
      {/* 시드 계정 선택 */}
      <div className="space-y-2">
        <Label htmlFor="user_id">投稿者（シードアカウント）</Label>
        <select
          id="user_id"
          name="user_id"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            選択してください
          </option>
          {seedAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.nickname ?? '(無名)'} — {acc.email}
            </option>
          ))}
        </select>
      </div>

      {/* カテゴリ */}
      <div className="space-y-2">
        <Label htmlFor="category_id">カテゴリ</Label>
        <select
          id="category_id"
          name="category_id"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            選択してください
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* タイトル */}
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="例: 今日の学食ランチ、みんないくら使った？"
        />
      </div>

      {/* テンプレ칩 */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          穴埋めテンプレ（クリックで本文に挿入）
        </Label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => setBody((prev) => (prev ? `${prev}\n${tpl.text}` : tpl.text))}
              className="rounded-full border border-input bg-muted/40 px-3 py-1 text-xs hover:bg-muted"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* 本文 */}
      <div className="space-y-2">
        <Label htmlFor="body">本文</Label>
        <Textarea
          id="body"
          name="body"
          required
          maxLength={5000}
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="ひとことから、どうぞ。"
        />
      </div>

      {/* 익명 */}
      <div className="flex items-center gap-2">
        <Checkbox id="is_anonymous" name="is_anonymous" defaultChecked />
        <Label htmlFor="is_anonymous" className="text-sm font-normal">
          匿名で投稿する（ニックネームを隠す）
        </Label>
      </div>

      {/* 예약 시각 */}
      <div className="space-y-2">
        <Label htmlFor="scheduled_at">
          公開予約日時
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            （空欄なら今すぐ公開）
          </span>
        </Label>
        <Input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          step={60}
        />
      </div>

      {/* 에러 메시지 */}
      {state && !state.ok && state.message && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? '送信中…' : '投稿する'}
    </Button>
  )
}
