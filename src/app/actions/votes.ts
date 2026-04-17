'use server'

import { createClient } from '@/lib/supabase-server'

export async function voteDayAction(movieId: string, date: string, hasVoted: boolean) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié' }

  if (hasVoted) {
    const { error } = await supabase
      .from('day_votes')
      .delete()
      .eq('movie_id', movieId)
      .eq('user_id', user.id)
      .eq('date', date)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('day_votes')
      .insert({ movie_id: movieId, user_id: user.id, date, available: true })
    if (error) return { error: error.message }
  }

  return { error: null }
}

export async function voteTimeAction(movieId: string, showtimeId: string, hasVoted: boolean) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié' }

  if (hasVoted) {
    const { error } = await supabase
      .from('time_votes')
      .delete()
      .eq('showtime_id', showtimeId)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('time_votes')
      .insert({ user_id: user.id, showtime_id: showtimeId, available: true })
    if (error) return { error: error.message }
  }

  return { error: null }
}
