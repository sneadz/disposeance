'use server'

import { createClient } from '@/lib/supabase-server'
import { searchMovies, TmdbMovie } from '@/lib/tmdb/api'

export async function searchMoviesForProposeAction(query: string): Promise<{ movies: TmdbMovie[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { movies: [], error: 'Non authentifié' }
    if (query.length < 3) return { movies: [], error: null }
    const movies = await searchMovies(query)
    return { movies, error: null }
  } catch (e: unknown) {
    return { movies: [], error: String(e) }
  }
}
