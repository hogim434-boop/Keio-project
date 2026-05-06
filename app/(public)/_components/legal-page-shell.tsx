/**
 * LegalPageShell — 법적 정적 페이지 (가이드라인 / 이용약관 / 개인정보처리방침) 공용 layout shell.
 *
 * - Server Component (정적 콘텐츠 — prefetch 친화)
 * - 헤더(AuthHeader) 재사용 — 「KEIO SHARE」 로고 + 「← 戻る」 패턴 일관
 * - 본문은 max-w-2xl + space-y-6 + leading-relaxed 로 모바일 가독성 우선
 * - 향후 약관 추가(쿠키 정책 등) 시 재사용
 */

import { AuthHeader } from './auth-header'

interface LegalPageShellProps {
  /** 페이지 타이틀 — 일본어 (예: 「コミュニティガイドライン」) */
  title: string
  /** 최종 갱신 일자 — 일본어 (예: 「2026年5月8日」) */
  lastUpdated: string
  /** 본문 콘텐츠 — section/h2/p/ul 등 직접 작성 */
  children: React.ReactNode
}

export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="min-h-dvh">
      <AuthHeader />
      <article className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">最終更新: {lastUpdated}</p>
        <div className="space-y-6 text-base leading-relaxed">
          {children}
        </div>
      </article>
    </div>
  )
}
