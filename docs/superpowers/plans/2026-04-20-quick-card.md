# Quick Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un step 4 dans le wizard de création de séance permettant de créer directement une séance confirmée (sans votes), accessible via un bouton "Faire une carte rapide" au step 3 lorsqu'une seule date a été sélectionnée.

**Architecture:** Le wizard `new/page.tsx` est étendu avec un `step 4` qui présente un sélecteur d'horaire. À la validation, un nouveau server action insère en base une séance directement `closed` (movie + available_days + showtime + final_showtime_id + time_votes par participant) puis redirige vers `/movies/[id]` qui affiche `FinalSummary` normalement, sans aucune modification des composants existants.

**Tech Stack:** Next.js 14 App Router, React `'use client'`, Supabase (server-side via `createClient`), TypeScript

---

## File Map

| Fichier | Action | Rôle |
|---|---|---|
| `src/app/movies/new/actions.ts` | Modifier | Ajouter `createQuickCardAction` |
| `src/app/movies/new/page.tsx` | Modifier | Étendre le wizard avec step 4 + bouton step 3 |

Aucun autre fichier n'est touché.

---

## Task 1 : Server action `createQuickCardAction`

**Files:**
- Modify: `src/app/movies/new/actions.ts`

**Contexte :** Le format datetime utilisé partout dans l'app est `"YYYY-MM-DDTHH:MM:00"` (pas de suffix timezone — cohérent avec `ShowtimesForm` qui fait `${date}T${time}:00`). Les `time_votes` avec `available: true` pour le `final_showtime_id` alimentent la liste des participants dans `FinalSummary`.

- [ ] **Step 1 : Ajouter `createQuickCardAction` à la fin de `src/app/movies/new/actions.ts`**

```typescript
export async function createQuickCardAction(
  movie: { id: number; title: string; poster_path: string | null; release_date: string },
  date: string,        // format "YYYY-MM-DD"
  time: string,        // format "HH:MM"
  participantIds: string[]
): Promise<{ movieId: string | null; error: string | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { movieId: null, error: 'Non authentifié' }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return { movieId: null, error: 'Accès refusé' }

    if (!participantIds || participantIds.length === 0) return { movieId: null, error: 'Sélectionne au moins un participant' }

    // 1. Créer le film directement fermé
    const { data: rows, error: movieError } = await supabase
      .from('movies')
      .insert({
        title: movie.title,
        tmdb_id: String(movie.id),
        poster_url: movie.poster_path ?? null,
        release_date: movie.release_date || null,
        status: 'closed',
        participant_ids: participantIds,
      })
      .select('id')
    if (movieError) return { movieId: null, error: movieError.message }
    const created = rows?.[0]
    if (!created) return { movieId: null, error: 'Film non créé' }

    // 2. Insérer la date disponible
    const { error: daysError } = await supabase
      .from('available_days')
      .insert({ movie_id: created.id, date })
    if (daysError) return { movieId: null, error: daysError.message }

    // 3. Insérer le showtime
    const datetime = `${date}T${time}:00`
    const { data: showtimeRows, error: showtimeError } = await supabase
      .from('showtimes')
      .insert({ movie_id: created.id, datetime })
      .select('id')
    if (showtimeError) return { movieId: null, error: showtimeError.message }
    const showtime = showtimeRows?.[0]
    if (!showtime) return { movieId: null, error: 'Showtime non créé' }

    // 4. Mettre à jour final_showtime_id
    const { error: updateError } = await supabase
      .from('movies')
      .update({ final_showtime_id: showtime.id })
      .eq('id', created.id)
    if (updateError) return { movieId: null, error: updateError.message }

    // 5. Insérer les time_votes pour chaque participant (alimente FinalSummary)
    const { error: votesError } = await supabase
      .from('time_votes')
      .insert(participantIds.map(uid => ({ user_id: uid, showtime_id: showtime.id, available: true })))
    if (votesError) return { movieId: null, error: votesError.message }

    return { movieId: created.id, error: null }
  } catch (e: unknown) {
    console.error('[createQuickCardAction]', e)
    return { movieId: null, error: String(e) }
  }
}
```

