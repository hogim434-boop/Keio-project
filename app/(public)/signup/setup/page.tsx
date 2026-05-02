'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
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
import { AuthHeader } from '../../_components/auth-header'
import { createClient } from '@/lib/supabase/client'

const CAMPUSES = ['三田', '日吉', 'SFC'] as const
const GRADES = ['1학년', '2학년', '3학년', '4학년'] as const

const pageContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const formContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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

export default function SetupPage() {
  const router = useRouter()
  const shouldReduce = useReducedMotion()

  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [campus, setCampus] = useState('')
  const [grade, setGrade] = useState('')
  const [department, setDepartment] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // 페이지 진입 시 세션 확인
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/signup')
        return
      }
      // 이미 설정 완료된 사용자
      if (user.user_metadata?.password_set === true) {
        router.replace('/courses')
        return
      }

      setVerifiedEmail(user.email ?? '')
      setInitializing(false)
    }
    checkSession()
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 8) {
      setErrorMsg('비밀번호는 8자 이상이어야 합니다')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다')
      return
    }
    if (!campus) {
      setErrorMsg('캠퍼스를 선택해 주세요')
      return
    }
    if (!grade) {
      setErrorMsg('학년을 선택해 주세요')
      return
    }
    if (!department.trim()) {
      setErrorMsg('학부를 입력해 주세요')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        password_set: true,
        campus,
        grade,
        department,
      },
    })

    if (error) {
      setErrorMsg('오류가 발생했습니다. 다시 시도해 주세요')
      setSubmitting(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/login')
  }

  // 세션 확인 중 로딩 스피너
  if (initializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <AuthHeader />

      <motion.div
        variants={shouldReduce ? {} : pageContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col justify-center mx-auto max-w-sm w-full px-6 py-8"
      >
        {/* 진행 표시 (2/2) */}
        <motion.div variants={shouldReduce ? {} : fadeUp} className="flex gap-1.5 mb-8">
          <ProgressBar active={true} />
          <ProgressBar active={true} />
        </motion.div>

        {/* 제목 */}
        <motion.h1
          variants={shouldReduce ? {} : fadeUp}
          className="text-3xl font-bold mb-8"
        >
          계정 설정
        </motion.h1>

        <motion.form
          variants={shouldReduce ? {} : formContainer}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* 인증된 keio.jp 이메일 표시 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label>인증된 keio.jp 이메일</Label>
            <div className="flex h-12 items-center gap-3 rounded-full bg-muted px-5">
              <CheckCircle2 size={16} className="shrink-0 text-green-500" />
              <span className="truncate text-sm font-medium">{verifiedEmail}</span>
            </div>
          </motion.div>

          {/* 비밀번호 설정 */}
          <motion.div variants={shouldReduce ? {} : field} className="space-y-2">
            <Label htmlFor="password">비밀번호 설정</Label>
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

          {/* 에러 메시지 */}
          {errorMsg && (
            <motion.p
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-destructive/10 px-5 py-3 text-center text-sm text-destructive"
            >
              {errorMsg}
            </motion.p>
          )}

          {/* 가입하기 버튼 */}
          <motion.div variants={shouldReduce ? {} : field}>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.02 }}
              whileTap={shouldReduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full h-12 mt-1"
              >
                {submitting ? '처리 중…' : '가입하기'}
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  )
}
