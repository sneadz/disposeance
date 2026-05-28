# Showtime Tags & Vote Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des tags de format (IMAX/4DX/+) aux séances et un badge admin temps-réel montrant qui n'a pas encore voté.

**Architecture:** Feature 1 ajoute une colonne `tag` nullable sur `showtimes`, propagée du formulaire de saisie jusqu'à la carte finale. Feature 2 ajoute un composant `VoteStatusModal` réutilisé dans `DayVoting` et `TimeVoting`, appelant une server action pour croiser les participants du film avec leurs votes.

**Tech Stack:** Next.js App Router, Supabase (server actions + realtime), React client components, Tailwind CSS

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `supabase/migrations/20260528_add_showtime_tag.sql` | Créer — migration SQL |
| `src/lib/database.types.ts` | Modifier — ajouter `tag` à `showtimes` |
| `src/app/movies/[id]/showtimes/actions.ts` | Modifier — accepter entries avec tag |
| `src/app/movies/[id]/showtimes/ShowtimesForm.tsx` | Modifier — toggle buttons tag par horaire |
| `src/app/actions/voteStatus.ts` | Créer — server action getVoteStatusAction |
| `src/components/movies/VoteStatusModal.tsx` | Créer — badge + modale |
| `src/components/movies/DayVoting.tsx` | Modifier — intégrer VoteStatusModal |
| `src/components/movies/TimeVoting.tsx` | Modifier — tag sur horaires + VoteStatusModal |
| `src/components/summary/ShareCard.tsx` | Modifier — afficher tag |
| `src/components/summary/FinalSummary.tsx` | Modifier — recevoir et passer tag |
| `src/app/movies/[id]/page.tsx` | Modifier — fetcher tag du showtime final |

---

## Task 1 : Migration SQL + mise à jour des types

**Files:**
- Create: `supabase/migrations/20260528_add_showtime_tag.sql`
- Modify: `src/lib/database.types.ts:104-120`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- supabase/migrations/20260528_add_showtime_tag.sql
ALTER TABLE showtimes
  ADD COLUMN tag TEXT CHECK (tag IN ('IMAX', '4DX', '+'));
```

- [ ] **Step 2 : Exécuter dans Supabase**

Coller le SQL dans Supabase Dashboard → SQL Editor et exécuter.
Vérifier que la colonne apparaît dans Table Editor → `showtimes`.

- [ ] **Step 3 : Mettre à jour `database.types.ts`**

Remplacer le bloc `showtimes` (lignes 104-120) par :

```typescript
showtimes: {
  Row: {
    id: string
    movie_id: string
    datetime: string
    tag: string | null
  }
  Insert: {
    id?: string
    movie_id: string
    datetime: string
    tag?: string | null
  }
  Update: {
    id?: string
    movie_id?: string
    datetime?: string
    tag?: string | null
  }
}
```

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260528_add_showtime_tag.sql src/lib/database.types.ts
git commit -m "feat: add tag column to showtimes table"
```

---

## Task 2 : Mettre à jour `setShowtimesAction`

**Files:**
- Modify: `src/app/movies/[id]/showtimes/actions.ts`

- [ ] **Step 1 : Changer la signature et l'insert**

Remplacer le contenu entier du fichier :

```typescript
'use server'

import { createClient } from '@/lib/supabase-server'

export type ShowtimeEntry = { datetime: string; tag?: string | null }

export async function setShowtimesAction(movieId: string, entries: ShowtimeEntry[]) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Accès refusé' }

  if (!entries || entries.length === 0) return { error: 'Ajoutez au moins un horaire' }

  const { data: movie } = await supabase.from('movies').select('id, status').eq('id', movieId).single()
  if (!movie) return { error: 'Film introuvable' }
  if (movie.status !== 'picking_days') return { error: 'Ce film n\'est pas en phase de vote des jours' }

  const { error: insertError } = await supabase
    .from('showtimes')
    .insert(entries.map(e => ({ movie_id: movieId, datetime: e.datetime, tag: e.tag ?? null })))
  if (insertError) return { error: insertError.message }

  const { error: updateError } = await supabase
    .from('movies')
    .update({ status: 'picking_times' })
    .eq('id', movieId)
  if (updateError) return { error: updateError.message }

  return { error: null }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/movies/[id]/showtimes/actions.ts
git commit -m "feat: setShowtimesAction accepts tag per entry"
```

