'use client'

import { useEffect, useState } from 'react'
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
import { createClient } from '@/lib/supabase/client'

const CAMPUSES = ['三田', '日吉', 'SFC'] as const
const GRADES = ['1학년', '2학년', '3학년', '4학년'] as const

export default function ProfilePage() {
  // 초기 로딩 상태
  const [initializing, setInitializing] = useState(true)

  // 사용자 기본 정보 (읽기 전용)
  const [email, setEmail] = useState('')

  // 프로필 수정 상태
  const [nickname, setNickname] = useState('')
  const [campus, setCampus] = useState('')
  const [grade, setGrade] = useState('')
  const [department, setDepartment] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // 페이지 진입 시 현재 사용자 정보 로드
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setEmail(user.email ?? '')
        setNickname(user.user_metadata?.nickname ?? '')
        setCampus(user.user_metadata?.campus ?? '')
        setGrade(user.user_metadata?.grade ?? '')
        setDepartment(user.user_metadata?.department ?? '')
      }

      setInitializing(false)
    }

    loadUser()
  }, [])

  // 프로필 저장 핸들러
  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess(false)

    if (!nickname.trim()) {
      setProfileError('닉네임을 입력해 주세요')
      return
    }
    if (!campus) {
      setProfileError('캠퍼스를 선택해 주세요')
      return
    }
    if (!grade) {
      setProfileError('학년을 선택해 주세요')
      return
    }
    if (!department.trim()) {
      setProfileError('학부를 입력해 주세요')
      return
    }

    setProfileSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { nickname, campus, grade, department },
    })

    if (error) {
      setProfileError('저장 중 오류가 발생했습니다. 다시 시도해 주세요')
    } else {
      setProfileSuccess(true)
    }
    setProfileSaving(false)
  }

  // 비밀번호 변경 핸들러
  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해 주세요')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다')
      return
    }

    setPasswordSaving(true)
    const supabase = createClient()

    // 현재 비밀번호 검증 — 재로그인으로 확인
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError('현재 비밀번호가 올바르지 않습니다')
      setPasswordSaving(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해 주세요')
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordSaving(false)
  }

  // 초기 로딩 중 스피너 표시
  if (initializing) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[768px] px-4 py-6 space-y-6">

      {/* 페이지 헤더 */}
      <div className="space-y-0.5">
        <h1 className="text-lg font-semibold">프로필 설정</h1>
        <p className="text-sm text-muted-foreground">
          닉네임, 캠퍼스, 학부 정보를 수정할 수 있습니다
        </p>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 이메일 — 읽기 전용 */}
      <div className="space-y-2">
        <Label>인증된 이메일</Label>
        <Input
          value={email}
          readOnly
          disabled
          className="bg-muted text-muted-foreground"
        />
      </div>

      {/* 프로필 수정 폼 */}
      <form onSubmit={handleProfileSave} className="space-y-5">

        {/* 닉네임 */}
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="앱에서 표시될 이름"
            autoComplete="nickname"
          />
        </div>

        {/* 캠퍼스 선택 */}
        <div className="space-y-2">
          <Label htmlFor="campus-select">캠퍼스</Label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger id="campus-select">
              <SelectValue placeholder="캠퍼스 선택" />
            </SelectTrigger>
            <SelectContent>
              {CAMPUSES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 학년 선택 */}
        <div className="space-y-2">
          <Label htmlFor="grade-select">학년</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger id="grade-select">
              <SelectValue placeholder="학년 선택" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
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

        {/* 프로필 에러 메시지 */}
        {profileError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {profileError}
          </p>
        )}

        {/* 프로필 저장 성공 메시지 */}
        {profileSuccess && (
          <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600">
            프로필이 저장되었습니다
          </p>
        )}

        {/* 프로필 저장 버튼 */}
        <Button type="submit" className="w-full" disabled={profileSaving}>
          {profileSaving ? '저장 중…' : '프로필 저장'}
        </Button>
      </form>

      {/* 구분선 */}
      <div className="h-px bg-border" />

      {/* 비밀번호 변경 섹션 */}
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">비밀번호 변경</h2>
        <p className="text-sm text-muted-foreground">
          새 비밀번호는 8자 이상이어야 합니다
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-5">

        {/* 현재 비밀번호 */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">현재 비밀번호</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호 입력"
            autoComplete="current-password"
          />
        </div>

        {/* 새 비밀번호 */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">새 비밀번호</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="8자 이상 입력"
            autoComplete="new-password"
          />
        </div>

        {/* 새 비밀번호 확인 */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">비밀번호 확인</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
          />
        </div>

        {/* 비밀번호 에러 메시지 */}
        {passwordError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {passwordError}
          </p>
        )}

        {/* 비밀번호 변경 성공 메시지 */}
        {passwordSuccess && (
          <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-600">
            비밀번호가 변경되었습니다
          </p>
        )}

        {/* 비밀번호 변경 버튼 */}
        <Button type="submit" variant="outline" className="w-full" disabled={passwordSaving}>
          {passwordSaving ? '변경 중…' : '비밀번호 변경'}
        </Button>
      </form>

    </div>
  )
}
