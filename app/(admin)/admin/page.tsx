'use client'

import { useRef, useState } from 'react'
import { Upload, Plus, Trash2, Pencil } from 'lucide-react'
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
    <div className="mx-auto max-w-[768px] px-4 py-6 space-y-6">

      {/* ───── 강의 등록 섹션 ───── */}
      <section className="rounded-xl border border-border overflow-hidden">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <Plus size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">강의 등록</h2>
        </div>

        {/* 폼 영역 */}
        <div className="p-4">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
            {/* 강의명 + 교수명 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">강의명</Label>
                <Input
                  id="name"
                  placeholder="例: 経済学概論"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="professor" className="text-xs">교수명</Label>
                <Input
                  id="professor"
                  placeholder="例: 田中 誠一"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                />
              </div>
            </div>

            {/* 캠퍼스 + 학부 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">캠퍼스</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs">학부</Label>
                <Input
                  id="department"
                  placeholder="例: 経済学部"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            {/* 등록 버튼 */}
            <Button type="submit" className="w-full">
              등록
            </Button>
          </form>
        </div>
      </section>

      {/* ───── CSV 일괄 임포트 섹션 ───── */}
      <section className="rounded-xl border border-border overflow-hidden">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <Upload size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">CSV 일괄 임포트</h2>
        </div>

        {/* CSV 업로드 영역 */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2 items-center">
            {/* 숨김 파일 인풋 - 버튼으로 트리거 */}
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="flex-1 text-sm"
              aria-label="CSV 파일 선택"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              업로드
            </Button>
          </div>
          {/* CSV 형식 안내 */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            CSV 형식: 강의명, 교수명, 캠퍼스, 학부
            {/* TODO: Task 010에서 실제 CSV 파싱 로직 구현 */}
          </p>
        </div>
      </section>

      {/* ───── 강의 목록 섹션 ───── */}
      <section className="rounded-xl border border-border overflow-hidden">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">강의 목록</h2>
          <span className="text-xs text-muted-foreground">
            총 {DUMMY_COURSES.length}건
          </span>
        </div>

        {/* 강의 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                >
                  강의명
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                >
                  교수
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                >
                  캠퍼스
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground"
                >
                  리뷰
                </th>
                <th
                  scope="col"
                  className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground"
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DUMMY_COURSES.map((course) => (
                <tr
                  key={course.id}
                  className="bg-background hover:bg-muted/30 transition-colors"
                >
                  {/* 강의명 (말줄임 처리) */}
                  <td className="px-4 py-3 max-w-[130px]">
                    <span className="block truncate font-medium text-sm">
                      {course.name}
                    </span>
                  </td>
                  {/* 교수명 */}
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {course.professor}
                  </td>
                  {/* 캠퍼스 */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {course.campus}
                  </td>
                  {/* 리뷰 수 */}
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    {course.reviewCount}
                  </td>
                  {/* 수정/삭제 버튼 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        aria-label={`${course.name} 수정`}
                        onClick={() => {}}
                      >
                        {/* TODO: 수정 모달 구현 */}
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:border-destructive/50"
                        aria-label={`${course.name} 삭제`}
                        onClick={() => {}}
                      >
                        {/* TODO: 삭제 확인 다이얼로그 구현 */}
                        <Trash2 size={12} />
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
