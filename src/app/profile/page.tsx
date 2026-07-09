import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import AvatarUpload from '@/components/profile/AvatarUpload'
import Top4Grid, { type TopFilm } from '@/components/profile/Top4Grid'
import Button from '@/components/ui/Button'
import { Users } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: profile }, { data: topFilms }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profile_top_films').select('*').eq('profile_id', user.id).order('position'),
  ])

  const pseudo = profile?.pseudo ?? '?'
  const avatarUrl = profile?.avatar_url ?? null
  const films = (topFilms ?? []) as TopFilm[]

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header pseudo={pseudo} avatarUrl={avatarUrl} backHref="/" />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <AvatarUpload currentUrl={avatarUrl} pseudo={pseudo} />
          <h1 className="font-display text-2xl uppercase tracking-wide">{pseudo}</h1>
          <a href="/friends">
            <Button variant="ghost">
              <Users className="w-4 h-4" />
              Amis
            </Button>
          </a>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Top 4 films</h2>
          <Top4Grid films={films} editable={true} />
        </div>
      </div>
    </main>
  )
}
