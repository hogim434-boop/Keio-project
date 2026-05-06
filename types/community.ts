/**
 * 게시판 도메인 enum + zod 스키마 (Single Source of Truth)
 *
 * 이 파일은 다음 위치에서 import됩니다:
 *   1) Task 011 의 API 라우트 (`app/api/posts`, `comments`, `reactions`,
 *      `reports`, `bookmarks`) — z.parse 로 요청 바디 검증
 *   2) Task 012~ 의 폼 컴포넌트 (`write-bottom-sheet`, `comment-form`,
 *      `report-sheet`) — RHF + zodResolver 로 클라이언트 검증
 *   3) `lib/community/categories.ts` — CategorySlug / CategoryType 타입 import
 *
 * DB CHECK 제약 (Task 008·009 마이그레이션) 과 정확히 일치하도록 작성.
 * 검증 메시지는 일본어 (CLAUDE.md 운영 지침 — 일본인 대상 서비스).
 */

import { z } from 'zod'

// ============================================================
// 카테고리 (CategorySlug / CategoryType)
// ============================================================

/**
 * 5개 카테고리 슬러그 — 모두 topic 단일 축.
 * 2026-05-06 재편: 9개 → 5개. 캠퍼스(三田/日吉/SFC) 카테고리 제거.
 * 추가/변경 시 `lib/community/categories.ts` + 시드 마이그레이션 동시 갱신.
 */
export const CATEGORY_SLUG_VALUES = [
  'study',
  'job',
  'school-life',
  'club',
  'free',
] as const

export type CategorySlug = (typeof CATEGORY_SLUG_VALUES)[number]

export const CategorySlugSchema = z.enum(CATEGORY_SLUG_VALUES)

/**
 * 카테고리 분류축 — 현재는 topic만 사용.
 * DB CHECK 제약은 ('topic','campus') 유지 (미래 캠퍼스 분류 재도입 시 ALTER 불필요).
 * TypeScript에서 의도적으로 'campus'를 제외: 현재 캠퍼스 카테고리가 없으므로
 * 코드 레벨에서 campus를 입력할 수 없도록 타입으로 제한함.
 */
export const CATEGORY_TYPE_VALUES = ['topic'] as const

export type CategoryType = (typeof CATEGORY_TYPE_VALUES)[number]

export const CategoryTypeSchema = z.enum(CATEGORY_TYPE_VALUES)

// ============================================================
// 반응 (ReactionTargetType / ReactionKind)
// ============================================================

/** reactions.target_type CHECK in (post, comment) */
export const REACTION_TARGET_TYPE_VALUES = ['post', 'comment'] as const

export type ReactionTargetType = (typeof REACTION_TARGET_TYPE_VALUES)[number]

export const ReactionTargetTypeSchema = z.enum(REACTION_TARGET_TYPE_VALUES)

/** reactions.reaction CHECK in (up, down) */
export const REACTION_KIND_VALUES = ['up', 'down'] as const

export type ReactionKind = (typeof REACTION_KIND_VALUES)[number]

export const ReactionKindSchema = z.enum(REACTION_KIND_VALUES)

// ============================================================
// 신고 (ReportReason / ReportStatus)
// ============================================================

/** reports.reason CHECK in (abuse | defamation | spam | illegal) */
export const REPORT_REASON_VALUES = [
  'abuse',
  'defamation',
  'spam',
  'illegal',
] as const

export type ReportReason = (typeof REPORT_REASON_VALUES)[number]

export const ReportReasonSchema = z.enum(REPORT_REASON_VALUES)

/** reports.status CHECK in (pending | processed | dismissed) */
export const REPORT_STATUS_VALUES = [
  'pending',
  'processed',
  'dismissed',
] as const

export type ReportStatus = (typeof REPORT_STATUS_VALUES)[number]

export const ReportStatusSchema = z.enum(REPORT_STATUS_VALUES)

// ============================================================
// 폼 스키마 — RHF + zodResolver 용
// ============================================================

/**
 * 게시글 작성 폼 — write-bottom-sheet (Task 012) / `POST /api/posts` (Task 011)
 * DB CHECK: title 1~100자 / body 10~5000자
 */
export const PostFormSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内で入力してください'),
  body: z
    .string()
    .min(10, '本文は10文字以上入力してください')
    .max(5000, '本文は5000文字以内で入力してください'),
  categorySlug: CategorySlugSchema,
  isAnonymous: z.boolean(),
})

export type PostFormData = z.infer<typeof PostFormSchema>

/**
 * 댓글 작성 폼 — comment-form (Task 015) / `POST /api/comments` (Task 011)
 * DB CHECK: body 1~1000자, parent_id NULL 또는 같은 게시글 댓글
 */
export const CommentFormSchema = z.object({
  postId: z.string().uuid('投稿IDが正しくありません'),
  parentId: z.string().uuid('親コメントIDが正しくありません').nullable(),
  body: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(1000, 'コメントは1000文字以内で入力してください'),
  isAnonymous: z.boolean(),
})

export type CommentFormData = z.infer<typeof CommentFormSchema>

/**
 * 신고 폼 — report-sheet (Task 016) / `POST /api/reports` (Task 011)
 * DB CHECK: description NULL 또는 ≤500자
 */
export const ReportFormSchema = z.object({
  targetType: ReactionTargetTypeSchema,
  targetId: z.string().uuid('対象IDが正しくありません'),
  reason: ReportReasonSchema,
  description: z
    .string()
    .max(500, '補足説明は500文字以内で入力してください')
    .nullable()
    .optional(),
})

export type ReportFormData = z.infer<typeof ReportFormSchema>