---

## Task 3 : Mettre à jour `ShowtimesForm` avec les toggles de tag

**Files:**
- Modify: `src/app/movies/[id]/showtimes/ShowtimesForm.tsx`

- [ ] **Step 1 : Ajouter l'état des tags et les helpers**

Après la ligne `const [newTimeByDay, setNewTimeByDay] = useState...` (ligne 27), ajouter :

```typescript
// Tag sélectionné par (jour, heure)
const [tagsByDay, setTagsByDay] = useState<Record<string, Record<string, string | null>>>(
  () => Object.fromEntries(allDates.map(d => [d, { '20:00': null }]))
)

// Tag pour le mode sans vote (date libre)
const [freeTagByTime, setFreeTagByTime] = useState<Record<string, string | null>>({ '20:00': null })

const TAGS = ['IMAX', '4DX', '+'] as const

const toggleTag = (date: string, time: string, tag: string) => {
  setTagsByDay(prev => ({
    ...prev,
    [date]: { ...(prev[date] ?? {}), [time]: prev[date]?.[time] === tag ? null : tag },
  }))
}

const toggleFreeTag = (time: string, tag: string) => {
  setFreeTagByTime(prev => ({ ...prev, [time]: prev[time] === tag ? null : tag }))
}
```

- [ ] **Step 2 : Mettre à jour `addTime` pour initialiser le tag**

Remplacer la fonction `addTime` :

```typescript
const addTime = (date: string) => {
  const t = newTimeByDay[date]
  if (!t || (timesByDay[date] ?? []).includes(t)) return
  setTimesByDay(prev => ({ ...prev, [date]: [...(prev[date] ?? []), t].sort() }))
  setTagsByDay(prev => ({ ...prev, [date]: { ...(prev[date] ?? {}), [t]: null } }))
  setNewTimeByDay(prev => ({ ...prev, [date]: '' }))
}
```

- [ ] **Step 3 : Mettre à jour `removeTime` pour nettoyer le tag**

Remplacer la fonction `removeTime` :

```typescript
const removeTime = (date: string, time: string) => {
  setTimesByDay(prev => ({ ...prev, [date]: (prev[date] ?? []).filter(t => t !== time) }))
  setTagsByDay(prev => {
    const updated = { ...(prev[date] ?? {}) }
    delete updated[time]
    return { ...prev, [date]: updated }
  })
}
```

- [ ] **Step 4 : Mettre à jour `handleSubmit` pour passer les tags**

Remplacer le contenu de `handleSubmit` :

```typescript
const handleSubmit = async () => {
  let entries: { datetime: string; tag?: string | null }[] = []

  if (noVotes) {
    if (!freeDate) { setError('Sélectionne une date'); return }
    if (freeTimes.length === 0) { setError('Ajoute au moins un horaire'); return }
    entries = freeTimes.map(t => ({ datetime: `${freeDate}T${t}:00`, tag: freeTagByTime[t] ?? null }))
  } else {
    if (selectedDays.length === 0) { setError('Sélectionne au moins un jour'); return }
    entries = selectedDays.flatMap(day =>
      (timesByDay[day] ?? []).map(t => ({ datetime: `${day}T${t}:00`, tag: tagsByDay[day]?.[t] ?? null }))
    )
    if (entries.length === 0) { setError('Ajoute au moins un horaire'); return }
  }

  setLoading(true)
  setError(null)
  const result = await setShowtimesAction(movieId, entries)
  if (result?.error) { setError(result.error); setLoading(false) }
  else window.location.href = `/movies/${movieId}`
}
```

- [ ] **Step 5 : Ajouter les boutons tag dans le rendu — mode sans votes (freeTimes)**

Dans le bloc `if (noVotes)`, remplacer la ligne de rendu de chaque temps dans `freeTimes.map(t => ...)` :

```tsx
{freeTimes.map(t => (
  <div key={t} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5">
    <div className="flex items-center gap-2.5">
      <Clock className="w-4 h-4 text-[#FFC426]" />
      <span className="text-lg font-bold">{t}</span>
      <div className="flex items-center gap-1">
        {TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleFreeTag(t, tag)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide transition-colors ${
              freeTagByTime[t] === tag
                ? 'bg-[#FFC426] text-[#0A0A0A]'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
    <button onClick={() => {
      setFreeTimes(p => p.filter(x => x !== t))
      setFreeTagByTime(prev => { const u = { ...prev }; delete u[t]; return u })
    }} className="p-1.5 text-zinc-600 active:text-red-400 transition-colors">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
))}
```

