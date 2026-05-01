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
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-sm text-muted-foreground">
          keio.jp 이메일로 로그인하세요
        </p>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">메일 주소</Label>
          <Input
            id="email"
            type="email"
            placeholder="xxx@keio.jp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full">
          로그인
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-primary underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </div>
  )
}
