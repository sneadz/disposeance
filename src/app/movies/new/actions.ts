'use server'

import { createClient } from '@/lib/supabase-server'
import { searchMovies, TmdbMovie } from '@/lib/tmdb/api'

export async function searchMoviesAction(query: string): Promise<{ movies: TmdbMovie[]; error: string | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { movies: [], error: 'Non authentifié' }
    if (query.length < 3) return { movies: [], error: null }

    const movies = await searchMovies(query)
    return { movies, error: null }
  } catch (e: unknown) {
    console.error('[searchMoviesAction]', e)
    return { movies: [], error: String(e) }
  }
}

export async function createMovieSessionAction(movie: TmdbMovie, availableDates: string[]) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Non authentifié' }
    if (availableDates.length === 0) return { error: 'Sélectionne au moins une date' }

    // Créer le film
    const { data: rows, error: movieError } = await supabase
      .from('movies')
      .insert({
        title: movie.title,
        tmdb_id: String(movie.id),
        poster_url: movie.poster_path ?? null,
        release_date: movie.release_date || null,
        status: 'picking_days',
      })
      .select('id')

    if (movieError) return { error: movieError.message }
    const created = rows?.[0]
    if (!created) return { error: 'Film non créé (vérifie ton rôle is_admin dans Supabase)' }

    // Insérer les jours disponibles
    const { error: daysError } = await supabase
      .from('available_days')
      .insert(availableDates.map(date => ({ movie_id: created.id, date })))

    if (daysError) return { error: daysError.message }

    return { error: null }
  } catch (e: unknown) {
    console.error('[createMovieSessionAction]', e)
    return { error: String(e) }
  }
}
