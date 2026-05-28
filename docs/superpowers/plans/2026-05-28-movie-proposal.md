# Movie Proposal Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/propose` flow where any logged-in user can search for a movie and generate shareable Snapchat content (text message + poster image).

**Architecture:** Two new pages (`/propose` search, `/propose/[tmdbId]` detail) plus a `MovieProposalActions` client component. No database changes. The detail page is a server component that fetches TMDB data and passes it to the client component for interactive sharing.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, TMDB API, Web Share API, `/api/image-proxy` (existing)

---

### Task 1: Add `getMovieVideos` to TMDB lib

**Files:**
- Modify: `src/lib/tmdb/api.ts`

- [ ] **Step 1: Add the function**

Add at the end of `src/lib/tmdb/api.ts`:

```ts
export async function getMovieVideos(tmdbId: number): Promise<string | null> {
  const res = await fetch(tmdbUrl(`/movie/${tmdbId}/videos`, { language: 'fr-FR' }))
  if (!res.ok) return null
  const data = await res.json()
  const trailer = (data.results ?? []).find(
    (v: { site: string; type: string; key: string }) => v.site === 'YouTube' && v.type === 'Trailer'
  )
  return trailer?.key ?? null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tmdb/api.ts
git commit -m "feat: add getMovieVideos to TMDB lib"
```

---

### Task 2: Create `/propose` search page

**Files:**
- Create: `src/app/propose/actions.ts`
- Create: `src/app/propose/page.tsx`

- [ ] **Step 1: Create the server action**

Create `src/app/propose/actions.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase-server'
import { searchMovies, TmdbMovie } from '@/lib/tmdb/api'

export async function searchMoviesForProposeAction(query: string): Promise<{ movies: TmdbMovie[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { movies: [], error: 'Non authentifié' }
    if (query.length < 3) return { movies: [], error: null }
    const movies = await searchMovies(query)
    return { movies, error: null }
  } catch (e: unknown) {
    return { movies: [], error: String(e) }
  }
}
```

- [ ] **Step 2: Create the search page**

Create `src/app/propose/page.tsx`:

```tsx
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
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-base focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] placeholder-zinc-500 transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />)}
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
              className="flex items-stretch bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
            >
              <div className="relative w-16 h-24 flex-shrink-0 bg-zinc-800">
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/propose/actions.ts src/app/propose/page.tsx
git commit -m "feat: add /propose movie search page"
```

---

### Task 3: Create `MovieProposalActions` client component

**Files:**
- Create: `src/components/movies/MovieProposalActions.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/movies/MovieProposalActions.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb/api'

interface Props {
  title: string
  overview: string
  posterPath: string | null
  releaseYear: string
  trailerKey: string | null
}

export default function MovieProposalActions({ title, overview, posterPath, releaseYear, trailerKey }: Props) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    const lines = [`Qui chaud pour aller voir ${title} ? 🎬`]
    if (trailerKey) lines.push(`Bande-annonce : https://youtube.com/watch?v=${trailerKey}`)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!posterPath) return
    const posterUrl = getPosterUrl(posterPath, 'w500')!
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(posterUrl)}`
    const response = await fetch(proxyUrl)
    const blob = await response.blob()
    const file = new File([blob], `${title}.jpg`, { type: blob.type })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title })
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${title}.jpg`
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }

  return (
    <div className="space-y-5">
      {posterPath && (
        <div className="relative mx-auto w-48 h-72 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
          <Image
            src={getPosterUrl(posterPath, 'w500')!}
            alt={title}
            fill
            sizes="192px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">{releaseYear}</p>
      </div>

      {overview && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className={`text-sm text-zinc-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {overview}
          </p>
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-xs text-zinc-500 active:text-zinc-300 transition-colors"
          >
            {expanded
              ? <><ChevronUp className="w-3.5 h-3.5" /> Voir moins</>
              : <><ChevronDown className="w-3.5 h-3.5" /> Voir plus</>
            }
          </button>
        </div>
      )}

      {trailerKey && (
        <p className="text-center text-xs text-zinc-500">Bande-annonce disponible 🎬</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-white py-4 rounded-xl font-semibold text-sm active:scale-[0.99] transition-all"
        >
          {copied
            ? <><Check className="w-4 h-4 text-emerald-400" /> Copié ✓</>
            : <><Copy className="w-4 h-4" /> Copier le message</>
          }
        </button>
        {posterPath && (
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-sm shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform"
          >
            <Share2 className="w-4 h-4" />
            Partager l&apos;affiche
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/movies/MovieProposalActions.tsx
git commit -m "feat: add MovieProposalActions client component"
```

---

### Task 4: Create `/propose/[tmdbId]` detail page

**Files:**
- Create: `src/app/propose/[tmdbId]/page.tsx`

- [ ] **Step 1: Create the detail page**

Create `src/app/propose/[tmdbId]/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/propose/[tmdbId]/page.tsx
git commit -m "feat: add /propose/[tmdbId] movie detail page"
```

---

### Task 5: Add "Proposer un film" link to home page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add the Megaphone icon import and link**

In `src/app/page.tsx`, the import line currently reads:
```tsx
import { Plus, LogOut, Film } from 'lucide-react';
```

Replace with:
```tsx
import { Plus, LogOut, Film, Megaphone } from 'lucide-react';
```

Then in the title row section (around line 66), the current JSX is:
```tsx
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Séances</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {movieList.length === 0 ? "Aucune en cours" : `${movieList.length} en cours`}
            </p>
          </div>
          {isAdmin && (
            <a
              href="/movies/new"
              className="flex items-center gap-1.5 bg-[#FFC426] text-[#0A0A0A] px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#FFC426]/20 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Nouvelle
            </a>
          )}
        </div>
```

Replace with:
```tsx
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Séances</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {movieList.length === 0 ? "Aucune en cours" : `${movieList.length} en cours`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/propose"
              className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
            >
              <Megaphone className="w-4 h-4" />
              Proposer
            </a>
            {isAdmin && (
              <a
                href="/movies/new"
                className="flex items-center gap-1.5 bg-[#FFC426] text-[#0A0A0A] px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#FFC426]/20 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Nouvelle
              </a>
            )}
          </div>
        </div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Proposer link to home page"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npm run dev
```

- [ ] **Step 2: Verify the golden path**

1. Open `http://localhost:3000` — confirm "Proposer" button appears in the header row
2. Click "Proposer" → lands on `/propose` with search bar
3. Type at least 3 characters (e.g. "dune") → results appear with poster + title + year
4. Click a movie → lands on `/propose/[tmdbId]` with poster, title, synopsis, two buttons
5. Click "Copier le message" → button shows "Copié ✓" for 2 seconds; paste in a text editor to verify content includes title and optionally the YouTube link
6. Click "Partager l'affiche" → on mobile: native share sheet opens; on desktop: image downloads

- [ ] **Step 3: Verify edge cases**

- Search with fewer than 3 characters → no results shown, no loading state
- Movie without a poster → "Partager l'affiche" button is hidden, only "Copier le message" shown
- Movie without a trailer → copied text has only the first line (no YouTube link)
- Navigate to `/propose/99999999` (nonexistent TMDB id) → redirects to `/propose`