- [ ] **Step 6 : Ajouter les boutons tag dans le rendu — mode normal (timesByDay)**

Dans le bloc `times.map(t => ...)` (rendu des horaires par jour), remplacer :

```tsx
{times.map(t => (
  <div key={t} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5">
    <div className="flex items-center gap-2.5">
      <Clock className="w-4 h-4 text-[#FFC426]" />
      <span className="text-lg font-bold">{t}</span>
      <div className="flex items-center gap-1">
        {TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(date, t, tag)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide transition-colors ${
              tagsByDay[date]?.[t] === tag
                ? 'bg-[#FFC426] text-[#0A0A0A]'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
    <button
      onClick={() => removeTime(date, t)}
      className="p-1.5 text-zinc-600 active:text-red-400 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
))}
```

- [ ] **Step 7 : Commit**

```bash
git add src/app/movies/[id]/showtimes/ShowtimesForm.tsx
git commit -m "feat: add IMAX/4DX/+ tag toggles to showtime form"
```

---

## Task 4 : Créer `getVoteStatusAction`

**Files:**
- Create: `src/app/actions/voteStatus.ts`

- [ ] **Step 1 : Créer le fichier**

```typescript
'use server'

import { createClient } from '@/lib/supabase-server'

export type ParticipantVoteStatus = {
  pseudo: string
  voted: boolean
}

export async function getVoteStatusAction(
  movieId: string,
  phase: 'days' | 'times'
): Promise<{ participants: ParticipantVoteStatus[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { participants: [], error: 'Non authentifié' }

  const { data: movie } = await supabase
    .from('movies')
    .select('participant_ids')
    .eq('id', movieId)
    .single()
  if (!movie?.participant_ids?.length) return { participants: [] }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, pseudo')
    .in('id', movie.participant_ids)
  if (!profiles) return { participants: [] }

  let voterIds: Set<string>

  if (phase === 'days') {
    const { data: votes } = await supabase
      .from('day_votes')
      .select('user_id')
      .eq('movie_id', movieId)
    voterIds = new Set((votes ?? []).map(v => v.user_id))
  } else {
    const { data: showtimes } = await supabase
      .from('showtimes')
      .select('id')
      .eq('movie_id', movieId)
    const showtimeIds = (showtimes ?? []).map(s => s.id)
    if (showtimeIds.length === 0) {
      voterIds = new Set()
    } else {
      const { data: votes } = await supabase
        .from('time_votes')
        .select('user_id')
        .in('showtime_id', showtimeIds)
      voterIds = new Set((votes ?? []).map(v => v.user_id))
    }
  }

  const participants: ParticipantVoteStatus[] = profiles
    .map(p => ({ pseudo: p.pseudo, voted: voterIds.has(p.id) }))
    .sort((a, b) => Number(a.voted) - Number(b.voted)) // pending first

  return { participants }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/actions/voteStatus.ts
git commit -m "feat: getVoteStatusAction to list participant vote status"
```

---

## Task 5 : Créer `VoteStatusModal`

**Files:**
- Create: `src/components/movies/VoteStatusModal.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
'use client'

import { useState } from 'react'
import { X, Users } from 'lucide-react'
import { getVoteStatusAction, type ParticipantVoteStatus } from '@/app/actions/voteStatus'

interface VoteStatusModalProps {
  movieId: string
  phase: 'days' | 'times'
  votedCount: number
  totalCount: number
}

export default function VoteStatusModal({ movieId, phase, votedCount, totalCount }: VoteStatusModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState<ParticipantVoteStatus[]>([])

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    const result = await getVoteStatusAction(movieId, phase)
    setParticipants(result.participants)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold transition-colors active:bg-zinc-700"
      >
        <Users className="w-3 h-3" />
        {votedCount}/{totalCount} ont voté
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Qui a voté ?</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 active:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map(p => (
                  <div
                    key={p.pseudo}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                      p.voted
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.voted ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className={`font-semibold text-sm ${p.voted ? 'text-emerald-300' : 'text-red-300'}`}>
                      {p.pseudo}
                    </span>
                    <span className={`ml-auto text-xs ${p.voted ? 'text-emerald-500' : 'text-red-500'}`}>
                      {p.voted ? 'A voté' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/movies/VoteStatusModal.tsx
git commit -m "feat: VoteStatusModal component for admin vote tracking"
```

