# Ex-æquo Jours & Horaires Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quand plusieurs jours sont à égalité dans le vote, l'admin peut saisir des horaires indépendants par jour ; la page de vote horaires affiche ensuite les créneaux groupés par jour.

**Architecture:** `showtimes/page.tsx` calcule tous les jours ex-æquo et les passe à `ShowtimesForm` (refactorisé) qui gère un état `timesByDay` (Record<date, string[]>) avec sélection par jour. `TimeVoting` groupe visuellement les créneaux par `dateLabel`. Aucun changement de schéma DB ni d'action serveur.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, Supabase

---

### Task 1 : Calcul des jours ex-æquo dans `showtimes/page.tsx`

**Files:**
- Modify: `src/app/movies/[id]/showtimes/page.tsx`

- [ ] **Step 1 : Remplacer le calcul `winningDate` par `tiedDates`**

Remplacer le bloc de calcul actuel (lignes 27-29) et la prop passée à `ShowtimesForm` :

```tsx
// Avant
const winningDate = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
```

```tsx
// Après — dans SelectShowtimesPage, remplacer tout le bloc counts+winningDate :
const counts: Record<string, number> = {}
for (const v of dayVotes ?? []) counts[v.date] = (counts[v.date] ?? 0) + 1

const maxVotes = Math.max(...Object.values(counts), 0)
const tiedDates: { date: string; label: string; votes: number }[] =
  maxVotes > 0
    ? Object.entries(counts)
        .filter(([, v]) => v === maxVotes)
        .map(([date, votes]) => ({ date, label: formatDate(date), votes }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : []
```

- [ ] **Step 2 : Mettre à jour l'affichage du bandeau "jour le plus voté"**

Remplacer le bloc JSX conditionnel `{winningDate ? ... : ...}` :

```tsx
{tiedDates.length > 0 ? (
  <div className={`rounded-2xl p-4 flex items-center gap-3 ${
    tiedDates.length > 1
      ? 'bg-amber-500/10 border border-amber-500/20'
      : 'bg-violet-600/10 border border-violet-500/20'
  }`}>
    <span className="text-2xl">{tiedDates.length > 1 ? '⚖️' : '📅'}</span>
    <div>
      <p className={`text-xs uppercase font-semibold tracking-wider ${
        tiedDates.length > 1 ? 'text-amber-300' : 'text-violet-300'
      }`}>
        {tiedDates.length > 1
          ? `${tiedDates.length} jours ex-æquo — ${tiedDates[0].votes} vote${tiedDates[0].votes > 1 ? 's' : ''} chacun`
          : 'Jour le plus voté'}
      </p>
      <p className="text-xl font-bold mt-0.5">
        {tiedDates.map(d => d.label).join(' · ')}
      </p>
    </div>
  </div>
) : (
  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300 text-sm">
    Aucun vote pour le moment — tu peux quand même saisir des horaires.
  </div>
)}
```

- [ ] **Step 3 : Mettre à jour la prop passée à `ShowtimesForm`**

```tsx
// Avant
<ShowtimesForm movieId={params.id} winningDate={winningDate ?? ''} />

// Après
<ShowtimesForm movieId={params.id} tiedDates={tiedDates} />
```

- [ ] **Step 4 : Commit**

```bash
git add src/app/movies/[id]/showtimes/page.tsx
git commit -m "feat: compute tied days for ex-aequo showtime entry"
```

---

### Task 2 : Refactoriser `ShowtimesForm` pour la saisie par jour

**Files:**
- Modify: `src/app/movies/[id]/showtimes/ShowtimesForm.tsx`

- [ ] **Step 1 : Mettre à jour l'interface et l'état initial**

Remplacer entièrement le contenu de `ShowtimesForm.tsx` :

