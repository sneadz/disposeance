import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const { movie, availableDates, participantIds } = body as {
    movie: { id: number; title: string; poster_path: string | null; release_date: string }
    availableDates: string[]
    participantIds: string[]
  }

  if (!movie || !availableDates || availableDates.length === 0) {
    return NextResponse.json({ error: 'Sélectionne au moins une date' }, { status: 400 })
  }

  if (!participantIds || participantIds.length === 0) {
    return NextResponse.json({ error: 'Sélectionne au moins un participant' }, { status: 400 })
  }

  const { data: rows, error: movieError } = await supabase
    .from('movies')
    .insert({
      title: movie.title,
      tmdb_id: String(movie.id),
      poster_url: movie.poster_path ?? null,
      release_date: movie.release_date || null,
      status: 'picking_days',
      participant_ids: participantIds,
    })
    .select('id')

  if (movieError) return NextResponse.json({ error: movieError.message }, { status: 500 })
  const created = rows?.[0]
  if (!created) return NextResponse.json({ error: 'Film non créé' }, { status: 500 })

  const { error: daysError } = await supabase
    .from('available_days')
    .insert(availableDates.map(date => ({ movie_id: created.id, date })))

  if (daysError) return NextResponse.json({ error: daysError.message }, { status: 500 })

  return NextResponse.json({ error: null, movieId: created.id })
}
