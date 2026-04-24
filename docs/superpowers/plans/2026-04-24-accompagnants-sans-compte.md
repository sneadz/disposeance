# Accompagnants sans compte — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin d'ajouter des prénoms libres (accompagnants sans compte) lors de la création d'une séance, qui apparaissent sur la carte finale avec un style visuel distinct.

**Architecture:** Colonne `guests text[]` sur la table `movies`. Les accompagnants sont saisis dans l'étape "Qui participe ?" (step 3) et dans la carte rapide (step 4), transmis à la création, et affichés dans `ShareCard` avec des pills ghost distincts des participants avec compte.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (PostgreSQL), Tailwind CSS

---

### Task 1 : Migration DB — colonne `guests` sur `movies`

**Files:**
- No file — exécuter en SQL dans Supabase

- [ ] **Step 1 : Ajouter la colonne dans Supabase**

Dans le SQL Editor de Supabase (ou via migration), exécuter :

```sql
ALTER TABLE movies ADD COLUMN guests text[] NOT NULL DEFAULT '{}';
```

- [ ] **Step 2 : Vérifier que la colonne existe**

Dans l'interface Supabase → Table Editor → `movies`, vérifier que la colonne `guests` de type `text[]` est présente avec la valeur par défaut `{}`.

- [ ] **Step 3 : Commit**

```bash
git add .
git commit -m "feat: add guests column to movies table"
```

---

### Task 2 : `ShareCard` — prop `guests` + pills ghost

**Files:**
- Modify: `src/components/summary/ShareCard.tsx`

- [ ] **Step 1 : Ajouter la prop `guests` et les pills ghost**

Remplacer entièrement `src/components/summary/ShareCard.tsx` :