---

## Task 6 : Intégrer `VoteStatusModal` dans `DayVoting`

**Files:**
- Modify: `src/components/movies/DayVoting.tsx`

- [ ] **Step 1 : Ajouter l'import et le state du compteur de votants distincts**

Après les imports existants, ajouter :
```typescript
import VoteStatusModal from './VoteStatusModal'
```

Après `const [resetting, setResetting] = useState(false)` (ligne 53), ajouter :
```typescript
const [distinctVoterCount, setDistinctVoterCount] = useState(0)
```

- [ ] **Step 2 : Calculer distinctVoterCount dans `fetchData`**

À la fin de `fetchData`, juste avant `setLoading(false)`, ajouter :
```typescript
setDistinctVoterCount(new Set((dayVotes ?? []).map(v => v.user_id)).size)
```

- [ ] **Step 3 : Afficher le badge dans la section admin**

Dans la section `{isAdmin && (...)}`, ajouter le badge juste avant le bouton "Copier le lien" :

```tsx
{isAdmin && (
  <div className="pt-2 border-t border-zinc-800 space-y-2">
    <div className="flex justify-end">
      <VoteStatusModal
        movieId={movieId}
        phase="days"
        votedCount={distinctVoterCount}
        totalCount={participantCount}
      />
    </div>
    <button
      onClick={handleCopyLink}
      ...
```

- [ ] **Step 4 : Commit**

```bash
git add src/components/movies/DayVoting.tsx
git commit -m "feat: add vote status badge to DayVoting admin section"
```

---

## Task 7 : Mettre à jour `TimeVoting` (tag + VoteStatusModal)

**Files:**
- Modify: `src/components/movies/TimeVoting.tsx`

- [ ] **Step 1 : Ajouter les imports**

Ajouter à la liste des imports :
```typescript
import VoteStatusModal from './VoteStatusModal'
```

- [ ] **Step 2 : Ajouter `tag` à l'interface `Showtime`**

Remplacer l'interface `Showtime` :
```typescript
interface Showtime {
  id: string
  datetime: string
  timeLabel: string
  dateLabel: string
  voterCount: number
  userVoted: boolean
  tag: string | null
}
```

- [ ] **Step 3 : Ajouter le state `distinctVoterCount`**

Après `const [resetting, setResetting] = useState(false)`, ajouter :
```typescript
const [distinctVoterCount, setDistinctVoterCount] = useState(0)
```

- [ ] **Step 4 : Fetcher le tag et calculer distinctVoterCount dans `fetchData`**

Remplacer la ligne select showtimes :
```typescript
supabase.from('showtimes').select('id, datetime, tag').eq('movie_id', movieId).order('datetime'),
```

Dans le `.map` de `formatted`, ajouter `tag: st.tag` :
```typescript
const formatted = (stData ?? []).map(st => {
  const votes = (vData ?? []).filter(v => v.showtime_id === st.id)
  return {
    id: st.id,
    datetime: st.datetime,
    tag: st.tag ?? null,
    ...formatShowtime(st.datetime),
    voterCount: votes.length,
    userVoted: votes.some(v => v.user_id === userId),
  }
})
```

Avant `setLoading(false)`, ajouter :
```typescript
setDistinctVoterCount(new Set((vData ?? []).map(v => v.user_id)).size)
```

- [ ] **Step 5 : Propager le tag dans `displayShowtimes`**

Dans le `.map` de `displayShowtimes`, ajouter `tag: st.tag` :
```typescript
const displayShowtimes = showtimes.map(st => ({
  ...st,
  tag: st.tag,
  userVoted: confirmed ? st.userVoted : pending.has(st.id),
  voterCount: confirmed
    ? st.voterCount
    : st.voterCount - (st.userVoted ? 1 : 0) + (pending.has(st.id) ? 1 : 0),
}))
```

- [ ] **Step 6 : Afficher le tag sur chaque horaire**

