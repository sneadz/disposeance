'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function resetMovieAction(movieId: string) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  // Supprimer les créneaux (et leurs votes via cascade si FK, sinon explicitement)
  const { data: showtimes } = await supabase.from('showtimes').select('id').eq('movie_id', movieId)
  const showtimeIds = (showtimes ?? []).map(s => s.id)
  if (showtimeIds.length > 0) {
    await supabase.from('time_votes').delete().in('showtime_id', showtimeIds)
    await supabase.from('showtimes').delete().eq('movie_id', movieId)
  }

  // Supprimer les votes de jours
  await supabase.from('day_votes').delete().eq('movie_id', movieId)

  // Remettre le film en picking_days
  await supabase.from('movies').update({ status: 'picking_days', final_showtime_id: null }).eq('id', movieId)

  revalidatePath(`/movies/${movieId}`)
  redirect(`/movies/${movieId}`)
}

export async function deleteMovieAction(movieId: string) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  await supabase.from('movies').delete().eq('id', movieId)
  revalidatePath('/')
  redirect('/')
}
