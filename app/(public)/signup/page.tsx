'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
import { AuthHeader } from '../_components/auth-header'

const CAMPUSES = ['三田', '日吉', 'SFC'] as const
const GRADES = ['1학년', '2학년', '3학년', '4학년'] as const

// 단계 슬라이드 전환: 앞으로(dir=1)는 오른쪽에서 진입/왼쪽으로 퇴장, 뒤로(dir=-1)는 반대
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const formContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const field = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function ProgressBar({ active }: { active: boolean }) {
  return (
    <div
      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
        active ? 'bg-foreground' : 'bg-muted'
      }`}
    />
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [campus, setCampus] = useState('')
  const [grade, setGrade] = useState('')
  const [department, setDepartment] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [direction, setDirection] = useState(1)
  const shouldReduce = useReducedMotion()

  function goNext() {
    setDirection(1)
    setStep(2)
  }

  function goBack() {
    setDirection(-1)
    setStep(1)
  }

  // shouldReduce일 때도 enter/center/exit 키가 존재해야 AnimatePresence가 안전하게 동작
  const sv = shouldReduce
    ? { enter: {}, center: {}, exit: {} }
    : slideVariants

  return (
    <div className="flex flex-col min-h-dvh">
      <AuthHeader />

      <div className="flex-1 flex flex-col justify-center mx-auto max-w-sm w-full px-6 py-8 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={direction}
              variants={sv}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* 진행 표시 */}
              <div className="flex gap-1.5 mb-8">
                <ProgressBar active={true} />
                <ProgressBar active={false} />
              </div>

              <motion.h1
                initial={shouldReduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl font-bold mb-8"
              >
                회원가입
              </motion.h1>

              <motion.form
                variants={shouldReduce ? {} : formContainer}
                initial="hidden"
                animate="visible"
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4"
              >
                <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
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
                </motion.div>

                <motion.div variants={shouldReduce ? {} : field}>
                  <motion.div
                    whileHover={shouldReduce ? {} : { scale: 1.02 }}
                    whileTap={shouldReduce ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      type="button"
                      onClick={goNext}
                      className="w-full rounded-full h-12 mt-2"
                    >
                      다음
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>

              <motion.div
                initial={shouldReduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="my-6 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">또는</span>
                <div className="h-px flex-1 bg-border" />
              </motion.div>

              <motion.p
                initial={shouldReduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-center text-sm text-muted-foreground"
              >
                이미 계정이 있으신가요?{' '}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
                >
                  로그인
                </Link>
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              custom={direction}
              variants={sv}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* 진행 표시 */}
              <div className="flex gap-1.5 mb-8">
                <ProgressBar active={true} />
                <ProgressBar active={true} />
              </div>

              {/* 뒤로 + 제목 */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  ← 뒤로
                </button>
                <motion.h1
                  initial={shouldReduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl font-bold"
                >
                  추가 정보
                </motion.h1>
              </div>

              <motion.form
                variants={shouldReduce ? {} : formContainer}
                initial="hidden"
                animate="visible"
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4"
              >
                {/* 캠퍼스 */}
                <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
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
                </motion.div>

                {/* 학년 */}
                <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
                  <Label>학년</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="rounded-full bg-muted border-0 h-12 px-5">
                      <SelectValue placeholder="학년 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* 학부 */}
                <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
                  <Label htmlFor="department">학부</Label>
                  <Input
                    id="department"
                    placeholder="예: 経済学部"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </motion.div>

                {/* 비밀번호 */}
                <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
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
                </motion.div>

                {/* 비밀번호 확인 */}
                <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="rounded-full bg-muted border-0 h-12 px-5 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </motion.div>

                {/* keio.jp 안내 */}
                <motion.div variants={shouldReduce ? {} : field}>
                  <p className="rounded-full bg-muted px-5 py-3 text-xs text-muted-foreground">
                    keio.jp 이메일 주소만 가입 가능합니다
                  </p>
                </motion.div>

                {/* 가입하기 버튼 */}
                <motion.div variants={shouldReduce ? {} : field}>
                  <motion.div
                    whileHover={shouldReduce ? {} : { scale: 1.02 }}
                    whileTap={shouldReduce ? {} : { scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button type="submit" className="w-full rounded-full h-12 mt-1">
                      가입하기
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
