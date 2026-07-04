'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Film, Calendar, Star, ChevronLeft } from 'lucide-react'
import { searchMoviesForProposeAction } from './actions'
import type { TmdbMovie } from '@/lib/tmdb/api'

export default function ProposePage() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (query.length < 3) { setMovies([]); return }
      setLoading(true)
      const { movies: results } = await searchMoviesForProposeAction(query)
      setMovies(results)
      setLoading(false)
    }
    const t = setTimeout(run, 500)
    return () => clearTimeout(t)
  }, [query])

  return (
    <main className="min-h-screen bg-base text-white">
      <header className="sticky top-0 z-10 bg-base/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/" className="p-1.5 text-zinc-400 active:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </a>
          <span className="text-base font-semibold">Proposer un film</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un film..."
            className="w-full bg-surface border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-zinc-500 transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />)}
          </div>
        )}

        {!loading && query.length >= 3 && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Film className="w-10 h-10 text-zinc-700" />
            <p className="text-zinc-500 text-sm">Aucun film trouvé pour &quot;{query}&quot;</p>
          </div>
        )}

        <div className="space-y-2">
          {movies.map(movie => (
            <a
              key={movie.id}
              href={`/propose/${movie.id}`}
              className="flex items-stretch bg-surface border border-zinc-800 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
            >
              <div className="relative w-16 h-24 flex-shrink-0 bg-raised">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="p-3.5 flex flex-col justify-between flex-grow min-w-0">
                <h3 className="font-bold leading-snug line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {movie.release_date?.split('-')[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    {movie.vote_average?.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{movie.overview}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
