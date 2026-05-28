'use server'

import { createClient } from '@/lib/supabase-server'

export type ShowtimeEntry = { datetime: string; tag?: string | null }

export async function setShowtimesAction(movieId: string, entries: ShowtimeEntry[]) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  if (!entries || entries.length === 0) return { error: 'Ajoutez au moins un horaire' }

  const { data: movie } = await supabase.from('movies').select('id, status').eq('id', movieId).single()
  if (!movie) return { error: 'Film introuvable' }
  if (movie.status !== 'picking_days') return { error: 'Ce film n\'est pas en phase de vote des jours' }

  const { error: insertError } = await supabase
    .from('showtimes')
    .insert(entries.map(e => ({ movie_id: movieId, datetime: e.datetime, tag: e.tag ?? null })))
  if (insertError) return { error: insertError.message }

  const { error: updateError } = await supabase
    .from('movies')
    .update({ status: 'picking_times' })
    .eq('id', movieId)
  if (updateError) return { error: updateError.message }

  return { error: null }
}
