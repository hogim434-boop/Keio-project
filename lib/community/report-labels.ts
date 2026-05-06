/**
 * 신고 사유 일본어 라벨 매핑 — 공용 모듈
 *
 * report-sheet (사용자 신고 시트) + 어드민 신고 큐 양쪽에서 재사용.
 * DB CHECK 제약(reports.reason IN ('abuse','defamation','spam','illegal')) 와 1:1 매핑.
 */

import type { ReportReason } from '@/types/community'

/** 신고 사유 라벨 배열 — UI 라디오/select 옵션용 */
export const REPORT_REASONS = [
  { value: 'abuse',      label: '暴言・誹謗中傷' },
  { value: 'defamation', label: '名誉毀損' },
  { value: 'spam',       label: 'スパム' },
  { value: 'illegal',    label: '違法・不適切なコンテンツ' },
] as const satisfies ReadonlyArray<{ value: ReportReason; label: string }>

/** value → label 매핑 — 어드민 큐에서 reason 코드로 라벨 조회 시 사용 */
export const REPORT_REASON_LABEL: Record<ReportReason, string> =
  Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label])) as Record<
    ReportReason,
    string
  >
