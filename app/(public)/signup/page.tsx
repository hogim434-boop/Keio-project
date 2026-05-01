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
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="text-sm text-muted-foreground">
          게이오 재학생 전용 플랫폼입니다
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
            placeholder="8자 이상 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>캠퍼스</Label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger>
              <SelectValue placeholder="캠퍼스 선택" />
            </SelectTrigger>
            <SelectContent>
              {CAMPUSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">학부</Label>
          <Input
            id="department"
            placeholder="예: 経済学部"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full">
          가입하기
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary underline underline-offset-4">
          로그인
        </Link>
      </p>
    </div>
  )
}
