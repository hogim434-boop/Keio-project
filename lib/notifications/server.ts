/**
 * 알림 서버 사이드 유틸리티 함수 모음
 *
 * 모든 함수는 SupabaseClient를 DI로 받아 Server Component / Route Handler 양쪽에서 재사용 가능.
 * RLS: notifications 테이블에 SELECT/UPDATE/DELETE는 recipient_id = auth.uid() 정책이 적용되어
 *       별도 .eq('recipient_id', userId) 없이도 본인 알림만 접근됨.
 * INSERT: 트리거 전용 — 클라이언트에서 직접 INSERT 불가.
 * 에러 정책: PostgrestError는 throw하여 API 라우트의 pgErrorToResponse()가 처리.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { NotificationListItem, NotificationType } from '@/types/notification'

// ============================================================
// 내부 타입 — Supabase 조인 쿼리 원시 응답
// ============================================================

/**
 * Supabase relational select 응답 raw 타입.
 * actor는 FK embedding 불가(view는 FK 관계 없음) → actor_id만 raw로 받아
 * 별도 profiles_public batch fetch 후 코드에서 merge.
 */
interface RawNotificationRow {
  id: string
  type: string
  post_id: string | null
  comment_id: string | null
  reaction_kind: string | null
  is_read: boolean
  created_at: string
  actor_id: string
  post: {
    id: string
    title: string
    is_deleted: boolean
    is_anonymous: boolean
    user_id: string
  } | null
  comment: {
    id: string
    body: string
    is_deleted: boolean
    is_anonymous: boolean
    user_id: string
  } | null
}

/** profiles_public view 행 타입 */
interface ActorPublic {
  id: string
  nickname: string | null
  role: string | null
}

// ============================================================
// 내부 헬퍼 — raw row → NotificationListItem 변환
// ============================================================

/**
 * Supabase 조인 응답 1행을 NotificationListItem 형태로 변환.
 * actor는 profiles_public batch fetch 결과 Map에서 lookup.
 *
 * @param row - notifications 조인 결과 raw 행
 * @param actorMap - actor_id → ActorPublic 매핑 (batch fetch 결과)
 */
function mapRow(
  row: RawNotificationRow,
  actorMap: Map<string, ActorPublic>,
): NotificationListItem {
  const type = row.type as NotificationType

  // profiles_public view의 role은 string | null → 실제로 null 가능성 없음(NOT NULL 컬럼)
  // actor가 없는 경우(탈퇴 등)에도 null 처리
  const rawActor = actorMap.get(row.actor_id) ?? null
  const actor = rawActor
    ? { id: rawActor.id, nickname: rawActor.nickname, role: rawActor.role ?? 'user' }
    : null

  // actor_is_anonymous: comment/reply는 해당 댓글의 익명 여부, reaction은 항상 false
  let actorIsAnonymous = false
  if (type === 'comment' || type === 'reply') {
    actorIsAnonymous = row.comment?.is_anonymous ?? false
  }
  // reaction_post / reaction_comment: 리액션은 익명 개념 없음 → false 유지

  // comment_excerpt: 댓글이 있는 경우 본문 발췌 (삭제면 일본어 고정 문자열)
  let commentExcerpt: string | null = null
  if (row.comment) {
    commentExcerpt = row.comment.is_deleted
      ? '削除されたコメント'
      : row.comment.body.slice(0, 80)
  }

  return {
    id: row.id,
    type,
    post_id: row.post_id,
    comment_id: row.comment_id,
    reaction_kind: (row.reaction_kind as NotificationListItem['reaction_kind']) ?? null,
    is_read: row.is_read,
    created_at: row.created_at,
    actor,
    actor_is_anonymous: actorIsAnonymous,
    post: row.post
      ? {
          id: row.post.id,
          title: row.post.title,
          is_deleted: row.post.is_deleted,
        }
      : null,
    comment_excerpt: commentExcerpt,
  }
}

// ============================================================
// 공개 함수
// ============================================================

/**
 * 알림 목록 조회.
 *
 * RLS: recipient_id = auth.uid() 자동 필터 → 본인 알림만 반환.
 * JOIN: actor(profiles), post(posts), comment(comments) 한 번에 조회.
 * 정렬: 최신순(created_at DESC).
 * limit: 기본 20, 최대 50 (클라이언트 요청값 초과 방지).
 */
export async function fetchNotifications(
  supabase: SupabaseClient<Database>,
  opts: { limit?: number } = {},
): Promise<NotificationListItem[]> {
  // limit 범위 보정: 1~50, 기본 20
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20))

  // 1) notifications fetch — actor_id raw, post/comment는 그대로 JOIN
  //    profiles_public은 FK 관계가 없어 relational embedding 불가 → actor_id만 가져옴
  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      id,
      type,
      post_id,
      comment_id,
      reaction_kind,
      is_read,
      created_at,
      actor_id,
      post:posts!post_id(id, title, is_deleted, is_anonymous, user_id),
      comment:comments!comment_id(id, body, is_deleted, is_anonymous, user_id)
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  // data가 null이면 빈 배열로 대체
  const rows = Array.isArray(data) ? (data as RawNotificationRow[]) : []
  if (rows.length === 0) return []

  // 2) 중복 제거한 actor_id 목록으로 profiles_public 한 번에 batch fetch
  //    N+1 문제 없음 — 알림 건수와 무관하게 actor fetch는 최대 1번
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id)))
  const { data: actorRows, error: actorError } = await supabase
    .from('profiles_public')
    .select('id, nickname, role')
    .in('id', actorIds)

  if (actorError) throw actorError

  // 3) Map으로 O(1) lookup 최적화
  const actorMap = new Map<string, ActorPublic>(
    (actorRows ?? []).map((a) => [
      a.id as string,
      { id: a.id as string, nickname: a.nickname ?? null, role: a.role ?? null },
    ]),
  )

  // 4) mapRow에 actorMap 전달 → actor lookup
  return rows.map((row) => mapRow(row, actorMap))
}

/**
 * 미읽음 알림 수 조회.
 *
 * RLS: recipient_id = auth.uid() 자동 필터 → 본인 미읽음만 카운트.
 * head: true로 실제 데이터 없이 count만 반환하여 네트워크 비용 최소화.
 */
export async function getUnreadCount(supabase: SupabaseClient<Database>): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

/**
 * 특정 알림 ID 목록을 읽음 처리.
 *
 * RLS: UPDATE도 recipient_id = auth.uid() 조건 — 타인 알림 ID를 넘겨도 0행 업데이트됨.
 * 반환값: 실제로 갱신된 행 수 (RLS로 거부된 행은 포함 안 됨).
 */
export async function markRead(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', ids)
    .select('id')

  if (error) throw error
  return (data ?? []).length
}

/**
 * 본인의 모든 미읽음 알림 일괄 읽음 처리.
 *
 * RLS: recipient_id = auth.uid() 자동 필터 → 본인 미읽음만 업데이트.
 * .eq('is_read', false) 조건으로 이미 읽은 행은 건드리지 않음.
 * 반환값: 실제로 갱신된 행 수.
 */
export async function markAllRead(supabase: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
    .select('id')

  if (error) throw error
  return (data ?? []).length
}
