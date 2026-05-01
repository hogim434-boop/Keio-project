'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { StarRatingInput } from '@/components/star-rating-input'
import type { DummyRatings } from '@/lib/dummy-data'

const AXES: { key: keyof DummyRatings; label: string }[] = [
  { key: 'overall', label: '総合評価' },
  { key: 'attendance', label: '出席チェック' },
  { key: 'examDifficulty', label: '試験難易度' },
  { key: 'gradingEase', label: '単位取得' },
  { key: 'teachingStyle', label: '授業スタイル' },
]

export function ReviewSheet() {
  const [ratings, setRatings] = useState<DummyRatings>({
    overall: 0,
    attendance: 0,
    examDifficulty: 0,
    gradingEase: 0,
    teachingStyle: 0,
  })
  const [comment, setComment] = useState('')

  return (
    <Sheet>
      {/* 리뷰 작성 FAB 버튼 */}
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          aria-label="리뷰 작성"
        >
          <PenLine size={22} />
        </Button>
      </SheetTrigger>

      {/* 리뷰 작성 시트 */}
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-4"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">리뷰 작성</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-2 space-y-1 pb-6"
        >
          {/* 별점 입력 섹션 */}
          <div className="space-y-1">
            {AXES.map(({ key, label }, index) => (
              <div key={key}>
                {/* 개별 평가 항목 */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm font-medium">{label}</Label>
                  <StarRatingInput
                    value={ratings[key]}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
                {/* 항목 사이 구분선 (마지막 항목 제외) */}
                {index < AXES.length - 1 && (
                  <div className="h-px bg-border" />
                )}
              </div>
            ))}
          </div>

          {/* 코멘트 입력 */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="comment">코멘트</Label>
              {/* 글자 수 카운터 */}
              <span className="text-xs text-muted-foreground">
                {comment.length}/1000
              </span>
            </div>
            <Textarea
              id="comment"
              placeholder="수업에 대한 감상을 자유롭게 적어주세요"
              maxLength={1000}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* 등록 버튼 */}
          <Button type="submit" className="w-full mt-4">
            리뷰 등록
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
