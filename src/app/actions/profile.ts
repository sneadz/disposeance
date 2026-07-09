'use server'

import { createClient } from '@/lib/supabase-server'

export async function addTopFilmAction(
  position: number,
  tmdbId: string,
  title: string,
  posterUrl: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('profile_top_films').upsert(
    { profile_id: user.id, position, tmdb_id: tmdbId, title, poster_url: posterUrl },
    { onConflict: 'profile_id,position' }
  )

  return error ? { error: error.message } : {}
}

export async function removeTopFilmAction(position: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profile_top_films')
    .delete()
    .eq('profile_id', user.id)
    .eq('position', position)

  return error ? { error: error.message } : {}
}

export async function reorderTopFilmsAction(
  newOrder: { id: string; position: number }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const results = await Promise.all(
    newOrder.map(({ id, position }) =>
      supabase.from('profile_top_films').update({ position }).eq('id', id).eq('profile_id', user.id)
    )
  )
  const failed = results.find(r => r.error)
  return failed?.error ? { error: failed.error.message } : {}
}
