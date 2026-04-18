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

export async function confirmDayVotesAction(movieId: string, selectedDates: string[]) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: movieData } = await supabase.from('movies').select('participant_ids').eq('id', movieId).single()
  if (!movieData?.participant_ids?.includes(user.id)) return { error: 'Non autorisé' }

  // Delete all existing votes for this user on this movie
  const { error: delError } = await supabase
    .from('day_votes')
    .delete()
    .eq('movie_id', movieId)
    .eq('user_id', user.id)
  if (delError) return { error: delError.message }

  // Insert selected dates
  if (selectedDates.length > 0) {
    const { error: insError } = await supabase
      .from('day_votes')
      .insert(selectedDates.map(date => ({ movie_id: movieId, user_id: user.id, date, available: true })))
    if (insError) return { error: insError.message }
  }

  return { error: null }
}

export async function confirmTimeVotesAction(movieId: string, showtimeIds: string[]) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: movieData } = await supabase.from('movies').select('participant_ids').eq('id', movieId).single()
  if (!movieData?.participant_ids?.includes(user.id)) return { error: 'Non autorisé' }

  const { data: showtimes } = await supabase
    .from('showtimes')
    .select('id')
    .eq('movie_id', movieId)
  const allIds = (showtimes ?? []).map((s: { id: string }) => s.id)

  if (allIds.length > 0) {
    const { error: delError } = await supabase
      .from('time_votes')
      .delete()
      .eq('user_id', user.id)
      .in('showtime_id', allIds)
    if (delError) return { error: delError.message }
  }

  if (showtimeIds.length > 0) {
    const { error: insError } = await supabase
      .from('time_votes')
      .insert(showtimeIds.map(id => ({ user_id: user.id, showtime_id: id, available: true })))
    if (insError) return { error: insError.message }
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
