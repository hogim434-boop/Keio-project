'use client'

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

export default function ProfilePage() {
  const [campus, setCampus] = useState('三田')
  const [department, setDepartment] = useState('経済学部')

  return (
    <div className="mx-auto max-w-[768px] px-4 py-6 space-y-6">

      {/* 페이지 헤더 */}
      <div className="space-y-0.5">
        <h1 className="text-lg font-semibold">프로필 설정</h1>
        <p className="text-sm text-muted-foreground">
          캠퍼스와 학부 정보를 수정할 수 있습니다
        </p>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 프로필 수정 폼 */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">

        {/* 캠퍼스 선택 */}
        <div className="space-y-2">
          <Label>캠퍼스</Label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger>
              <SelectValue />
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
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="예: 経済学部"
          />
        </div>

        {/* 저장 버튼 */}
        <Button type="submit" className="w-full">
          저장
        </Button>
      </form>

    </div>
  )
}
