'use client'

/**
 * useAutoLogout — 비활성 감지 + 자동 로그아웃 트리거 훅
 *
 * - 마지막 활동 시각을 localStorage에 기록해 멀티 탭 동기화
 * - 60초 간격으로 만료 여부 검사, 만료 시 onIdle() 콜백 호출
 * - 사파리 프라이빗 모드(localStorage 차단) 대비 try/catch 처리
 * - 마운트 시 즉시 만료 검사 (백그라운드 30분 후 새로고침 케이스 대응)
 * - 컴포넌트 언마운트 시 모든 리스너 + interval 해제
 */

import { useEffect, useRef } from 'react'

/** 비활성 임계값: 30분 */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000

/** 만료 검사 주기: 1분 */
const CHECK_INTERVAL_MS = 60 * 1000

/** 활동 기록 throttle 간격: 1초 (잦은 localStorage 쓰기 방지) */
const ACTIVITY_THROTTLE_MS = 1000

/** localStorage 저장 키 */
const STORAGE_KEY = 'jukulog:last-activity'

/**
 * 현재 시각을 localStorage에 기록한다.
 * localStorage를 사용할 수 없는 환경(사파리 프라이빗 모드 등)은 조용히 무시.
 */
function recordActivity(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {
    // localStorage 접근 불가 환경에서는 무시
  }
}

/**
 * localStorage에서 마지막 활동 시각을 읽는다.
 * 값이 없거나 읽기 실패 시 null 반환.
 */
function readLastActivity(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

/**
 * 마지막 활동 시각 기준으로 만료 여부를 반환한다.
 *
 * @param lastActivity - 마지막 활동 시각 (Date.now() 값), null이면 만료로 처리하지 않음
 */
function isExpired(lastActivity: number | null): boolean {
  // 기록 자체가 없으면(첫 마운트) 만료로 보지 않는다
  if (lastActivity === null) return false
  return Date.now() - lastActivity > IDLE_TIMEOUT_MS
}

/**
 * 비활성 감지 훅.
 *
 * @param onIdle - 비활성 만료 시 호출할 콜백 (signOut + 리다이렉트 처리 담당)
 */
export function useAutoLogout(onIdle: () => void): void {
  /**
   * onIdle을 ref로 보관한다.
   * 이렇게 하면 onIdle이 매 렌더마다 새 함수 인스턴스로 바뀌어도
   * useEffect를 재실행하지 않아도 최신 콜백을 항상 호출할 수 있다.
   *
   * React 19에서는 렌더 중 ref 할당이 금지되므로 useEffect 안에서 동기화한다.
   */
  const onIdleRef = useRef(onIdle)
  useEffect(() => {
    onIdleRef.current = onIdle
  })

  /** throttle 제어용: 마지막 localStorage 쓰기 시각 */
  const lastWriteRef = useRef<number>(0)

  /** 이미 로그아웃이 실행됐는지 추적 (중복 호출 방지) */
  const firedRef = useRef(false)

  useEffect(() => {
    // ── 만료 검사 헬퍼 ──────────────────────────────────────
    function checkAndFire(): void {
      // 이미 로그아웃이 실행됐으면 중복 호출 방지
      if (firedRef.current) return
      if (isExpired(readLastActivity())) {
        firedRef.current = true
        onIdleRef.current()
      }
    }

    // ── 마운트 직후 즉시 검사 ────────────────────────────────
    // 백그라운드에서 30분 이상 경과 후 새로고침하는 케이스 대응
    checkAndFire()

    // ── 활동 이벤트 핸들러 (throttle 적용) ─────────────────
    function handleActivity(): void {
      const now = Date.now()
      // ACTIVITY_THROTTLE_MS(1초) 이내 중복 기록은 건너뜀
      if (now - lastWriteRef.current < ACTIVITY_THROTTLE_MS) return
      lastWriteRef.current = now
      recordActivity()
    }

    // 첫 활동 기록 (마운트 시점에 한 번 — 기록이 없으면 30분 카운트 기준점 생성)
    const existingActivity = readLastActivity()
    if (existingActivity === null) {
      recordActivity()
      lastWriteRef.current = Date.now()
    }

    // ── storage 이벤트 핸들러 (다른 탭의 활동 동기화) ──────
    // 같은 origin의 다른 탭이 localStorage를 갱신하면 이 탭에서도 감지된다.
    function handleStorageEvent(event: StorageEvent): void {
      // 관련 키 변경이 아니면 무시
      if (event.key !== STORAGE_KEY) return
      // 다른 탭의 활동이 감지되면 만료 검사 재실행 (타이머 리셋 효과)
      checkAndFire()
    }

    // ── 이벤트 리스너 등록 ───────────────────────────────────
    const ACTIVITY_EVENTS = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'visibilitychange',
    ] as const

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }
    window.addEventListener('storage', handleStorageEvent)

    // ── 60초 간격 만료 검사 ──────────────────────────────────
    const intervalId = setInterval(checkAndFire, CHECK_INTERVAL_MS)

    // ── cleanup: 언마운트 시 모든 리스너 + interval 해제 ───
    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity)
      }
      window.removeEventListener('storage', handleStorageEvent)
      clearInterval(intervalId)
    }
  }, []) // onIdle은 ref로 관리하므로 의존성 배열 불필요
}
