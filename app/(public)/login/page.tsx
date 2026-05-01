'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    /* 페이지 전체 컨테이너 - 상하 중앙 정렬 */
    <div className="min-h-[calc(100dvh-56px)] flex flex-col justify-center mx-auto max-w-sm px-6">

      {/* 헤더 영역 - 좌측 정렬 */}
      <h1 className="text-3xl font-bold mb-8">로그인</h1>

      {/* 로그인 폼 */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">

        {/* 이메일 입력 */}
        <div className="space-y-2">
          <Label htmlFor="email">메일 주소</Label>
          <Input
            id="email"
            type="email"
            placeholder="xxx@keio.jp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* 로그인 버튼 */}
        <Button type="submit" className="w-full rounded-full h-12 mt-2">
          로그인
        </Button>
      </form>

      {/* 구분선 */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 회원가입 링크 */}
      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
        >
          회원가입
        </Link>
      </p>
    </div>
  )
}