```tsx
'use client'

import { useState } from 'react'
import { setShowtimesAction } from './actions'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'

interface TiedDate { date: string; label: string; votes: number }

export default function ShowtimesForm({
  movieId,
  tiedDates,
}: {
  movieId: string
  tiedDates: TiedDate[]
}) {
  const allDates = tiedDates.map(d => d.date)

  // Jours sélectionnés par l'admin (tous cochés par défaut)
  const [selectedDays, setSelectedDays] = useState<string[]>(allDates)

  // Horaires par jour
  const [timesByDay, setTimesByDay] = useState<Record<string, string[]>>(
    () => Object.fromEntries(allDates.map(d => [d, ['20:00']]))
  )

  // Input heure en cours par jour
  const [newTimeByDay, setNewTimeByDay] = useState<Record<string, string>>(
    () => Object.fromEntries(allDates.map(d => [d, '']))
  )

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const toggleDay = (date: string) => {
    setSelectedDays(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const addTime = (date: string) => {
    const t = newTimeByDay[date]
    if (!t || (timesByDay[date] ?? []).includes(t)) return
    setTimesByDay(prev => ({
      ...prev,
      [date]: [...(prev[date] ?? []), t].sort(),
    }))
    setNewTimeByDay(prev => ({ ...prev, [date]: '' }))
  }

  const removeTime = (date: string, time: string) => {
    setTimesByDay(prev => ({
      ...prev,
      [date]: (prev[date] ?? []).filter(t => t !== time),
    }))
  }

  const handleSubmit = async () => {
    if (selectedDays.length === 0) {
      setError('Sélectionne au moins un jour')
      return
    }
    const datetimes = selectedDays.flatMap(day =>
      (timesByDay[day] ?? []).map(t => `${day}T${t}:00`)
    )
    if (datetimes.length === 0) {
      setError('Ajoute au moins un horaire')
      return
    }
    setLoading(true)
    setError(null)
    const result = await setShowtimesAction(movieId, datetimes)
    if (result?.error) { setError(result.error); setLoading(false) }
    else window.location.href = `/movies/${movieId}`
  }

  const hasMultipleDays = allDates.length > 1

  return (
    <div className="space-y-5">
      {/* Sélecteur de jours — uniquement si ex-æquo */}
      {hasMultipleDays && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Jours à proposer
          </p>
          <div className="flex flex-wrap gap-2">
            {tiedDates.map(d => {
              const isSelected = selectedDays.includes(d.date)
              return (
                <button
                  key={d.date}
                  onClick={() => toggleDay(d.date)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Saisie des horaires par jour sélectionné */}
      {allDates
        .filter(date => selectedDays.includes(date))
        .map(date => {
          const d = tiedDates.find(td => td.date === date)!
          const times = timesByDay[date] ?? []
          return (
            <div key={date} className="space-y-2">
              {hasMultipleDays && (
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {d.label}
                </p>
              )}
              {!hasMultipleDays && (
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Horaires proposés
                </p>
              )}

              <div className="space-y-2">
                {times.map(t => (
                  <div
                    key={t}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span className="text-lg font-bold">{t}</span>
                    </div>
                    <button
                      onClick={() => removeTime(date, t)}
                      className="p-1.5 text-zinc-600 active:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="time"
                  value={newTimeByDay[date] ?? ''}
                  onChange={e =>
                    setNewTimeByDay(prev => ({ ...prev, [date]: e.target.value }))
                  }
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
                <button
                  onClick={() => addTime(date)}
                  className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-semibold active:bg-zinc-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )
        })}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selectedDays.length === 0}
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform disabled:opacity-40"
      >
        {loading ? 'Enregistrement...' : 'Lancer le vote des horaires →'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier que le build TypeScript ne remonte aucune erreur**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -30
```

Attendu : aucune erreur sur les fichiers modifiés.

- [ ] **Step 3 : Commit**

```bash
git add src/app/movies/[id]/showtimes/ShowtimesForm.tsx
git commit -m "feat: per-day time entry for ex-aequo showtime selection"
```

---