- [ ] **Step 2 : Vérifier que le fichier compile**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/app/movies/new/actions.ts
git commit -m "feat: add createQuickCardAction server action"
```

---

## Task 2 : Bouton "Carte rapide" au step 3 + Step 4 UI

**Files:**
- Modify: `src/app/movies/new/page.tsx`

**Contexte :** Le wizard utilise `step: 1 | 2 | 3` et `useState`. On étend à `1 | 2 | 3 | 4`. Le bouton "Faire une carte rapide" n'est visible au step 3 que si `selectedDates.length === 1`. Le step 4 affiche un récap film+date, un `<input type="time">`, et le bouton de soumission.

- [ ] **Step 1 : Ajouter l'import de `createQuickCardAction` et le state `selectedTime`**

En haut de `src/app/movies/new/page.tsx`, modifier la ligne d'import des actions :

```typescript
import { searchMoviesAction, getProfilesAction, createQuickCardAction } from './actions'
```

Modifier la ligne du type de step (chercher `useState<1 | 2 | 3>`) :

```typescript
const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
```

Ajouter après la ligne `const [weekOffset, setWeekOffset] = useState(0)` :

```typescript
const [selectedTime, setSelectedTime] = useState('')
const [submittingQuick, setSubmittingQuick] = useState(false)
const [quickError, setQuickError] = useState<string | null>(null)
```

- [ ] **Step 2 : Ajouter le handler `handleQuickCardSubmit`**

Ajouter après la fonction `handleSubmit` existante :

```typescript
const handleQuickCardSubmit = async () => {
  if (!selectedMovie || selectedDates.length !== 1 || !selectedTime) return
  setSubmittingQuick(true)
  setQuickError(null)
  const result = await createQuickCardAction(selectedMovie, selectedDates[0], selectedTime, selectedParticipants)
  if (result.error) {
    setQuickError(result.error)
    setSubmittingQuick(false)
  } else {
    window.location.href = `/movies/${result.movieId}`
  }
}
```

- [ ] **Step 3 : Ajouter le bouton "Faire une carte rapide" au step 3**

Dans le rendu du step 3 (chercher `{submitting ? 'Création...' : \`Lancer le vote`), ajouter après le bouton "Lancer le vote" existant, et avant la balise fermante `</div>` du `max-w-2xl` :

```tsx
{selectedDates.length === 1 && (
  <button
    onClick={() => setStep(4)}
    disabled={selectedParticipants.length === 0}
    className="w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200 py-4 rounded-xl font-semibold active:scale-[0.99] transition-all disabled:opacity-40"
  >
    <Zap className="w-4 h-4 text-[#FFC426]" />
    Faire une carte rapide
  </button>
)}
```

Ajouter `Zap` à l'import lucide-react existant :

```typescript
import { Search, Plus, Calendar, Star, Check, ChevronLeft, ChevronRight, Film, Users, Zap } from 'lucide-react'
```

- [ ] **Step 4 : Ajouter le rendu du step 4**

Ajouter le bloc suivant juste avant le bloc `/* ── Step 2 : date picker ── */` (chercher ce commentaire) :

```tsx
/* ── Step 4 : quick card — choix horaire ── */
if (step === 4 && selectedMovie && selectedDates.length === 1) {
  const dateLabel = (() => {
    const d = new Date(selectedDates[0] + 'T12:00:00')
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  })()

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => setStep(3)} className="p-1.5 text-zinc-400 active:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold">Carte rapide</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Récap film + date */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
          {selectedMovie.poster_path && (
            <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <Image src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} fill sizes="48px" className="object-cover" />
            </div>
          )}
          <div>
            <p className="font-bold leading-tight">{selectedMovie.title}</p>
            <p className="text-zinc-500 text-sm">{dateLabel} · {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Saisie horaire */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Horaire de la séance</p>
          <input
            type="time"
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white text-lg font-semibold focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors"
          />
        </div>

        {quickError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
            {quickError}
          </div>
        )}

        <button
          onClick={handleQuickCardSubmit}
          disabled={submittingQuick || !selectedTime}
          className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
        >
          {submittingQuick ? 'Création...' : 'Créer la carte'}
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 5 : Vérifier que le fichier compile**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 6 : Test manuel**

1. `npm run dev` (ou le serveur est déjà lancé)
2. Aller sur `/movies/new`
3. Sélectionner un film
4. Sélectionner **une seule date** → vérifier que le bouton "Faire une carte rapide" apparaît au step 3
5. Sélectionner **plusieurs dates** → vérifier que le bouton n'apparaît PAS au step 3
6. Avec une seule date + participants sélectionnés → cliquer "Faire une carte rapide"
7. Vérifier l'affichage du step 4 avec récap film+date+participants
8. Saisir un horaire → cliquer "Créer la carte"
9. Vérifier la redirection vers `/movies/[id]` avec `FinalSummary` affiché (séance confirmée, participants, partage, calendrier, lien)

- [ ] **Step 7 : Commit**

```bash
git add src/app/movies/new/page.tsx
git commit -m "feat: add quick card step 4 in movie creation wizard"
```
