const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

function tmdbUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${TMDB_BASE_URL}${path}`)
  url.searchParams.set('api_key', process.env.TMDB_API_KEY ?? '')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

export interface TmdbMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  const res = await fetch(tmdbUrl('/search/movie', { query, language: 'fr-FR' }))
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

export function getPosterUrl(posterPath: string | null, size: 'w200' | 'w500' | 'original' = 'w500'): string | null {
  if (!posterPath) return null
  if (posterPath.startsWith('http')) return posterPath
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovie | null> {
  const res = await fetch(tmdbUrl(`/movie/${tmdbId}`, { language: 'fr-FR' }))
  if (!res.ok) return null
  return res.json()
}

export async function getMovieVideos(tmdbId: number): Promise<string | null> {
  const res = await fetch(tmdbUrl(`/movie/${tmdbId}/videos`, { language: 'fr-FR' }))
  if (!res.ok) return null
  const data = await res.json()
  const trailer = (data.results ?? []).find(
    (v: { site: string; type: string; key: string }) => v.site === 'YouTube' && v.type === 'Trailer'
  )
  return trailer?.key ?? null
}
