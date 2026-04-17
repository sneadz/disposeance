'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function deleteMovieAction(movieId: string) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  await supabase.from('movies').delete().eq('id', movieId)
  revalidatePath('/')
  return { error: null }
}
