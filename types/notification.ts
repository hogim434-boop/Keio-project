/**
 * 알림 도메인 enum + zod 스키마 (Single Source of Truth)
 *
 * 이 파일은 다음 위치에서 import됩니다:
 *   1) `app/api/notifications/route.ts` — PATCH 요청 바디 검증
 *   2) `lib/notifications/server.ts` — fetchNotifications 반환 타입
 *   3) Phase 3~ 의 UI 컴포넌트 — NotificationListItem 타입 참조
 *
 * DB CHECK 제약 (Phase 1 마이그레이션) 과 정확히 일치하도록 작성.
 * 오류 메시지는 일본어 (CLAUDE.md 운영 지침 — 일본인 대상 서비스).
 */

import { z } from 'zod'

// ============================================================
// 알림 타입 (NotificationType)
// ============================================================

/**
 * notifications.type CHECK in ('comment','reply','reaction_post','reaction_comment')
 * - comment: 내 게시글에 댓글이 달렸을 때
 * - reply: 내 댓글에 대댓글이 달렸을 때
 * - reaction_post: 내 게시글에 좋아요 리액션이 추가됐을 때
 * - reaction_comment: 내 댓글에 좋아요 리액션이 추가됐을 때
 */
export const NOTIFICATION_TYPE_VALUES = [
  'comment',
  'reply',
  'reaction_post',
  'reaction_comment',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPE_VALUES)[number]

export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPE_VALUES)

// ============================================================
// 기존 리액션 종류 재사용 (reaction_kind 컬럼)
// ============================================================

/**
 * notifications.reaction_kind: 현재는 'up'만 트리거가 INSERT함.
 * 'down' 리액션은 알림 생성 안 됨.
 */
export const NOTIFICATION_REACTION_KIND_VALUES = ['up', 'down'] as const

export type NotificationReactionKind =
  (typeof NOTIFICATION_REACTION_KIND_VALUES)[number]

// ============================================================
// PATCH /api/notifications 요청 바디 스키마
// ============================================================

/**
 * 기존 미읽음 알림을 읽음 처리하는 PATCH 요청 바디.
 * - ids: 특정 알림 ID 배열 → 해당 알림만 읽음 처리
 * - ids: 'all' → 본인의 모든 미읽음 알림 일괄 처리
 */
export const MarkReadRequestSchema = z.object({
  ids: z.union([z.array(z.string().uuid('通知IDが正しくありません')), z.literal('all')]),
})

export type MarkReadRequest = z.infer<typeof MarkReadRequestSchema>

// ============================================================
// API 응답 타입 (GET /api/notifications)
// ============================================================

/**
 * 알림 목록 단건 아이템 — fetchNotifications() 반환 타입.
 *
 * actor: 알림을 유발한 사용자 정보. 익명 작성인 경우 UI에서 「匿名のユーザー」로 표시할 것.
 * actor_is_anonymous: actor가 해당 게시글/댓글을 익명으로 작성했는지 여부.
 *   - type='comment'/'reply': 해당 댓글의 is_anonymous 값
 *   - type='reaction_post'/'reaction_comment': 리액션은 익명 개념 없으므로 항상 false
 * post: 연관 게시글의 기본 정보 (삭제된 경우도 포함하여 UI에서 처리)
 * comment_excerpt: 댓글 본문 첫 80자. 삭제된 경우 「削除されたコメント」 고정 문자열.
 */
export interface NotificationListItem {
  /** 알림 고유 ID */
  id: string
  /** 알림 종류 */
  type: NotificationType
  /** 연관 게시글 ID (모든 type에서 채워짐) */
  post_id: string | null
  /** 연관 댓글 ID (reaction_post일 때만 null) */
  comment_id: string | null
  /** 리액션 종류 (reaction_post / reaction_comment일 때만 값 있음) */
  reaction_kind: NotificationReactionKind | null
  /** 읽음 여부 */
  is_read: boolean
  /** 알림 생성 일시 (ISO 8601) */
  created_at: string

  /**
   * 알림을 유발한 사용자 프로필.
   * actor_is_anonymous=true인 경우 UI에서 actor 정보를 숨기고 「匿名のユーザー」 표시할 것.
   */
  actor: {
    id: string
    nickname: string | null
    role: string
  } | null

  /**
   * actor가 해당 게시글/댓글을 익명으로 작성했는지 여부.
   * true이면 UI에서 닉네임 대신 「匿名のユーザー」로 표시.
   */
  actor_is_anonymous: boolean

  /** 연관 게시글 요약 정보 */
  post: {
    id: string
    title: string
    is_deleted: boolean
  } | null

  /**
   * 연관 댓글 본문 발췌 (최대 80자).
   * 삭제된 댓글: 「削除されたコメント」
   * comment_id가 없는 경우(reaction_post): null
   */
  comment_excerpt: string | null
}
