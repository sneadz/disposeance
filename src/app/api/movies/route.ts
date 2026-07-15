import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTokenAvailability } from '@/lib/token'
import { currentQuarter } from '@/lib/quarter'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { movie, availableDates, participantIds, guests, token } = body as {
    movie: { id: number; title: string; poster_path: string | null; release_date: string }
    availableDates: string[]
    participantIds: string[]
    guests: string[]
    token?: boolean
  }

  // Contrôle d'accès : token OU admin
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

  let db = supabase                    // client RLS (chemin admin)
  let tokenOwnerId: string | null = null

  if (token) {
    const available = await getTokenAvailability(supabase, user.id)
    if (!available) return NextResponse.json({ error: 'Jeton indisponible' }, { status: 403 })
    db = createAdminClient()           // service-role : contourne la RLS movies pour les non-admins
    tokenOwnerId = user.id
  } else if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  if (!movie || !availableDates || availableDates.length === 0) {
    return NextResponse.json({ error: 'Sélectionne au moins une date' }, { status: 400 })
  }

  if (!participantIds || participantIds.length === 0) {
    return NextResponse.json({ error: 'Sélectionne au moins un participant' }, { status: 400 })
  }

  // Registre anti-triche AVANT toute création : un 409 (jeton déjà dépensé /
  // double-clic / course) ne laisse aucun film orphelin. Reste dépensé même si
  // le film est supprimé ensuite.
  if (token) {
    const { error: spendError } = await db
      .from('token_spends')
      .insert({ user_id: user.id, quarter: currentQuarter() })
    if (spendError) {
      return NextResponse.json({ error: 'Jeton déjà utilisé ce trimestre' }, { status: 409 })
    }
  }

  const { data: rows, error: movieError } = await db
    .from('movies')
    .insert({
      title: movie.title,
      tmdb_id: String(movie.id),
      poster_url: movie.poster_path ?? null,
      release_date: movie.release_date || null,
      status: 'picking_days',
      participant_ids: participantIds,
      guests: guests ?? [],
      token_owner_id: tokenOwnerId,
    })
    .select('id')

  if (movieError) return NextResponse.json({ error: movieError.message }, { status: 500 })
  const created = rows?.[0]
  if (!created) return NextResponse.json({ error: 'Film non créé' }, { status: 500 })

  const { error: daysError } = await db
    .from('available_days')
    .insert(availableDates.map(date => ({ movie_id: created.id, date })))

  if (daysError) return NextResponse.json({ error: daysError.message }, { status: 500 })

  return NextResponse.json({ error: null, movieId: created.id })
}
