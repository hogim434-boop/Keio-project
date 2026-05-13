'use client'

/**
 * 환영 모달 — NY 에디토리얼 스타일
 *
 * props.shouldOpen: 서버에서 profiles.onboarded_at == null 일 때만 true
 * 모달이 닫히면 markOnboarded() 서버 액션으로 onboarded_at 을 기록한다.
 * CTA 2개:
 *  - 掲示板を見る: / 로 이동
 *  - 初投稿を書く: WriteBottomSheet 띄움
 *
 * 디자인 컨셉: 흑백 고대비, 굵은 보더, 미니멀 4층 구조, 스태거 페이드인.
 * 키프레임은 app/globals.css 의 welcome-modal-in/out + welcome-stagger-in 사용.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { markOnboarded } from '@/lib/community/onboarding'
import { useWriteSheet } from '@/lib/stores/write-sheet-store'

// ─────────────────────────────────────────────────────────────────────────────
// 🚧 임시 개발 플래그 (TEMP — 추후 제거)
// ─────────────────────────────────────────────────────────────────────────────
// true  : 페이지 진입(새로고침)마다 모달 강제 표시. markOnboarded() 호출 안 함.
//         → DB(profiles.onboarded_at)·외부 컴포넌트 영향 없음. 격리된 임시 모드.
// false : 정상 동작 — props.shouldOpen 에 따라 1회만 표시 + DB 기록.
// 되돌리려면 이 const 를 false 로 바꾸거나, 이 블록과 아래 분기 2곳을 삭제하세요.
// ─────────────────────────────────────────────────────────────────────────────
const TEMP_ALWAYS_OPEN = true

// 스태거 애니메이션 공통 클래스 — 초기 opacity 0, animation 으로 페이드인
// data-welcome-stagger 는 prefers-reduced-motion 가드와 매칭됨 (globals.css)
const STAGGER_BASE =
  'opacity-0 [animation:welcome-stagger-in_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]'

export function WelcomeModal({
  shouldOpen,
  nickname,
}: {
  shouldOpen: boolean
  nickname: string | null
}) {
  // shouldOpen 은 서버에서 결정되므로 mount 후 변하지 않음 → 초기값으로 즉시 반영
  // TEMP_ALWAYS_OPEN=true 면 shouldOpen 무시하고 무조건 열린 상태로 시작
  const [open, setOpen] = useState(TEMP_ALWAYS_OPEN ? true : shouldOpen)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const openWriteSheet = useWriteSheet((s) => s.open)
  const reduceMotion = useReducedMotion()

  // 닫힐 때마다 서버에 기록 (이미 기록돼 있어도 멱등)
  // TEMP_ALWAYS_OPEN=true 면 DB 기록을 건너뛰어, 다음 새로고침에도 다시 뜨게 함
  function handleClose() {
    setOpen(false)
    if (TEMP_ALWAYS_OPEN) return
    startTransition(() => {
      void markOnboarded()
    })
  }

  function handleExploreClick() {
    handleClose()
    router.push('/')
  }

  function handleWriteClick() {
    handleClose()
    // 모달 닫힘 애니메이션 후 시트 열기
    setTimeout(() => openWriteSheet(), 200)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
    >
      <DialogContent
        data-welcome-modal
        className={[
          // 레이아웃 — 패딩은 내부 div 에서 제어
          'sm:max-w-md p-0 overflow-hidden',
          // 시그니처 보더 — 굵은 흑백 에디토리얼 프레임
          'rounded-2xl border-2 border-foreground/90',
          // 그림자는 절제 (NY 스타일은 과한 shadow 안 씀)
          'shadow-xl shadow-foreground/5',
          // ⚠️ shadcn dialog.tsx 의 기본 클래스(data-open:animate-in fade-in-0 zoom-in-95)와
          //    같은 prefix(data-open:/data-closed:)로 덮어써야 tailwind-merge 가 작동.
          //    다른 prefix(data-[state=open]:) 쓰면 둘 다 적용돼 transform 충돌 → 모달 위치 어긋남.
          //    fill-mode forwards 로 animation 종료 시점에 to-state(translate -50% -50%) 고정.
          'data-open:animate-[welcome-modal-in_0.55s_cubic-bezier(0.22,1,0.36,1)_forwards]',
          'data-closed:animate-[welcome-modal-out_0.25s_cubic-bezier(0.22,1,0.36,1)_forwards]',
          // 닫기 버튼(shadcn 기본) 위치 미세 조정
          '[&>button:last-child]:top-4 [&>button:last-child]:right-4',
        ].join(' ')}
      >
        <div className="px-8 pt-9 pb-7">
          <DialogHeader className="space-y-4 text-left">
            {/* 1. Eyebrow — KEIO ONLY 라벨 + 좌측 짧은 가로선 */}
            <div
              data-welcome-stagger
              className={`${STAGGER_BASE} [animation-delay:0ms] flex items-center gap-2.5`}
            >
              <span aria-hidden className="block h-px w-5 bg-foreground/50" />
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-foreground/70">
                Keio Only
              </span>
            </div>

            {/* 2. 타이틀 — 굵고 큰 에디토리얼 헤드라인
                 nickname 있으면 「ようこそ、{nickname}さん。」, 없으면 「ようこそ。」 */}
            <DialogTitle
              data-welcome-stagger
              className={`${STAGGER_BASE} [animation-delay:100ms] text-[2.25rem] leading-[1.05] font-bold tracking-tight`}
            >
              {nickname ? (
                <>
                  ようこそ、
                  <br className="sm:hidden" />
                  <span className="text-foreground">{nickname}</span>
                  <span className="text-foreground">さん</span>。
                </>
              ) : (
                'ようこそ。'
              )}
            </DialogTitle>

            {/* 3. 서브타이틀 — 한 줄, muted */}
            <DialogDescription
              data-welcome-stagger
              className={`${STAGGER_BASE} [animation-delay:200ms] text-sm text-muted-foreground leading-relaxed`}
            >
              慶應生だけのコミュニティ。
            </DialogDescription>
          </DialogHeader>

          {/* 4. CTA — 좌 ghost / 우 solid + 화살표 */}
          <DialogFooter
            data-welcome-stagger
            className={`${STAGGER_BASE} [animation-delay:320ms] mt-8 flex-row justify-end gap-2 sm:gap-2`}
          >
            <motion.div
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <Button
                variant="ghost"
                onClick={handleExploreClick}
                className="rounded-full px-5 text-foreground/70 hover:text-foreground hover:bg-transparent"
              >
                掲示板を見る
              </Button>
            </motion.div>

            <motion.div
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="group"
            >
              <Button
                onClick={handleWriteClick}
                className="rounded-full pl-5 pr-4 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                初投稿を書く
                <ArrowRight
                  size={16}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Button>
            </motion.div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
