/**
 * 추천/비추천 토글 (toggleReaction)
 *
 * SELECT existing → 분기:
 *  - 없음            → INSERT  (before=null, after=kind)
 *  - 존재 + 같은 kind → DELETE (before=kind, after=null)
 *  - 존재 + 다른 kind → UPDATE (before=existing, after=kind)
 *
 * 트리거 reactions_apply_post_counter 가 posts.reaction_up/reaction_down 자동 갱신.
 * 1인 1회 반응(UNIQUE) 제약 — UPDATE 로 up↔down 토글, DELETE 로 취소.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ReactionKind, ReactionTargetType } from '@/types/community'

export interface ToggleReactionOpts {
  targetType: ReactionTargetType
  targetId: string
  kind: ReactionKind
}

export interface ToggleReactionResult {
  before: ReactionKind | null
  after: ReactionKind | null
}

export async function toggleReaction(
  supabase: SupabaseClient<Database>,
  opts: ToggleReactionOpts,
): Promise<ToggleReactionResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')

  const { data: existing, error: selErr } = await supabase
    .from('reactions')
    .select('id, reaction')
    .eq('user_id', user.id)
    .eq('target_type', opts.targetType)
    .eq('target_id', opts.targetId)
    .maybeSingle()
  if (selErr) throw selErr

  if (!existing) {
    const { error } = await supabase.from('reactions').insert({
      user_id: user.id,
      target_type: opts.targetType,
      target_id: opts.targetId,
      reaction: opts.kind,
    })
    if (error) throw error
    return { before: null, after: opts.kind }
  }

  if (existing.reaction === opts.kind) {
    const { error } = await supabase.from('reactions').delete().eq('id', existing.id)
    if (error) throw error
    return { before: opts.kind, after: null }
  }

  const { error } = await supabase
    .from('reactions')
    .update({ reaction: opts.kind })
    .eq('id', existing.id)
  if (error) throw error
  return { before: existing.reaction as ReactionKind, after: opts.kind }
}
