'use server'

import { createClient } from '@/lib/supabase/server'

// 환영 모달을 닫은 시각을 profiles.onboarded_at 에 기록한다.
// NULL → now() 로 갱신. 이미 값이 있으면 멱등(idempotent).
export async function markOnboarded() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' as const }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('onboarded_at', null)

  if (error) return { error: error.message }
  return { error: null }
}
