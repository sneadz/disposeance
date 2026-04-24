# Participants par film — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin de définir les participants d'une séance à la création, restreindre le vote aux participants, et afficher `x/n` dans DayVoting et TimeVoting.

**Architecture:** Colonne `participant_ids uuid[]` sur `movies`. Step 3 dans `/movies/new` pour la sélection. Vérification dans les server actions de vote. `participantCount` passé en prop serveur à DayVoting et TimeVoting.

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS

---

### Task 1 : Migration DB — ajouter `participant_ids` sur `movies`

**Files:**
- Manuel : Supabase SQL editor

- [ ] **Step 1 : Exécuter le SQL dans Supabase**

Dans le SQL editor de Supabase, exécuter :

```sql
alter table movies add column participant_ids uuid[] default '{}';
```

- [ ] **Step 2 : Vérifier**

Dans Supabase > Table editor > movies : la colonne `participant_ids` doit apparaître avec `{}` comme valeur par défaut.

---

### Task 2 : `getProfilesAction` — récupérer tous les profils

**Files:**
- Modify: `src/app/movies/new/actions.ts`

- [ ] **Step 1 : Ajouter l'action à la fin du fichier**

```ts
export async function getProfilesAction(): Promise<{ profiles: { id: string; pseudo: string }[]; error: string | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { profiles: [], error: 'Non authentifié' }

    const { data, error } = await supabase.from('profiles').select('id, pseudo').order('pseudo')
    if (error) return { profiles: [], error: error.message }
    return { profiles: data ?? [], error: null }
  } catch (e: unknown) {
    return { profiles: [], error: String(e) }
  }
}
```

- [ ] **Step 2 : Vérifier que le fichier compile**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur

---

### Task 3 : `/api/movies` — persister `participant_ids`

**Files:**
- Modify: `src/app/api/movies/route.ts`

- [ ] **Step 1 : Mettre à jour le typage du body et l'insert**

Remplacer le contenu complet de `src/app/api/movies/route.ts` :

```ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await request.json()
  const { movie, availableDates, participantIds } = body as {
    movie: { id: number; title: string; poster_path: string | null; release_date: string }
    availableDates: string[]
    participantIds: string[]
  }

  if (!movie || !availableDates || availableDates.length === 0) {
    return NextResponse.json({ error: 'Sélectionne au moins une date' }, { status: 400 })
  }

  if (!participantIds || participantIds.length === 0) {
    return NextResponse.json({ error: 'Sélectionne au moins un participant' }, { status: 400 })
  }

  const { data: rows, error: movieError } = await supabase
    .from('movies')
    .insert({
      title: movie.title,
      tmdb_id: String(movie.id),
      poster_url: movie.poster_path ?? null,
      release_date: movie.release_date || null,
      status: 'picking_days',
      participant_ids: participantIds,
    })
    .select('id')

  if (movieError) return NextResponse.json({ error: movieError.message }, { status: 500 })
  const created = rows?.[0]
  if (!created) return NextResponse.json({ error: 'Film non créé' }, { status: 500 })

  const { error: daysError } = await supabase
    .from('available_days')
    .insert(availableDates.map(date => ({ movie_id: created.id, date })))

  if (daysError) return NextResponse.json({ error: daysError.message }, { status: 500 })

  return NextResponse.json({ error: null, movieId: created.id })
}
```

- [ ] **Step 2 : Vérifier**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur

---

### Task 4 : `/movies/new/page.tsx` — ajouter l'étape 3

**Files:**
- Modify: `src/app/movies/new/page.tsx`

- [ ] **Step 1 : Remplacer le contenu complet du fichier**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Plus, Calendar, Star, Check, ChevronLeft, ChevronRight, Film, Users } from 'lucide-react'
import { searchMoviesAction, getProfilesAction } from './actions'
import type { TmdbMovie } from '@/lib/tmdb/api'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

function getWeekDays(weekOffset: number): { date: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7 + i + 1)
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    }
  })
}

function getWeekLabel(weekOffset: number): string {
  const start = new Date()
  start.setDate(start.getDate() + weekOffset * 7 + 1)
  const end = new Date()
  end.setDate(end.getDate() + weekOffset * 7 + 7)
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return `${fmt(start)} — ${fmt(end)}`
}

