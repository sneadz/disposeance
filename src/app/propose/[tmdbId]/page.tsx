import { redirect } from 'next/navigation'
import { ChevronLeft, Home } from 'lucide-react'
import { getMovieDetails, getMovieVideos } from '@/lib/tmdb/api'
import MovieProposalActions from '@/components/movies/MovieProposalActions'

interface Props {
  params: Promise<{ tmdbId: string }>
}

export default async function ProposeMoviePage({ params }: Props) {
  const { tmdbId } = await params
  const id = parseInt(tmdbId, 10)
  if (isNaN(id)) redirect('/propose')

  const [movie, trailerKey] = await Promise.all([
    getMovieDetails(id),
    getMovieVideos(id),
  ])

  if (!movie) redirect('/propose')

  const releaseYear = movie.release_date?.split('-')[0] ?? ''
  const releaseDate = movie.release_date
    ? new Date(movie.release_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : releaseYear

  return (
    <main className="min-h-screen bg-base text-ink">
      <header className="sticky top-0 z-10 bg-base/85 backdrop-blur-md shadow-[inset_0_-1px_0_rgba(255,255,255,0.07)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/propose" className="p-1.5 text-ink-muted active:text-ink transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </a>
            <span className="text-base font-semibold">Proposer</span>
          </div>
          <a href="/" className="p-1.5 text-ink-muted active:text-ink transition-colors">
            <Home className="w-5 h-5" />
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <MovieProposalActions
          title={movie.title}
          overview={movie.overview}
          posterPath={movie.poster_path}
          releaseYear={releaseYear}
          releaseDate={releaseDate}
          trailerKey={trailerKey}
        />
      </div>
    </main>
  )
}
