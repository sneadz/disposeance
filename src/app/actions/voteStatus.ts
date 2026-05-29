'use server'

import { createClient } from '@/lib/supabase-server'

export type ParticipantVoteStatus = {
  pseudo: string
  voted: boolean
}

export async function getVoteStatusAction(
  movieId: string,
  phase: 'days' | 'times'
): Promise<{ participants: ParticipantVoteStatus[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { participants: [], error: 'Non authentifié' }

  const { data: movie } = await supabase
    .from('movies')
    .select('participant_ids')
    .eq('id', movieId)
    .single()
  if (!movie?.participant_ids?.length) return { participants: [] }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, pseudo')
    .in('id', movie.participant_ids)
  if (!profiles) return { participants: [] }

  let voterIds: Set<string>

  if (phase === 'days') {
    const { data: votes } = await supabase
      .from('day_votes')
      .select('user_id')
      .eq('movie_id', movieId)
    voterIds = new Set((votes ?? []).map((v: { user_id: string }) => v.user_id))
  } else {
    const { data: showtimes } = await supabase
      .from('showtimes')
      .select('id')
      .eq('movie_id', movieId)
    const showtimeIds = (showtimes ?? []).map((s: { id: string }) => s.id)
    if (showtimeIds.length === 0) {
      voterIds = new Set()
    } else {
      const { data: votes } = await supabase
        .from('time_votes')
        .select('user_id')
        .in('showtime_id', showtimeIds)
      voterIds = new Set((votes ?? []).map((v: { user_id: string }) => v.user_id))
    }
  }

  const participants: ParticipantVoteStatus[] = profiles
    .map((p: { id: string; pseudo: string }) => ({ pseudo: p.pseudo, voted: voterIds.has(p.id) }))
    .sort((a: ParticipantVoteStatus, b: ParticipantVoteStatus) => Number(a.voted) - Number(b.voted))

  return { participants }
}
