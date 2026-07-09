import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import Image from 'next/image'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: selfProfile }, { data: profiles }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('id, pseudo, avatar_url').neq('id', user.id).order('pseudo'),
  ])

  const friends = profiles ?? []

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header
        pseudo={selfProfile?.pseudo ?? '?'}
        avatarUrl={selfProfile?.avatar_url ?? null}
        backHref="/profile"
      />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="font-display text-[26px] uppercase leading-none tracking-wide">Amis</h1>
        <div className="space-y-2">
          {friends.map(friend => (
            <a
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="flex items-center gap-4 bg-surface-fill shadow-card rounded-2xl p-4 active:scale-[0.99] transition-transform"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-raised flex-shrink-0">
                <Image
                  src={friend.avatar_url ?? '/default-avatar.png'}
                  alt={friend.pseudo}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-ink">{friend.pseudo}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
