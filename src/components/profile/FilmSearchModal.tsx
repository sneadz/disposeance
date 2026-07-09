'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Film, X } from 'lucide-react'
import { searchMoviesAction } from '@/app/movies/new/actions'
import type { TmdbMovie } from '@/lib/tmdb/api'

interface FilmSearchModalProps {
  onSelect: (movie: TmdbMovie) => void
  onClose: () => void
}

export default function FilmSearchModal({ onSelect, onClose }: FilmSearchModalProps) {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 3) { setMovies([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const { movies: results } = await searchMoviesAction(query)
      setMovies(results)
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-base rounded-t-3xl p-4 space-y-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">Choisir un film</span>
          <button onClick={onClose} className="p-1.5 text-ink-muted active:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint w-4 h-4" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher un film..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface-fill shadow-card rounded-2xl py-3.5 pl-11 pr-4 text-ink text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-ink-faint transition-colors"
          />
        </div>
        <div className="overflow-y-auto flex-1 space-y-2">
          {loading && [1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />)}
          {!loading && query.length >= 3 && movies.length === 0 && (
            <div className="text-center py-8 text-ink-muted text-sm">Aucun résultat</div>
          )}
          {movies.map(movie => (
            <button
              key={movie.id}
              onClick={() => onSelect(movie)}
              className="w-full flex items-center gap-3 bg-surface-fill shadow-card rounded-2xl p-3 active:scale-[0.99] transition-transform text-left"
            >
              <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-4 h-4 text-ink-faint" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink leading-snug line-clamp-1">{movie.title}</p>
                <p className="text-xs text-ink-muted">{movie.release_date?.split('-')[0]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
