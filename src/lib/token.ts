import type { SupabaseClient } from '@supabase/supabase-js'
import { currentQuarter } from './quarter'

export function canSpendToken(input: {
  canUseToken: boolean
  alreadySpentThisQuarter: boolean
}): boolean {
  return input.canUseToken && !input.alreadySpentThisQuarter
}

// Lecture serveur : le user a-t-il un jeton dispo maintenant ?
export async function getTokenAvailability(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('can_use_token')
    .eq('id', userId)
    .single()

  if (!profile?.can_use_token) return false

  const { data: spend } = await supabase
    .from('token_spends')
    .select('user_id')
    .eq('user_id', userId)
    .eq('quarter', currentQuarter())
    .maybeSingle()

  return canSpendToken({ canUseToken: true, alreadySpentThisQuarter: !!spend })
}