### Task 3 : Grouper les créneaux par jour dans `TimeVoting`

**Files:**
- Modify: `src/components/movies/TimeVoting.tsx`

- [ ] **Step 1 : Remplacer la liste plate par un rendu groupé par jour**

Localiser le bloc `<div className="space-y-2">` qui rend `displayShowtimes.map(...)` (autour de la ligne 167) et le remplacer :

```tsx
{/* Regroupement par jour */}
{(() => {
  // Grouper par dateLabel en préservant l'ordre
  const groups: { dateLabel: string; items: typeof displayShowtimes }[] = []
  for (const st of displayShowtimes) {
    const last = groups[groups.length - 1]
    if (last && last.dateLabel === st.dateLabel) {
      last.items.push(st)
    } else {
      groups.push({ dateLabel: st.dateLabel, items: [st] })
    }
  }
  const multiDay = groups.length > 1
  return (
    <div className="space-y-4">
      {groups.map(group => (
        <div key={group.dateLabel} className="space-y-2">
          {multiDay && (
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
              {group.dateLabel}
            </p>
          )}
          {group.items.map(st => (
            <button
              key={st.id}
              onClick={() => isParticipant && !confirmed && togglePending(st.id)}
              disabled={!isParticipant || confirmed}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all min-h-[60px]',
                st.userVoted
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300',
                isParticipant && !confirmed && 'active:scale-[0.99] cursor-pointer',
                (!isParticipant || confirmed) && 'cursor-default',
              )}
            >
              <div className="text-left">
                <p className="text-xl font-bold leading-none">{st.timeLabel}</p>
                {!multiDay && (
                  <p className="text-xs mt-0.5 opacity-60">{st.dateLabel}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-semibold flex items-center gap-1', st.userVoted ? 'opacity-80' : 'text-zinc-400')}>
                  <Users className="w-3.5 h-3.5" />
                  {st.voterCount}/{participantCount}
                </span>
                {st.userVoted && <Check className="w-5 h-5" />}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
})()}
```

Note : quand il n'y a qu'un seul jour (`multiDay = false`), la `dateLabel` reste affichée sous l'heure dans chaque carte (comportement actuel). Quand il y a plusieurs jours, elle passe en header de groupe et disparaît des cartes.

- [ ] **Step 2 : Vérifier le build**

```bash
cd /Users/robinperso/Documents/perso/disposeance && npx tsc --noEmit 2>&1 | head -30
```

Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/movies/TimeVoting.tsx
git commit -m "feat: group showtimes by day in time voting UI"
```

---

### Task 4 : Mettre à jour PLAN.md et CONTEXT.md

**Files:**
- Modify: `PLAN.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1 : Marquer le TODO comme complété dans PLAN.md**

Dans `PLAN.md`, remplacer la section `### 3. Choix du jour quand ex-æquo` par :

```markdown
### ~~3. Ex-æquo jours & horaires par jour~~ ✅ Complété
- Jours ex-æquo affichés avec badge ⚖️ et score sur la page saisie horaires.
- Sélecteur de jours (toggle) visible uniquement si ≥ 2 jours ex-æquo.
- Saisie d'horaires indépendante par jour sélectionné.
- Vote horaires groupé par jour avec header de date quand plusieurs jours.
```

- [ ] **Step 2 : Ajouter les entrées dans CONTEXT.md**

Ajouter après la dernière entrée `- [x]` :

```markdown
- [x] Ex-æquo jours : page saisie horaires détecte les jours à égalité, affiche badge ⚖️ et sélecteur de jours
- [x] Saisie horaires par jour : chaque jour sélectionné a sa propre liste d'horaires indépendante
- [x] Vote horaires groupé par jour : headers de date quand plusieurs jours, dateLabel dans carte sinon
```

- [ ] **Step 3 : Commit**

```bash
git add PLAN.md CONTEXT.md
git commit -m "docs: mark ex-aequo feature as complete"
```
