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
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <PenLine size={22} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>리뷰 작성</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-4 space-y-5 px-1 pb-6"
        >
          {AXES.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-sm">{label}</Label>
              <StarRatingInput
                value={ratings[key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="comment">코멘트</Label>
            <Textarea
              id="comment"
              placeholder="수업에 대한 감상을 자유롭게 적어주세요 (최대 1000자)"
              maxLength={1000}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {comment.length}/1000
            </p>
          </div>

          <Button type="submit" className="w-full">
            리뷰 등록
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
