'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CAMPUSES = ['三田', '日吉', 'SFC'] as const

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [campus, setCampus] = useState('')
  const [department, setDepartment] = useState('')

  return (
    /* 페이지 전체 컨테이너 - 상하 중앙 정렬 */
    <div className="min-h-[calc(100dvh-56px)] flex flex-col justify-center mx-auto max-w-sm px-6 py-8">

      {/* 헤더 영역 - 좌측 정렬 */}
      <h1 className="text-3xl font-bold mb-8">회원가입</h1>

      {/* 회원가입 폼 */}
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
            placeholder="8자 이상 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* 캠퍼스 선택 */}
        <div className="space-y-2">
          <Label>캠퍼스</Label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger className="rounded-full bg-muted border-0 h-12 px-5">
              <SelectValue placeholder="캠퍼스 선택" />
            </SelectTrigger>
            <SelectContent>
              {CAMPUSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 학부 입력 */}
        <div className="space-y-2">
          <Label htmlFor="department">학부</Label>
          <Input
            id="department"
            placeholder="예: 経済学部"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* keio.jp 이메일 안내 */}
        <p className="rounded-full bg-muted px-5 py-3 text-xs text-muted-foreground">
          keio.jp 이메일 주소만 가입 가능합니다
        </p>

        {/* 가입 버튼 */}
        <Button type="submit" className="w-full rounded-full h-12 mt-1">
          가입하기
        </Button>
      </form>

      {/* 구분선 */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 로그인 링크 */}
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
        >
          로그인
        </Link>
      </p>
    </div>
  )
}
