import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import CloseMovieForm from './CloseMovieForm'
import { ChevronLeft } from 'lucide-react'

function formatDatetime(datetimeStr: string): string {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const d = new Date(datetimeStr)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} · ${h}:${m}`
}

export default async function CloseMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect(`/movies/${id}`)

  const { data: movie } = await supabase.from('movies').select('id, title, status, participant_ids').eq('id', id).single()
  if (!movie) notFound()

  const participantCount = (movie.participant_ids ?? []).length

  const { data: showtimes } = await supabase.from('showtimes').select('id, datetime').eq('movie_id', id).order('datetime')
  const { data: timeVotes } = await supabase.from('time_votes').select('showtime_id').eq('available', true)

  const showtimesWithVotes = (showtimes ?? []).map(st => ({
    id: st.id,
    label: formatDatetime(st.datetime),
    voteCount: (timeVotes ?? []).filter(v => v.showtime_id === st.id).length,
  }))

  return (
    <main className="min-h-screen bg-base text-white">
      <header className="sticky top-0 z-10 bg-base/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href={`/movies/${id}`} className="p-1.5 text-zinc-400 active:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </a>
          <div>
            <p className="text-base font-semibold leading-none">Confirmer la séance</p>
            <p className="text-xs text-zinc-500 mt-0.5">{movie.title}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <CloseMovieForm movieId={id} showtimes={showtimesWithVotes} participantCount={participantCount} />
      </div>
    </main>
  )
}
