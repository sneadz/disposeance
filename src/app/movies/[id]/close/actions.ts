'use server'

import { createClient } from '@/lib/supabase-server'

export async function closeMovieAction(movieId: string, finalShowtimeId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  const { data: movie } = await supabase.from('movies').select('id, status').eq('id', movieId).single()
  if (!movie) return { error: 'Film introuvable' }
  if (movie.status !== 'picking_times') return { error: 'Ce film n\'est pas en phase de vote des horaires' }

  // Valider que le showtime appartient bien à ce film
  const { data: showtime } = await supabase
    .from('showtimes')
    .select('id')
    .eq('id', finalShowtimeId)
    .eq('movie_id', movieId)
    .single()
  if (!showtime) return { error: 'Horaire invalide pour ce film' }

  const { error: updateError } = await supabase
    .from('movies')
    .update({ status: 'closed', final_showtime_id: finalShowtimeId })
    .eq('id', movieId)
  if (updateError) return { error: updateError.message }

  return { error: null }
}
