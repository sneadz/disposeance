import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/ui/Header'
import Image from 'next/image'
import Top4Grid, { type TopFilm } from '@/components/profile/Top4Grid'

export default async function OtherProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  if (params.id === user.id) redirect('/profile')

  const [{ data: selfProfile }, { data: profile }, { data: topFilms }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', params.id).single(),
    supabase.from('profile_top_films').select('*').eq('profile_id', params.id).order('position'),
  ])

  if (!profile) notFound()

  const films = (topFilms ?? []) as TopFilm[]

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

        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Top 4 films</h2>
          <Top4Grid films={films} editable={false} />
        </div>
      </div>
    </main>
  )
}
