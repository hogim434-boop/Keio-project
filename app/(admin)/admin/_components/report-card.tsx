/**
 * 신고 카드 컴포넌트 — Server-friendly (클라이언트 전환 불필요)
 *
 * 1행: 대상 타입 뱃지 + 사유 뱃지 + 복수 신고 건수 뱃지 + 접수 시각
 * 2행: 대상 미리보기 (삭제됨 / 게시글 제목·본문 / 댓글 본문)
 * 3행: 신고자 보충 설명 (있을 때만)
 * 4행: pending 상태에서만 ReportActions 표시 / 처리 완료 상태는 텍스트 표시
 *
 * ReportActions 만 Client Component — 나머지는 순수 Server-compatible 렌더.
 */

import { ReportActions } from './report-actions'
import { REPORT_REASON_LABEL } from '@/lib/community/report-labels'
import { formatJstDateTime } from '@/lib/locale/date'
import type { ReportReason } from '@/types/community'

interface ReportCardProps {
  report: {
    id: string
    target_type: string
    target_id: string
    reason: string
    description: string | null
    status: string
    created_at: string
  }
  preview?: {
    title?: string
    body: string
    isDeleted: boolean
    postId?: string
  }
  /** 같은 target 에 대한 신고 건수 (in-memory 집계) */
  count: number
}

export function ReportCard({ report, preview, count }: ReportCardProps) {
  return (
    <article className="border rounded-lg p-4 bg-card space-y-3">
      {/* 1행: 대상 타입 + 사유 + 복수 신고 건수 + 접수 시각 */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* 대상 타입 뱃지 */}
        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {report.target_type === 'post' ? '投稿' : 'コメント'}
        </span>

        {/* 신고 사유 뱃지 */}
        <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
          {REPORT_REASON_LABEL[report.reason as ReportReason] ?? report.reason}
        </span>

        {/* 복수 신고 건수 뱃지 — 2건 이상일 때만 표시 */}
        {count > 1 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
            通報 {count} 件
          </span>
        )}

        {/* 접수 시각 — 우측 정렬 */}
        <span className="ml-auto text-muted-foreground">
          {formatJstDateTime(report.created_at)}
        </span>
      </div>

      {/* 2행: 대상 미리보기 */}
      <div className="text-sm">
        {!preview ? (
          /* 미리보기 취득 실패 */
          <p className="text-muted-foreground italic">プレビュー取得失敗</p>
        ) : preview.isDeleted ? (
          /* 이미 삭제된 콘텐츠 */
          <p className="text-muted-foreground italic">[削除済み]</p>
        ) : report.target_type === 'post' ? (
          /* 게시글 미리보기 — 제목 + 본문 2줄 */
          <div className="space-y-1">
            {preview.title && (
              <h3 className="font-semibold line-clamp-1">{preview.title}</h3>
            )}
            <p className="text-muted-foreground line-clamp-2 whitespace-pre-wrap">
              {preview.body}
            </p>
          </div>
        ) : (
          /* 댓글 미리보기 — 1줄 */
          <p className="line-clamp-1 whitespace-pre-wrap">{preview.body}</p>
        )}
      </div>

      {/* 3행: 신고자 보충 설명 (있을 때만) */}
      {report.description && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 line-clamp-3 whitespace-pre-wrap">
          {report.description}
        </div>
      )}

      {/* 4행: 처리 액션 or 처리 완료 표시 */}
      {report.status === 'pending' ? (
        <ReportActions reportId={report.id} />
      ) : (
        <div className="text-xs text-muted-foreground">
          {report.status === 'processed' ? '✅ 削除済み' : '⏭️ 棄却済み'}
        </div>
      )}
    </article>
  )
}
