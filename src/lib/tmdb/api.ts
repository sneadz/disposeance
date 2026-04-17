const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    'Content-Type': 'application/json',
  }
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
  const res = await fetch(
    `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR`,
    { headers: getHeaders() }
  )
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
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}?language=fr-FR`,
    { headers: getHeaders() }
  )
  if (!res.ok) return null
  return res.json()
}