export default function NewMoviePage() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 3
  const [profiles, setProfiles] = useState<{ id: string; pseudo: string }[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const dates = getWeekDays(weekOffset)

  useEffect(() => {
    const run = async () => {
      if (query.length < 3) { setMovies([]); return }
      setLoadingSearch(true)
      const { movies: results } = await searchMoviesAction(query)
      setMovies(results)
      setLoadingSearch(false)
    }
    const t = setTimeout(run, 500)
    return () => clearTimeout(t)
  }, [query])

  const goToStep3 = async () => {
    setStep(3)
    setLoadingProfiles(true)
    const { profiles: data } = await getProfilesAction()
    setProfiles(data)
    setLoadingProfiles(false)
  }

  const toggleDate = (date: string) =>
    setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date])

  const toggleParticipant = (id: string) =>
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleSubmit = async () => {
    if (!selectedMovie) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: selectedMovie,
          availableDates: selectedDates,
          participantIds: selectedParticipants,
        }),
      })
      const result = await res.json()
      if (result?.error) { setError(result.error); setSubmitting(false) }
      else window.location.href = '/'
    } catch (e) {
      setError(String(e)); setSubmitting(false)
    }
  }

  /* ── Step 3 : participant selection ── */
  if (step === 3 && selectedMovie) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setStep(2)} className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-semibold">Qui participe ?</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
            {selectedMovie.poster_path && (
              <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="font-bold leading-tight">{selectedMovie.title}</p>
              <p className="text-zinc-500 text-sm">{selectedDates.length} jour{selectedDates.length > 1 ? 's' : ''} sélectionné{selectedDates.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Sélectionne les participants
            </p>

            {loadingProfiles ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map(p => {
                  const sel = selectedParticipants.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleParticipant(p.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-[0.99] min-h-[52px]',
                        sel
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      )}
                    >
                      <span className="font-semibold">{p.pseudo}</span>
                      {sel && <Check className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || selectedParticipants.length === 0}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            {submitting ? 'Création...' : `Lancer le vote — ${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </main>
    )
  }

  /* ── Step 2 : date picker ── */
  if (step === 2 && selectedMovie) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setStep(1)} className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-semibold">Choisir les jours</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
            {selectedMovie.poster_path && (
              <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="font-bold leading-tight">{selectedMovie.title}</p>
              <p className="text-zinc-500 text-sm">{selectedMovie.release_date?.split('-')[0]}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quels jours sont possibles ?</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className="p-1.5 rounded-lg text-zinc-400 disabled:opacity-30 active:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-400 min-w-[110px] text-center">{getWeekLabel(weekOffset)}</span>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="p-1.5 rounded-lg text-zinc-400 active:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {dates.map(({ date, label }) => {
                const sel = selectedDates.includes(date)
                return (
                  <button
                    key={date}
                    onClick={() => toggleDate(date)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-95 min-h-[52px]',
                      sel
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    )}
                  >
                    <span className="font-semibold text-sm">{label}</span>
                    {sel && <Check className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            onClick={goToStep3}
            disabled={selectedDates.length === 0}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            {`Suivant — ${selectedDates.length} jour${selectedDates.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </main>
    )
  }

  /* ── Step 1 : movie search ── */
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </a>
            <span className="text-base font-semibold">Nouvelle séance</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un film..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-base focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-500 transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loadingSearch && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />)}
          </div>
        )}

        {!loadingSearch && query.length >= 3 && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Film className="w-10 h-10 text-zinc-700" />
            <p className="text-zinc-500 text-sm">Aucun film trouvé pour &quot;{query}&quot;</p>
          </div>
        )}

        <div className="space-y-2">
          {movies.map(movie => (
            <button
              key={movie.id}
              onClick={() => { setSelectedMovie(movie); setStep(2) }}
              className="w-full flex items-stretch bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform text-left"
            >
              <div className="relative w-16 h-24 flex-shrink-0 bg-zinc-800">
                {movie.poster_path ? (
                  <Image src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="p-3.5 flex flex-col justify-between flex-grow min-w-0">
                <div>
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
              </div>
              <div className="flex items-center pr-3.5">
                <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-violet-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2 : Vérifier**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur

- [ ] **Step 3 : Commit intermédiaire**

```bash
git add src/app/movies/new/page.tsx src/app/movies/new/actions.ts src/app/api/movies/route.ts && git commit -m "feat: add participant selection step to movie creation"
```

---

### Task 5 : `votes.ts` — restreindre le vote aux participants

**Files:**
- Modify: `src/app/actions/votes.ts`

- [ ] **Step 1 : Ajouter la vérification dans `confirmDayVotesAction`**

Après la vérification auth, ajouter avant le delete :

```ts
  const { data: movieData } = await supabase
    .from('movies')
    .select('participant_ids')
    .eq('id', movieId)
    .single()
  if (!movieData?.participant_ids?.includes(user.id)) return { error: 'Non autorisé' }
```

Le début de `confirmDayVotesAction` devient :

```ts
export async function confirmDayVotesAction(movieId: string, selectedDates: string[]) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: movieData } = await supabase
    .from('movies')
    .select('participant_ids')
    .eq('id', movieId)
    .single()
  if (!movieData?.participant_ids?.includes(user.id)) return { error: 'Non autorisé' }

  // Delete all existing votes for this user on this movie
  const { error: delError } = await supabase
```

- [ ] **Step 2 : Ajouter la même vérification dans `confirmTimeVotesAction`**

Le début de `confirmTimeVotesAction` devient :

```ts
export async function confirmTimeVotesAction(movieId: string, showtimeIds: string[]) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: movieData } = await supabase
    .from('movies')
    .select('participant_ids')
    .eq('id', movieId)
    .single()
  if (!movieData?.participant_ids?.includes(user.id)) return { error: 'Non autorisé' }

  const { data: showtimes } = await supabase
```

- [ ] **Step 3 : Vérifier**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur

---

### Task 6 : `/movies/[id]/page.tsx` — passer `participantCount` en prop

**Files:**
- Modify: `src/app/movies/[id]/page.tsx`

- [ ] **Step 1 : Ajouter `participant_ids` à la requête movie**

Remplacer :

```ts
  const { data: movie } = await supabase
    .from("movies")
    .select("id, title, poster_url, status, final_showtime_id")
    .eq("id", params.id)
    .single();
```

Par :

```ts
  const { data: movie } = await supabase
    .from("movies")
    .select("id, title, poster_url, status, final_showtime_id, participant_ids")
    .eq("id", params.id)
    .single();
```

- [ ] **Step 2 : Calculer `participantCount` et le passer aux composants**

Ajouter après `if (!movie) notFound();` :

```ts
  const participantCount = (movie.participant_ids ?? []).length;
```

Mettre à jour les usages de `DayVoting` et `TimeVoting` :

```tsx
          {movie.status === "picking_days" && (
            <DayVoting movieId={movie.id} userId={user.id} isAdmin={isAdmin} participantCount={participantCount} />
          )}
          {movie.status === "picking_times" && (
            <TimeVoting movieId={movie.id} userId={user.id} isAdmin={isAdmin} participantCount={participantCount} />
          )}
```

- [ ] **Step 3 : Vérifier**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : erreurs TypeScript sur DayVoting et TimeVoting (prop inconnue) — normal, on les corrige dans les tasks suivantes

---

### Task 7 : `DayVoting` — afficher `x/n`

**Files:**
- Modify: `src/components/movies/DayVoting.tsx`

- [ ] **Step 1 : Ajouter `participantCount` à l'interface et aux props**

Remplacer :

```ts
interface DayVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
}
```

Par :

```ts
interface DayVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
  participantCount: number
}
```

Et la signature :

```ts
export default function DayVoting({ movieId, userId, isAdmin, participantCount }: DayVotingProps) {
```

- [ ] **Step 2 : Remplacer l'affichage du compteur dans le bouton**

Remplacer :

```tsx
                {day.userVoted
                  ? <Check className="w-4 h-4" />
                  : <span className="flex items-center gap-1 text-xs text-zinc-500"><Users className="w-3 h-3" />{day.voterCount}</span>
                }
                {day.userVoted && <span className="text-xs opacity-70">{day.voterCount}</span>}
```

Par :

```tsx
                {day.userVoted
                  ? <Check className="w-4 h-4" />
                  : <span className="flex items-center gap-1 text-xs text-zinc-500"><Users className="w-3 h-3" />{day.voterCount}/{participantCount}</span>
                }
                {day.userVoted && <span className="text-xs opacity-70">{day.voterCount}/{participantCount}</span>}
```

- [ ] **Step 3 : Vérifier**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : plus d'erreur sur DayVoting

---

### Task 8 : `TimeVoting` — afficher `x/n`

**Files:**
- Modify: `src/components/movies/TimeVoting.tsx`

- [ ] **Step 1 : Ajouter `participantCount` à l'interface et aux props**

Remplacer :

```ts
interface TimeVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
}
```

Par :

```ts
interface TimeVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
  participantCount: number
}
```

Et la signature :

```ts
export default function TimeVoting({ movieId, userId, isAdmin, participantCount }: TimeVotingProps) {
```

- [ ] **Step 2 : Remplacer l'affichage du compteur dans le bouton**

Remplacer :

```tsx
              <span className={cn('text-sm font-semibold flex items-center gap-1', st.userVoted ? 'opacity-80' : 'text-zinc-400')}>
                <Users className="w-3.5 h-3.5" />
                {st.voterCount}
              </span>
```

Par :

```tsx
              <span className={cn('text-sm font-semibold flex items-center gap-1', st.userVoted ? 'opacity-80' : 'text-zinc-400')}>
                <Users className="w-3.5 h-3.5" />
                {st.voterCount}/{participantCount}
              </span>
```

- [ ] **Step 3 : Vérifier + commit final**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur

```bash
git add src/app/actions/votes.ts src/app/movies/\[id\]/page.tsx src/components/movies/DayVoting.tsx src/components/movies/TimeVoting.tsx && git commit -m "feat: restrict voting to participants, show x/n vote counts"
```
