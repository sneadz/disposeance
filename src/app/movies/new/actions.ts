'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { searchMovies, TmdbMovie } from '@/lib/tmdb/api'
import { getTokenAvailability } from '@/lib/token'
import { currentQuarter } from '@/lib/quarter'

export async function searchMoviesAction(query: string): Promise<{ movies: TmdbMovie[]; error: string | null }> {
  try {
    const supabase = await createClient()
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

export async function getProfilesAction(): Promise<{ profiles: { id: string; pseudo: string }[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { profiles: [], error: 'Non authentifié' }

    const { data, error } = await supabase.from('profiles').select('id, pseudo').order('pseudo')
    if (error) return { profiles: [], error: error.message }
    return { profiles: data ?? [], error: null }
  } catch (e: unknown) {
    return { profiles: [], error: String(e) }
  }
}

export async function createMovieSessionAction(movie: TmdbMovie, availableDates: string[]) {
  try {
    const supabase = await createClient()
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

export async function createQuickCardAction(
  movie: { id: number; title: string; poster_path: string | null; release_date: string },
  date: string,        // format "YYYY-MM-DD"
  time: string,        // format "HH:MM"
  participantIds: string[],
  guests: string[],
  token = false
): Promise<{ movieId: string | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { movieId: null, error: 'Non authentifié' }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

    let db = supabase                    // client RLS (chemin admin)
    let tokenOwnerId: string | null = null

    if (token) {
      const available = await getTokenAvailability(supabase, user.id)
      if (!available) return { movieId: null, error: 'Jeton indisponible' }
      db = createAdminClient()           // service-role : contourne la RLS movies pour les non-admins
      tokenOwnerId = user.id
    } else if (!profile?.is_admin) {
      return { movieId: null, error: 'Accès refusé' }
    }

    if (!participantIds || participantIds.length === 0) return { movieId: null, error: 'Sélectionne au moins un participant' }

    // Registre anti-triche AVANT toute création : un jeton déjà dépensé ce trimestre
    // (double-clic / course) ne laisse aucun film orphelin.
    if (token) {
      const { error: spendError } = await db
        .from('token_spends')
        .insert({ user_id: user.id, quarter: currentQuarter() })
      if (spendError) return { movieId: null, error: 'Jeton déjà utilisé ce trimestre' }
    }

    // 1. Créer le film directement fermé
    const { data: rows, error: movieError } = await db
      .from('movies')
      .insert({
        title: movie.title,
        tmdb_id: String(movie.id),
        poster_url: movie.poster_path ?? null,
        release_date: movie.release_date || null,
        status: 'closed',
        participant_ids: participantIds,
        guests: guests ?? [],
        token_owner_id: tokenOwnerId,
      })
      .select('id')
    if (movieError) return { movieId: null, error: movieError.message }
    const created = rows?.[0]
    if (!created) return { movieId: null, error: 'Film non créé' }

    // 2. Insérer la date disponible
    const { error: daysError } = await db
      .from('available_days')
      .insert({ movie_id: created.id, date })
    if (daysError) return { movieId: null, error: daysError.message }

    // 3. Insérer le showtime
    const datetime = `${date}T${time}:00`
    const { data: showtimeRows, error: showtimeError } = await db
      .from('showtimes')
      .insert({ movie_id: created.id, datetime })
      .select('id')
    if (showtimeError) return { movieId: null, error: showtimeError.message }
    const showtime = showtimeRows?.[0]
    if (!showtime) return { movieId: null, error: 'Showtime non créé' }

    // 4. Mettre à jour final_showtime_id
    const { error: updateError } = await db
      .from('movies')
      .update({ final_showtime_id: showtime.id })
      .eq('id', created.id)
    if (updateError) return { movieId: null, error: updateError.message }

    // 5. Insérer les time_votes pour chaque participant (alimente FinalSummary)
    const admin = createAdminClient()
    const { error: votesError } = await admin
      .from('time_votes')
      .insert(participantIds.map(uid => ({ user_id: uid, showtime_id: showtime.id, available: true })))
    if (votesError) return { movieId: null, error: votesError.message }

    return { movieId: created.id, error: null }
  } catch (e: unknown) {
    console.error('[createQuickCardAction]', e)
    return { movieId: null, error: String(e) }
  }
}
