'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function loginWithPseudoAction(pseudo: string, password: string) {
  const admin = createAdminClient()

  // Étape 1 : trouver l'utilisateur par pseudo (insensible à la casse)
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .ilike('pseudo', pseudo.trim())
    .single()

  if (profileError || !profile) {
    return { error: 'Pseudo ou mot de passe incorrect' }
  }

  // Étape 2 : récupérer l'email via le compte auth admin
  const { data: { user: authUser }, error: authUserError } = await admin.auth.admin.getUserById(profile.id)

  if (authUserError || !authUser?.email) {
    return { error: 'Pseudo ou mot de passe incorrect' }
  }

  // Étape 3 : connexion avec email + mot de passe
  const supabase = createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authUser.email,
    password,
  })

  if (signInError) {
    return { error: 'Pseudo ou mot de passe incorrect' }
  }

  redirect('/')
}
