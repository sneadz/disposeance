import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/propose" className="p-1.5 text-zinc-400 active:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </a>
          <span className="text-base font-semibold">Proposer</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <MovieProposalActions
          title={movie.title}
          overview={movie.overview}
          posterPath={movie.poster_path}
          releaseYear={releaseYear}
          trailerKey={trailerKey}
        />
      </div>
    </main>
  )
}
