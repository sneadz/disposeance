'use server'

import { createClient } from '@/lib/supabase-server'

export async function uploadAvatarAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier' }

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(`${user.id}.jpg`, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`${user.id}.jpg`)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  return updateError ? { error: updateError.message } : {}
}
