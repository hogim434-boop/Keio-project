'use client'

import { useRef, useState } from 'react'
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
import { DUMMY_COURSES } from '@/lib/dummy-data'

const CAMPUSES = ['三田', '日吉', 'SFC'] as const

export default function AdminPage() {
  const [name, setName] = useState('')
  const [professor, setProfessor] = useState('')
  const [campus, setCampus] = useState('')
  const [department, setDepartment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mx-auto max-w-[768px] px-4 py-6 space-y-8">

      <section className="space-y-4">
        <h2 className="text-base font-semibold">강의 등록</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">강의명</Label>
              <Input
                id="name"
                placeholder="例: 経済学概論"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="professor">교수명</Label>
              <Input
                id="professor"
                placeholder="例: 田中 誠一"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>캠퍼스</Label>
              <Select value={campus} onValueChange={setCampus}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="department">학부</Label>
              <Input
                id="department"
                placeholder="例: 経済学部"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">등록</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">CSV 일괄 임포트</h2>
        <div className="flex gap-2 items-center">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="flex-1 text-sm"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            업로드
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          CSV 형식: 강의명, 교수명, 캠퍼스, 학부 (실제 파싱은 Task 010에서 구현)
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          강의 목록 ({DUMMY_COURSES.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">강의명</th>
                <th className="px-3 py-2 text-left font-medium">교수</th>
                <th className="px-3 py-2 text-left font-medium">캠퍼스</th>
                <th className="px-3 py-2 text-right font-medium">리뷰</th>
                <th className="px-3 py-2 text-center font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_COURSES.map((course, i) => (
                <tr
                  key={course.id}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                >
                  <td className="px-3 py-2 max-w-[120px] truncate">
                    {course.name}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {course.professor}
                  </td>
                  <td className="px-3 py-2">{course.campus}</td>
                  <td className="px-3 py-2 text-right">{course.reviewCount}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                        수정
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive">
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
