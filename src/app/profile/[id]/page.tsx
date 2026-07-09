import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/ui/Header'
import Image from 'next/image'

export default async function OtherProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  if (params.id === user.id) redirect('/profile')

  const [{ data: selfProfile }, { data: profile }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', params.id).single(),
  ])

  if (!profile) notFound()

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header
        pseudo={selfProfile?.pseudo ?? '?'}
        avatarUrl={selfProfile?.avatar_url ?? null}
        backHref="/friends"
      />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-fill shadow-card">
            <Image
              src={profile.avatar_url ?? '/default-avatar.png'}
              alt={profile.pseudo}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wide">{profile.pseudo}</h1>
        </div>
      </div>
    </main>
  )
}