Dans le rendu du bouton de vote (après `<p className="text-xl font-bold leading-none">{st.timeLabel}</p>`), ajouter :
```tsx
{st.tag && (
  <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.5 rounded ${
    st.userVoted ? 'bg-black/20 text-[#0A0A0A]' : 'bg-zinc-700 text-zinc-300'
  }`}>
    {st.tag}
  </span>
)}
```

- [ ] **Step 7 : Ajouter le badge VoteStatusModal dans la section admin**

Dans `{isAdmin && (...)}`, ajouter juste avant le bouton "Copier le lien" :
```tsx
<div className="flex justify-end">
  <VoteStatusModal
    movieId={movieId}
    phase="times"
    votedCount={distinctVoterCount}
    totalCount={participantCount}
  />
</div>
```

- [ ] **Step 8 : Commit**

```bash
git add src/components/movies/TimeVoting.tsx
git commit -m "feat: display showtime tag and vote status badge in TimeVoting"
```

---

## Task 8 : Afficher le tag dans `ShareCard`

**Files:**
- Modify: `src/components/summary/ShareCard.tsx`

- [ ] **Step 1 : Ajouter `tag` aux props**

Remplacer l'interface `ShareCardProps` :
```typescript
interface ShareCardProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  tag?: string | null
  participants: string[]
  guests: string[]
}
```

Ajouter `tag` à la destructuration :
```typescript
export default function ShareCard({ movieTitle, posterUrl, day, time, tag, participants, guests }: ShareCardProps) {
```

- [ ] **Step 2 : Afficher le tag dans le bloc date/heure**

Après la ligne `<p style={{ margin: 0, fontSize: '36px', ... }}>{time}</p>`, ajouter :
```tsx
{tag && (
  <span style={{
    display: 'inline-block',
    marginTop: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#FFC426',
    backgroundColor: 'rgba(255,196,38,0.12)',
    border: '1px solid rgba(255,196,38,0.3)',
    padding: '2px 8px',
    borderRadius: '6px',
  }}>
    {tag}
  </span>
)}
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/summary/ShareCard.tsx
git commit -m "feat: display showtime tag on ShareCard"
```

---

## Task 9 : Passer le tag depuis `page.tsx` → `FinalSummary` → `ShareCard`

**Files:**
- Modify: `src/app/movies/[id]/page.tsx`
- Modify: `src/components/summary/FinalSummary.tsx`

- [ ] **Step 1 : Fetcher le tag dans `page.tsx`**

Ajouter `finalShowtimeTag` après la déclaration `let finalDatetime` (ligne 45) :
```typescript
let finalDatetime: string | null = null
let finalShowtimeTag: string | null = null
let participants: string[] = [];
```

Dans le bloc `if (movie.status === "closed" && movie.final_showtime_id)`, remplacer le select du showtime :
```typescript
const { data: showtime } = await supabase
  .from('showtimes')
  .select('datetime, tag')
  .eq('id', movie.final_showtime_id)
  .single()
finalDatetime = showtime?.datetime ?? null
finalShowtimeTag = showtime?.tag ?? null
```

Passer `tag` à `FinalSummary` :
```tsx
<FinalSummary
  movieTitle={movie.title}
  posterUrl={getPosterUrl(movie.poster_url, 'w200')}
  finalDatetime={finalDatetime}
  tag={finalShowtimeTag}
  participants={participants}
  guests={guests}
  isAdmin={isAdmin}
  movieId={movie.id}
  onReset={resetMovie}
/>
```

- [ ] **Step 2 : Mettre à jour `FinalSummaryProps`**

Dans `FinalSummary.tsx`, ajouter `tag` à l'interface :
```typescript
interface FinalSummaryProps {
  movieTitle: string
  posterUrl: string | null
  finalDatetime: string
  tag?: string | null
  participants: string[]
  guests: string[]
  isAdmin: boolean
  movieId: string
  onReset: () => void
}
```

Ajouter `tag` à la destructuration :
```typescript
export default function FinalSummary({ movieTitle, posterUrl, finalDatetime, tag, participants, guests, isAdmin, movieId, onReset }: FinalSummaryProps) {
```

Passer `tag` à `ShareCard` :
```tsx
<ShareCard
  movieTitle={movieTitle}
  posterUrl={posterUrl}
  day={day}
  time={time}
  tag={tag}
  participants={participants}
  guests={guests}
/>
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/movies/[id]/page.tsx src/components/summary/FinalSummary.tsx
git commit -m "feat: propagate showtime tag to ShareCard via FinalSummary"
```