```tsx
import { Film, Check, Calendar, Users } from 'lucide-react'

interface ShareCardProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  participants: string[]
  guests: string[]
}

export default function ShareCard({ movieTitle, posterUrl, day, time, participants, guests }: ShareCardProps) {
  const hasGuests = guests.length > 0
  const hasParticipants = participants.length > 0

  return (
    <div
      id="share-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#0A0A0A',
        boxShadow: '0 8px 24px rgba(255,196,38,0.15)',
        width: '100%',
      }}
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '4px', alignSelf: 'stretch', borderRadius: '9999px', backgroundColor: '#FFC426', minHeight: '40px', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.025em', color: '#FFC426' }}>DispoSéance</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '9999px', backgroundColor: '#FFC426', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check style={{ width: '14px', height: '14px', color: '#0A0A0A' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFC426' }}>{'C\'est confirmé\u00a0!'}</span>
          </div>
        </div>

        {/* Movie info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '56px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#1A1A1A' }}>
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt={movieTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Film style={{ width: '24px', height: '24px', color: '#555' }} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>Film</p>
            <h2 style={{ margin: 0, fontWeight: 700, lineHeight: 1.2, color: '#fff', fontSize: movieTitle.length > 30 ? '16px' : '20px' }}>{movieTitle}</h2>
          </div>
        </div>

        {/* Date & time block */}
        <div style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Calendar style={{ width: '14px', height: '14px', flexShrink: 0, color: '#FFC426' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#888' }}>{day}</p>
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>{time}</p>
        </div>

        {/* Participants + guests */}
        {(hasParticipants || hasGuests) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Users style={{ width: '14px', height: '14px', flexShrink: 0, color: '#FFC426' }} />
              <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: '#555' }}>
                {participants.length === 1 ? '1 participant' : `${participants.length} participants`}
                {hasGuests && ` + ${guests.length} accompagnant${guests.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {participants.map((pseudo) => (
                <span
                  key={pseudo}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255,196,38,0.12)',
                    border: '1px solid rgba(255,196,38,0.25)',
                    color: '#FFC426',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                  }}
                >
                  {pseudo}
                </span>
              ))}
              {guests.map((name) => (
                <span
                  key={name}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'transparent',
                    border: '1px dashed #444',
                    color: '#888',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur sur `ShareCard.tsx`. Il y aura des erreurs sur les fichiers qui passent `guests` (pas encore mis à jour) — c'est normal, on les corrige dans les tâches suivantes.

- [ ] **Step 3 : Commit**

```bash
git add src/components/summary/ShareCard.tsx
git commit -m "feat: add guests prop to ShareCard with ghost pill style"
```

---

### Task 3 : `FinalSummary` — prop `guests`

**Files:**
- Modify: `src/components/summary/FinalSummary.tsx`

- [ ] **Step 1 : Ajouter `guests` dans l'interface et la passer à ShareCard**

Modifier `src/components/summary/FinalSummary.tsx` :

```tsx
// Remplacer l'interface FinalSummaryProps
interface FinalSummaryProps {
  movieTitle: string
  posterUrl: string | null
  finalDatetime: string
  participants: string[]
  guests: string[]
  isAdmin: boolean
  movieId: string
  onReset: () => void
}

// Remplacer la signature de la fonction
export default function FinalSummary({ movieTitle, posterUrl, finalDatetime, participants, guests, isAdmin, movieId, onReset }: FinalSummaryProps) {
```

Puis dans le JSX, mettre à jour l'appel à `ShareCard` (autour de la ligne 128) :

```tsx
<ShareCard
  movieTitle={movieTitle}
  posterUrl={posterUrl}
  day={day}
  time={time}
  participants={participants}
  guests={guests}
/>
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : plus d'erreur sur `FinalSummary.tsx` ni `ShareCard.tsx`. Erreurs restantes uniquement sur `movies/[id]/page.tsx`.

- [ ] **Step 3 : Commit**

```bash
git add src/components/summary/FinalSummary.tsx
git commit -m "feat: thread guests prop through FinalSummary"
```

---

### Task 4 : `movies/[id]/page.tsx` — fetch `guests` et passage à `FinalSummary`

**Files:**
- Modify: `src/app/movies/[id]/page.tsx`

- [ ] **Step 1 : Ajouter `guests` dans la query du film et le passer à FinalSummary**

Dans `src/app/movies/[id]/page.tsx`, modifier la query `movies` (ligne 33) pour inclure `guests` :

```tsx
const { data: movie } = await supabase
  .from("movies")
  .select("id, title, poster_url, status, final_showtime_id, participant_ids, guests")
  .eq("id", params.id)
  .single();
```

Puis ajouter la variable `guests` juste après la déclaration de `participants` (ligne 45) :

```tsx
let finalDatetime: string | null = null;
let participants: string[] = [];
const guests: string[] = movie.guests ?? [];
```

Puis mettre à jour l'appel à `FinalSummary` (autour de la ligne 147) :

```tsx
{movie.status === "closed" && finalDatetime && (
  <FinalSummary
    movieTitle={movie.title}
    posterUrl={getPosterUrl(movie.poster_url, 'w200')}
    finalDatetime={finalDatetime}
    participants={participants}
    guests={guests}
    isAdmin={isAdmin}
    movieId={movie.id}
    onReset={resetMovie}
  />
)}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : zéro erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/app/movies/[id]/page.tsx
git commit -m "feat: fetch and display guests on movie final summary"
```

---

### Task 5 : `api/movies/route.ts` — accepter `guests`

**Files:**
- Modify: `src/app/api/movies/route.ts`

- [ ] **Step 1 : Accepter `guests` dans le body et l'insérer en DB**

Dans `src/app/api/movies/route.ts`, modifier le destructuring du body (ligne 13) :

```tsx
const { movie, availableDates, participantIds, guests } = body as {
  movie: { id: number; title: string; poster_path: string | null; release_date: string }
  availableDates: string[]
  participantIds: string[]
  guests: string[]
}
```

Puis ajouter `guests` dans l'insert `movies` (ligne 29) :

```tsx
const { data: rows, error: movieError } = await supabase
  .from('movies')
  .insert({
    title: movie.title,
    tmdb_id: String(movie.id),
    poster_url: movie.poster_path ?? null,
    release_date: movie.release_date || null,
    status: 'picking_days',
    participant_ids: participantIds,
    guests: guests ?? [],
  })
  .select('id')
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : zéro erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/movies/route.ts
git commit -m "feat: accept guests in POST /api/movies"
```

---

### Task 6 : `createQuickCardAction` — accepter `guests`

**Files:**
- Modify: `src/app/movies/new/actions.ts`

- [ ] **Step 1 : Ajouter `guests` en paramètre et dans l'insert**

Dans `src/app/movies/new/actions.ts`, modifier la signature de `createQuickCardAction` (ligne 75) :

```tsx
export async function createQuickCardAction(
  movie: { id: number; title: string; poster_path: string | null; release_date: string },
  date: string,
  time: string,
  participantIds: string[],
  guests: string[]
): Promise<{ movieId: string | null; error: string | null }> {
```

Puis ajouter `guests` dans l'insert `movies` (ligne 94) :

```tsx
const { data: rows, error: movieError } = await supabase
  .from('movies')
  .insert({
    title: movie.title,
    tmdb_id: String(movie.id),
    poster_url: movie.poster_path ?? null,
    release_date: movie.release_date || null,
    status: 'closed',
    participant_ids: participantIds,
    guests: guests ?? [],
  })
  .select('id')
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : erreur sur `page.tsx` car `createQuickCardAction` est appelée sans le nouveau paramètre — c'est attendu, on corrige à la tâche suivante.

- [ ] **Step 3 : Commit**

```bash
git add src/app/movies/new/actions.ts
git commit -m "feat: accept guests in createQuickCardAction"
```

---

### Task 7 : `movies/new/page.tsx` — UI saisie des accompagnants (step 3 + step 4)

**Files:**
- Modify: `src/app/movies/new/page.tsx`

- [ ] **Step 1 : Ajouter le state `guests` et `guestInput`**

Dans le composant `NewMoviePage`, ajouter deux états après `selectedParticipants` (ligne 46) :

```tsx
const [guests, setGuests] = useState<string[]>([])
const [guestInput, setGuestInput] = useState('')
```

- [ ] **Step 2 : Ajouter la fonction `addGuest` et `removeGuest`**

Après `toggleParticipant` (ligne 80) :

```tsx
const addGuest = () => {
  const name = guestInput.trim()
  if (!name || guests.includes(name)) return
  setGuests(prev => [...prev, name])
  setGuestInput('')
}

const removeGuest = (name: string) =>
  setGuests(prev => prev.filter(g => g !== name))
```

- [ ] **Step 3 : Passer `guests` dans le handleSubmit (flow normal)**

Dans `handleSubmit` (ligne 82), ajouter `guests` dans le body :

```tsx
body: JSON.stringify({
  movie: selectedMovie,
  availableDates: selectedDates,
  participantIds: selectedParticipants,
  guests,
}),
```

- [ ] **Step 4 : Passer `guests` dans `handleQuickCardSubmit`**

Dans `handleQuickCardSubmit` (ligne 104), mettre à jour l'appel à `createQuickCardAction` :

```tsx
const result = await createQuickCardAction(selectedMovie, selectedDates[0], selectedTime, selectedParticipants, guests)
```

- [ ] **Step 5 : Ajouter la section accompagnants dans le step 3**

Dans le rendu du step 3 (juste avant le bouton d'erreur `{error && ...}`, après la liste des participants), ajouter :

```tsx
{/* Section accompagnants sans compte */}
<div className="space-y-2">
  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
    + Sans compte (copines, famille…)
  </p>

  {guests.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {guests.map(name => (
        <button
          key={name}
          onClick={() => removeGuest(name)}
          className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-semibold px-3 py-1.5 rounded-full active:opacity-70 transition-opacity"
        >
          {name}
          <span className="text-zinc-500 text-xs">✕</span>
        </button>
      ))}
    </div>
  )}

  <div className="flex gap-2">
    <input
      type="text"
      value={guestInput}
      onChange={e => setGuestInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGuest() } }}
      placeholder="Ajouter un prénom…"
      className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors text-sm"
    />
    <button
      onClick={addGuest}
      className="bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl font-semibold text-sm active:bg-zinc-700 transition-colors"
    >
      OK
    </button>
  </div>
</div>
```

- [ ] **Step 6 : Ajouter la même section dans le step 4 (quick card)**

Dans le rendu du step 4, après le bloc "Saisie horaire" et avant `{quickError && ...}`, ajouter la même section :

```tsx
{/* Section accompagnants sans compte */}
<div className="space-y-2">
  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
    + Sans compte (copines, famille…)
  </p>

  {guests.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {guests.map(name => (
        <button
          key={name}
          onClick={() => removeGuest(name)}
          className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-semibold px-3 py-1.5 rounded-full active:opacity-70 transition-opacity"
        >
          {name}
          <span className="text-zinc-500 text-xs">✕</span>
        </button>
      ))}
    </div>
  )}

  <div className="flex gap-2">
    <input
      type="text"
      value={guestInput}
      onChange={e => setGuestInput(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGuest() } }}
      placeholder="Ajouter un prénom…"
      className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors text-sm"
    />
    <button
      onClick={addGuest}
      className="bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl font-semibold text-sm active:bg-zinc-700 transition-colors"
    >
      OK
    </button>
  </div>
</div>
```

- [ ] **Step 7 : Vérifier le build TypeScript complet**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : zéro erreur TypeScript.

- [ ] **Step 8 : Vérifier le build Next.js**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npm run build 2>&1 | tail -20
```

Attendu : `✓ Compiled successfully`

- [ ] **Step 9 : Commit**

```bash
git add src/app/movies/new/page.tsx
git commit -m "feat: add guests input in participant selection (step 3 + quick card)"
```
