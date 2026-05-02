'use client'

// 게시글 작성 시트 컴포넌트 (FAB 버튼 + 하단 슬라이드 시트)
import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function PostComposeSheet() {
  // 제목 입력 상태
  const [title, setTitle] = useState('')
  // 본문 입력 상태
  const [body, setBody] = useState('')

  return (
    <Sheet>
      {/* 게시글 작성 FAB 버튼 - 화면 우하단 고정 */}
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          aria-label="게시글 작성"
        >
          <PenLine size={22} />
        </Button>
      </SheetTrigger>

      {/* 게시글 작성 시트 - 하단에서 슬라이드 업 */}
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-4"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">게시글 작성</SheetTitle>
        </SheetHeader>

        {/* TODO: 실제 게시글 등록 로직 구현 필요 */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-2 space-y-4 pb-6"
        >
          {/* 제목 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-title">제목</Label>
              {/* 제목 글자 수 카운터 */}
              <span className="text-xs text-muted-foreground">
                {title.length}/100
              </span>
            </div>
            <Input
              id="post-title"
              placeholder="제목을 입력해주세요"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 본문 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-body">본문</Label>
              {/* 본문 글자 수 카운터 */}
              <span className="text-xs text-muted-foreground">
                {body.length}/2000
              </span>
            </div>
            <Textarea
              id="post-body"
              placeholder="내용을 자유롭게 적어주세요"
              maxLength={2000}
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* 게시글 등록 버튼 */}
          <Button type="submit" className="w-full mt-4">
            게시글 등록
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
