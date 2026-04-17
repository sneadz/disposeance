import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import ShowtimesForm from './ShowtimesForm'
import { ChevronLeft } from 'lucide-react'

function formatDate(dateStr: string): string {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const d = new Date(dateStr + 'T00:00:00')
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default async function SelectShowtimesPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect(`/movies/${params.id}`)

  const { data: movie } = await supabase.from('movies').select('id, title, status').eq('id', params.id).single()
  if (!movie) notFound()

  const { data: dayVotes } = await supabase
    .from('day_votes').select('date').eq('movie_id', params.id).eq('available', true)

  const counts: Record<string, number> = {}
  for (const v of dayVotes ?? []) counts[v.date] = (counts[v.date] ?? 0) + 1
  const winningDate = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href={`/movies/${params.id}`} className="p-1.5 text-zinc-400 active:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </a>
          <div>
            <p className="text-base font-semibold leading-none">Saisie des horaires</p>
            <p className="text-xs text-zinc-500 mt-0.5">{movie.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {winningDate ? (
          <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs text-violet-300 uppercase font-semibold tracking-wider">Jour le plus voté</p>
              <p className="text-xl font-bold mt-0.5">{formatDate(winningDate)}</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300 text-sm">
            Aucun vote pour le moment — tu peux quand même saisir des horaires.
          </div>
        )}

        <ShowtimesForm movieId={params.id} winningDate={winningDate ?? ''} />
      </div>
    </main>
  )
}
