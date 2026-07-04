'use server'

import { createClient } from '@/lib/supabase-server'
import { getMovieDetails } from '@/lib/tmdb/api'

export async function addToWishlistAction(tmdbId: number): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  const movie = await getMovieDetails(tmdbId)
  if (!movie) return { error: 'Film introuvable' }

  const { error } = await supabase.from('wishlist').insert({
    tmdb_id: movie.id,
    title: movie.title,
    poster_url: movie.poster_path ?? null,
    release_date: movie.release_date ?? null,
  })

  return { error: error?.message ?? null }
}

export async function removeFromWishlistAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  const { error } = await supabase.from('wishlist').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export async function getMovieDetailsAction(tmdbId: number) {
  return getMovieDetails(tmdbId)
}
