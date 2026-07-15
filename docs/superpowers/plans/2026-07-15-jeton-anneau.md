# Jeton de l'Anneau Unique — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un pipeline « jeton » (thème Anneau Unique) : 3 personnes désignées peuvent forcer une séance ciné, une fois par trimestre, en réutilisant tout le pipeline de vote existant avec une DA différente.

**Architecture:** Le film-jeton est un film normal avec une colonne `token_owner_id` renseignée. Une mini-table `token_spends` (contrainte `UNIQUE(user_id, quarter)`) sert de registre anti-triche. Le droit de créer un film-jeton, y compris pour un non-admin, est validé côté serveur dans `POST /api/movies` puis exécuté via le client service-role (car la RLS `movies` est réservée aux admins). L'entrée est un bouton flottant (vidéo `token.mp4`) visible seulement quand le jeton est disponible. La DA LOTR habille le FAB, la carte du film en liste, la carte finale partageable ; les écrans de vote gardent leur design + un marqueur discret.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + RLS, `@supabase/ssr`), Tailwind, vitest (nouveau, tests logique pure uniquement).

## Global Constraints

- **Les 3 porteurs** identifiés par `profiles.can_use_token = true` (indépendant de `is_admin`).
- **1 jeton / personne / trimestre calendaire.** Trimestres : Q1 jan–mars, Q2 avr–juin, Q3 juil–sept, Q4 oct–déc. Format quarter : `"YYYY-Q{1..4}"`.
- **Jeton dépensé = définitif** : supprimer le film ne rend pas le jeton (le registre `token_spends` survit).
- **Sécurité serveur d'abord** : ne jamais se fier au masquage du FAB. Toute la règle est ré-appliquée dans `POST /api/movies`.
- **La RLS `movies` n'autorise l'écriture qu'aux admins** → le chemin token insère via `createAdminClient()` (service role) après validation en code.
- **Réutilisation** : aucun écran de vote dupliqué. Colonne + rendu conditionnel.
- **DA** : les classes/markup LOTR viennent de Claude Design. Les composants créés ici partent d'un habillage or fonctionnel basé sur les tokens existants (`accent` #FFC426, `accent-glow`), avec un emplacement clair pour coller l'export Claude Design.
- **Trimestre = temps serveur** : calculé avec `new Date()` côté serveur (server components / route handler).

---

## File Structure

- `supabase/migrations/20260715_token_ring.sql` — **create** — colonnes + table + RLS.
- `supabase/schema.sql` — **modify** — refléter le schéma canonique.
- `vitest.config.ts` — **create** — config minimale (env node).
- `package.json` — **modify** — dev-dep vitest + script `test`.
- `src/lib/quarter.ts` — **create** — `currentQuarter(date)` pur.
- `src/lib/quarter.test.ts` — **create** — tests.
- `src/lib/token.ts` — **create** — `canSpendToken(...)` pur + `getTokenAvailability(supabase, userId)` serveur.
- `src/lib/token.test.ts` — **create** — tests de `canSpendToken`.
- `src/app/api/movies/route.ts` — **modify** — branche token (validation + service-role insert).
- `src/app/movies/new/page.tsx` — **modify** — lire `?token=1`, l'envoyer au POST, afficher le marqueur.
- `src/components/movies/RingBadge.tsx` — **create** — marqueur « ⌾ Séance de l'Anneau ».
- `src/components/movies/TokenFab.tsx` — **create** — bouton flottant vidéo.
- `src/components/movies/TokenMovieCard.tsx` — **create** — carte film-jeton (liste accueil).
- `src/app/page.tsx` — **modify** — calcul dispo + rendu FAB + `token_owner_id` dans la requête + carte conditionnelle.
- `src/app/movies/[id]/page.tsx` — **modify** — lire `token_owner_id`, marqueur en header, passer `isRing` à FinalSummary.
- `src/components/summary/FinalSummary.tsx` — **modify** — prop `isRing`, la propager.
- `src/components/summary/ShareCard.tsx` — **modify** — prop `isRing`, variante LOTR.

---

## Task 1: Migration base de données

**Files:**
- Create: `supabase/migrations/20260715_token_ring.sql`
- Modify: `supabase/schema.sql` (ajouter les mêmes objets à la fin, section « Token »)

**Interfaces:**
- Produces (schéma pour tout le reste) :
  - `profiles.can_use_token boolean not null default false`
  - `movies.token_owner_id uuid null references profiles(id)`
  - table `token_spends(user_id uuid, quarter text, created_at timestamptz)`, `unique(user_id, quarter)`

- [ ] **Step 1: Écrire la migration**

Create `supabase/migrations/20260715_token_ring.sql` :

```sql
-- Jeton de l'Anneau Unique

alter table profiles add column if not exists can_use_token boolean not null default false;

alter table movies add column if not exists token_owner_id uuid references profiles(id);

create table if not exists token_spends (
  user_id uuid not null references profiles(id),
  quarter text not null,
  created_at timestamptz not null default now(),
  unique (user_id, quarter)
);

alter table token_spends enable row level security;

-- lecture ouverte (sert au calcul de dispo côté serveur, comme movies)
create policy "token_spends_readable_by_everyone" on token_spends
  for select using (true);

-- écriture uniquement via service-role (aucune policy d'insert => bloqué pour les users authentifiés)
```

- [ ] **Step 2: Appliquer la migration**

Appliquer sur le projet Supabase distant, au choix :
- via l'outil MCP Supabase `apply_migration` (name: `token_ring`, query = contenu du fichier), **ou**
- copier-coller le SQL dans le SQL Editor du dashboard Supabase.

Expected: aucune erreur ; `profiles`, `movies` ont les nouvelles colonnes ; `token_spends` existe.

- [ ] **Step 3: Activer les 3 porteurs**

Exécuter (remplacer les pseudos réels) :

```sql
update profiles set can_use_token = true
where pseudo in ('Robin', 'Joana', 'Florian');
```

Expected: `UPDATE 3`.

- [ ] **Step 4: Refléter dans `supabase/schema.sql`**

Ajouter à la fin de `supabase/schema.sql` un bloc `-- Token de l'Anneau` reprenant les mêmes `alter table` / `create table` / policies que la migration (schéma canonique tenu à jour, cf. les migrations existantes).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260715_token_ring.sql supabase/schema.sql
git commit -m "feat(db): token_owner_id, can_use_token, token_spends"
```

---

## Task 2: Outillage de test (vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: commande `npm test` (vitest run) pour les tâches 3 et 4.

- [ ] **Step 1: Installer vitest**

Run: `npm install -D vitest`
Expected: vitest ajouté en devDependencies.

- [ ] **Step 2: Ajouter le script test**

Modifier `package.json`, section `scripts`, ajouter :

```json
"test": "vitest run"
```

- [ ] **Step 3: Config minimale**

Create `vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Vérifier que le runner tourne**

Run: `npm test`
Expected: vitest démarre, « No test files found » (aucun test encore) — pas d'erreur de config.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for pure-logic tests"
```

---

## Task 3: `currentQuarter` (logique pure trimestre)

**Files:**
- Create: `src/lib/quarter.ts`
- Test: `src/lib/quarter.test.ts`

**Interfaces:**
- Produces: `currentQuarter(date?: Date): string` — retourne `"YYYY-Q{1..4}"`.

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/quarter.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { currentQuarter } from './quarter'

describe('currentQuarter', () => {
  it('Q1 pour janvier–mars', () => {
    expect(currentQuarter(new Date('2026-01-01T00:00:00Z'))).toBe('2026-Q1')
    expect(currentQuarter(new Date('2026-03-31T23:59:59Z'))).toBe('2026-Q1')
  })
  it('Q2 pour avril–juin', () => {
    expect(currentQuarter(new Date('2026-04-01T00:00:00Z'))).toBe('2026-Q2')
    expect(currentQuarter(new Date('2026-06-30T00:00:00Z'))).toBe('2026-Q2')
  })
  it('Q3 pour juillet–septembre', () => {
    expect(currentQuarter(new Date('2026-07-15T00:00:00Z'))).toBe('2026-Q3')
  })
  it('Q4 pour octobre–décembre', () => {
    expect(currentQuarter(new Date('2026-12-31T00:00:00Z'))).toBe('2026-Q4')
  })
})
```

- [ ] **Step 2: Lancer le test — doit échouer**

Run: `npm test`
Expected: FAIL — `currentQuarter` introuvable.

- [ ] **Step 3: Implémenter**

Create `src/lib/quarter.ts` :

```ts
// Trimestre calendaire au format "YYYY-Q{1..4}". Utilise l'heure locale serveur.
export function currentQuarter(date: Date = new Date()): string {
  const q = Math.floor(date.getUTCMonth() / 3) + 1
  return `${date.getUTCFullYear()}-Q${q}`
}
```

- [ ] **Step 4: Lancer le test — doit passer**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/quarter.ts src/lib/quarter.test.ts
git commit -m "feat: currentQuarter helper"
```

---

## Task 4: Règle de dépense + lecture de disponibilité

**Files:**
- Create: `src/lib/token.ts`
- Test: `src/lib/token.test.ts`

**Interfaces:**
- Consumes: `currentQuarter` (Task 3).
- Produces:
  - `canSpendToken(input: { canUseToken: boolean; alreadySpentThisQuarter: boolean }): boolean` — pur.
  - `getTokenAvailability(supabase: SupabaseClient, userId: string): Promise<boolean>` — serveur : lit `profiles.can_use_token` + `token_spends` pour le trimestre courant, renvoie la dispo.

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/token.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { canSpendToken } from './token'

describe('canSpendToken', () => {
  it('dispo si autorisé et pas encore dépensé', () => {
    expect(canSpendToken({ canUseToken: true, alreadySpentThisQuarter: false })).toBe(true)
  })
  it('indispo si déjà dépensé ce trimestre', () => {
    expect(canSpendToken({ canUseToken: true, alreadySpentThisQuarter: true })).toBe(false)
  })
  it('indispo si non autorisé', () => {
    expect(canSpendToken({ canUseToken: false, alreadySpentThisQuarter: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer le test — doit échouer**

Run: `npm test`
Expected: FAIL — `canSpendToken` introuvable.

- [ ] **Step 3: Implémenter**

Create `src/lib/token.ts` :

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { currentQuarter } from './quarter'

export function canSpendToken(input: {
  canUseToken: boolean
  alreadySpentThisQuarter: boolean
}): boolean {
  return input.canUseToken && !input.alreadySpentThisQuarter
}

// Lecture serveur : le user a-t-il un jeton dispo maintenant ?
export async function getTokenAvailability(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('can_use_token')
    .eq('id', userId)
    .single()

  if (!profile?.can_use_token) return false

  const { data: spend } = await supabase
    .from('token_spends')
    .select('user_id')
    .eq('user_id', userId)
    .eq('quarter', currentQuarter())
    .maybeSingle()

  return canSpendToken({ canUseToken: true, alreadySpentThisQuarter: !!spend })
}
```

- [ ] **Step 4: Lancer le test — doit passer**

Run: `npm test`
Expected: PASS (3 tests `canSpendToken` + les 4 de Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/lib/token.ts src/lib/token.test.ts
git commit -m "feat: token availability logic"
```

---

## Task 5: Gate serveur dans `POST /api/movies`

**Files:**
- Modify: `src/app/api/movies/route.ts`

**Interfaces:**
- Consumes: `getTokenAvailability`, `currentQuarter`, `createAdminClient`.
- Produces: le POST accepte `token?: boolean` dans le body. Si `token` : crée le film avec `token_owner_id` + insère `token_spends`, sans exiger `is_admin`.

- [ ] **Step 1: Modifier le handler**

Dans `src/app/api/movies/route.ts` :

Ajouter les imports en tête :

```ts
import { createAdminClient } from '@/lib/supabase-admin'
import { getTokenAvailability } from '@/lib/token'
import { currentQuarter } from '@/lib/quarter'
```

Étendre le typage du body pour inclure `token` :

```ts
const { movie, availableDates, participantIds, guests, token } = body as {
  movie: { id: number; title: string; poster_path: string | null; release_date: string }
  availableDates: string[]
  participantIds: string[]
  guests: string[]
  token?: boolean
}
```

Remplacer le bloc de contrôle d'accès + insertion film. **Aujourd'hui** (route.ts:9-10 puis :28-43) : check `is_admin` puis insert avec le client RLS. **Nouveau** :

```ts
// Contrôle d'accès : token OU admin
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single()

let db = supabase                 // client RLS (admin path)
let tokenOwnerId: string | null = null

if (token) {
  const available = await getTokenAvailability(supabase, user.id)
  if (!available) {
    return NextResponse.json({ error: 'Jeton indisponible' }, { status: 403 })
  }
  db = createAdminClient()        // service-role : contourne la RLS movies
  tokenOwnerId = user.id
} else if (!profile?.is_admin) {
  return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
}
```

Dans l'insert `movies`, ajouter `token_owner_id: tokenOwnerId` et utiliser `db` au lieu de `supabase` pour les **deux** écritures du handler (l'insert `movies` ci-dessous et l'insert `available_days` qui suit à route.ts:45-47) :

```ts
const { data: rows, error: movieError } = await db
  .from('movies')
  .insert({
    title: movie.title,
    tmdb_id: String(movie.id),
    poster_url: movie.poster_path ?? null,
    release_date: movie.release_date || null,
    status: 'picking_days',
    participant_ids: participantIds,
    guests: guests ?? [],
    token_owner_id: tokenOwnerId,
  })
  .select('id')
```

Juste après avoir confirmé la création du film (`created.id` disponible), si token, écrire le registre :

```ts
if (token) {
  const { error: spendError } = await db
    .from('token_spends')
    .insert({ user_id: user.id, quarter: currentQuarter() })
  if (spendError) {
    // violation UNIQUE => jeton déjà dépensé ce trimestre (double-clic / course)
    return NextResponse.json({ error: 'Jeton déjà utilisé ce trimestre' }, { status: 409 })
  }
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: build OK, pas d'erreur TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/movies/route.ts
git commit -m "feat(api): token creation path bypasses admin gate after validation"
```

---

## Task 6: Marqueur `RingBadge`

**Files:**
- Create: `src/components/movies/RingBadge.tsx`

**Interfaces:**
- Produces: `<RingBadge />` — petit badge inline « ⌾ Séance de l'Anneau ». (Habillage baseline or ; remplacer par l'export Claude Design si fourni.)

- [ ] **Step 1: Créer le composant**

Create `src/components/movies/RingBadge.tsx` :

```tsx
// ponytail: habillage or baseline via tokens existants ; coller l'export Claude Design ici si besoin.
export default function RingBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
        text-accent bg-accent-soft ring-1 ring-accent/30 ${className}`}
    >
      <span aria-hidden>⌾</span> Séance de l'Anneau
    </span>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/movies/RingBadge.tsx
git commit -m "feat: RingBadge marker"
```

---

## Task 7: Bouton flottant `TokenFab`

**Files:**
- Create: `src/components/movies/TokenFab.tsx`

**Interfaces:**
- Consumes: `public/token.mp4`.
- Produces: `<TokenFab />` — lien flottant bas-droite vers `/movies/new?token=1`, joue la vidéo du jeton en boucle.

- [ ] **Step 1: Créer le composant**

Create `src/components/movies/TokenFab.tsx` :

```tsx
// ponytail: vidéo pré-rendue du jeton (pas de 3D runtime). Habillage swappable via Claude Design.
export default function TokenFab() {
  return (
    <a
      href="/movies/new?token=1"
      aria-label="Utiliser ton jeton de l'Anneau"
      className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full overflow-hidden
        shadow-accent-glow active:scale-95 transition-transform"
    >
      <video
        src="/token.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </a>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/movies/TokenFab.tsx public/token.mp4
git commit -m "feat: TokenFab floating ring button"
```

---

## Task 8: Carte film-jeton `TokenMovieCard`

**Files:**
- Create: `src/components/movies/TokenMovieCard.tsx`

**Interfaces:**
- Consumes: `getPosterUrl` (`@/lib/tmdb/api`), `Image` (next), `RingBadge` (Task 6).
- Produces: `<TokenMovieCard movie={{ id, title, poster_url, status }} isAdmin={boolean} />` — carte de la liste d'accueil, dimensions identiques à la carte normale (hauteur 104px, poster 76px), habillage or.

- [ ] **Step 1: Créer le composant**

Create `src/components/movies/TokenMovieCard.tsx` (structure calquée sur la carte normale de `page.tsx`, cf. lignes ~125-146, mais habillée) :

```tsx
import Image from 'next/image'
import { Film } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb/api'
import RingBadge from './RingBadge'
import DeleteMovieButton from './DeleteMovieButton'

// ponytail: bordure/glow or baseline via tokens ; coller l'export Claude Design (classes/markup) ici.
export default function TokenMovieCard({
  movie,
  isAdmin,
}: {
  movie: { id: string; title: string; poster_url: string | null; status: string }
  isAdmin: boolean
}) {
  return (
    <div className="relative h-[104px] rounded-2xl2 bg-surface overflow-hidden
      ring-1 ring-accent/40 shadow-accent-glow active:scale-[0.99] transition-transform">
      <a href={`/movies/${movie.id}`} className="absolute inset-0 flex items-stretch text-ink">
        <div className="relative w-[76px] flex-shrink-0 m-2.5 rounded-xl overflow-hidden bg-surface-raised shadow-lg">
          {movie.poster_url ? (
            <Image src={getPosterUrl(movie.poster_url, 'w200')!} alt={movie.title} fill sizes="76px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6 text-ink-faint" />
            </div>
          )}
        </div>
        <div className="relative flex flex-col justify-center gap-1.5 px-3.5 py-3 flex-grow min-w-0">
          <RingBadge className="self-start" />
          <h3 className="font-bold text-base text-ink leading-snug line-clamp-2 pr-6">{movie.title}</h3>
          <p className="text-xs text-ink-faint">Voir les votes →</p>
        </div>
      </a>
      {isAdmin && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <DeleteMovieButton movieId={movie.id} movieTitle={movie.title} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/movies/TokenMovieCard.tsx
git commit -m "feat: TokenMovieCard list variant"
```

---

## Task 9: Accueil — FAB + carte conditionnelle

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getTokenAvailability` (Task 4), `TokenFab` (Task 7), `TokenMovieCard` (Task 8).
- Produces: le FAB s'affiche si dispo ; les films avec `token_owner_id` s'affichent en `TokenMovieCard`.

- [ ] **Step 1: Importer les nouveaux modules**

En tête de `src/app/page.tsx`, ajouter :

```ts
import { getTokenAvailability } from "@/lib/token";
import TokenFab from "@/components/movies/TokenFab";
import TokenMovieCard from "@/components/movies/TokenMovieCard";
```

- [ ] **Step 2: Ajouter `token_owner_id` à la requête films**

Dans la requête `movies` (page.tsx:~41-43), ajouter la colonne :

```ts
.select("id, title, poster_url, status, token_owner_id")
```

- [ ] **Step 3: Calculer la disponibilité du jeton**

Après le fetch du `profile` (après page.tsx:~34), ajouter :

```ts
const tokenAvailable = await getTokenAvailability(supabase, user.id);
```

- [ ] **Step 4: Rendu conditionnel de la carte**

Dans le `.map((movie) => …)` de la liste des films, au tout début du rendu de chaque film, brancher sur `token_owner_id` :

```tsx
{movieList.map((movie) => {
  if (movie.token_owner_id) {
    return <TokenMovieCard key={movie.id} movie={movie} isAdmin={isAdmin} />;
  }
  const s = STATUS[movie.status as keyof typeof STATUS] ?? STATUS.picking_days;
  return (
    // …carte normale existante inchangée…
  );
})}
```

- [ ] **Step 5: Monter le FAB**

Juste avant la fermeture du `</main>` (ou du conteneur racine), ajouter :

```tsx
{tokenAvailable && <TokenFab />}
```

- [ ] **Step 6: Vérifier build + rendu**

Run: `npm run build`
Expected: build OK.
Puis `npm run dev` et ouvrir `/` connecté avec un compte `can_use_token = true` sans jeton dépensé : le FAB apparaît en bas à droite et joue la vidéo.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): token FAB + token movie card"
```

---

## Task 10: Pipeline de création — propager `?token=1`

**Files:**
- Modify: `src/app/movies/new/page.tsx`

**Interfaces:**
- Consumes: `RingBadge` (Task 6).
- Produces: quand l'URL contient `?token=1`, le POST envoie `token: true` et un marqueur s'affiche en tête du parcours.

- [ ] **Step 1: Lire le param token**

Dans `NewMoviePage`, ajouter un state et le remplir depuis l'URL (à côté du `useEffect` qui lit déjà `tmdbId`/`wishlistId`, page.tsx:~61) :

```ts
const [isToken, setIsToken] = useState(false)
```

Dans ce même `useEffect` (lecture de `window.location.search`), ajouter :

```ts
if (params.get('token') === '1') setIsToken(true)
```

- [ ] **Step 2: Envoyer `token` dans le POST**

Dans `handleSubmit`, ajouter `token: isToken` au body du `fetch('/api/movies')` :

```ts
body: JSON.stringify({
  movie: selectedMovie,
  availableDates: selectedDates,
  participantIds: selectedParticipants,
  guests,
  token: isToken,
}),
```

- [ ] **Step 3: Afficher le marqueur**

Importer `RingBadge` en tête :

```ts
import RingBadge from '@/components/movies/RingBadge'
```

Dans le rendu, en haut du parcours (juste sous le titre / en tête du conteneur), ajouter :

```tsx
{isToken && <RingBadge className="mb-4" />}
```

- [ ] **Step 4: Vérifier build + flux**

Run: `npm run build`
Expected: build OK.
Puis via le FAB, créer un film-jeton de bout en bout ; vérifier en base : `movies.token_owner_id = ton id` ET une ligne `token_spends` pour le trimestre courant ; le FAB a disparu de l'accueil.

- [ ] **Step 5: Commit**

```bash
git add src/app/movies/new/page.tsx
git commit -m "feat(new): propagate token flag + ring marker"
```

---

## Task 11: Écran de vote + carte finale LOTR

**Files:**
- Modify: `src/app/movies/[id]/page.tsx`
- Modify: `src/components/summary/FinalSummary.tsx`
- Modify: `src/components/summary/ShareCard.tsx`

**Interfaces:**
- Consumes: `RingBadge` (Task 6).
- Produces: marqueur en header du film-jeton ; `FinalSummary` et `ShareCard` reçoivent `isRing: boolean` et rendent la variante LOTR de la carte partageable.

- [ ] **Step 1: Lire `token_owner_id` sur la page film**

Dans `src/app/movies/[id]/page.tsx`, la requête movie (page.tsx:~38) — ajouter la colonne :

```ts
.select("id, title, poster_url, status, final_showtime_id, participant_ids, guests, token_owner_id")
```

Dériver le flag après le fetch :

```ts
const isRing = !!movie.token_owner_id;
```

- [ ] **Step 2: Marqueur dans le header**

Importer `RingBadge` en tête, puis dans le bloc header (près du `<Badge>` ligne ~111), quand `isRing`, l'afficher :

```tsx
{isRing && <RingBadge className="self-start mb-1" />}
```

- [ ] **Step 3: Passer `isRing` à FinalSummary**

Au rendu `<FinalSummary … />` (page.tsx:~130), ajouter la prop :

```tsx
<FinalSummary
  /* …props existantes… */
  isRing={isRing}
/>
```

- [ ] **Step 4: Threader `isRing` dans FinalSummary**

Dans `src/components/summary/FinalSummary.tsx` :
- Ajouter `isRing: boolean` à `FinalSummaryProps`.
- L'ajouter à la déstructuration des props (ligne ~45).
- Le passer à `<ShareCard … isRing={isRing} />` (ligne ~145).

- [ ] **Step 5: Variante LOTR dans ShareCard**

Dans `src/components/summary/ShareCard.tsx` :
- Ajouter `isRing?: boolean` à `ShareCardProps` et à la déstructuration (ligne ~13).
- Appliquer un habillage conditionnel **en styles inline** (contrainte `html-to-image`). Baseline :

```tsx
// ponytail: habillage or baseline inline ; coller l'export Claude Design (inline styles) dans cette branche.
const ringStyle = isRing
  ? { border: '2px solid #FFC426', boxShadow: '0 0 24px rgba(255,196,38,0.5)' }
  : {}
```

Fusionner `ringStyle` dans le `style={{…}}` du conteneur racine de la carte, et, si `isRing`, ajouter un titre/mention « ⌾ Séance de l'Anneau » (inline styles) en tête de carte.

- [ ] **Step 6: Vérifier build + rendu**

Run: `npm run build`
Expected: build OK.
Ouvrir un film-jeton `closed` : le header montre le marqueur ; la carte finale partageable a l'habillage or ; le partage/`.png` fonctionne toujours.

- [ ] **Step 7: Commit**

```bash
git add "src/app/movies/[id]/page.tsx" src/components/summary/FinalSummary.tsx src/components/summary/ShareCard.tsx
git commit -m "feat: ring marker on movie page + LOTR share card"
```

---

## Task 12: Câbler les visuels Claude Design (finition DA)

**Files:**
- Modify: `src/components/movies/TokenFab.tsx`, `TokenMovieCard.tsx`, `RingBadge.tsx`, `src/components/summary/ShareCard.tsx` (selon les exports fournis)

**Interfaces:**
- Consumes: les exports React/Tailwind (ou images) de Claude Design.

- [ ] **Step 1: Remplacer les habillages baseline**

Pour chaque composant marqué `// ponytail: … coller l'export Claude Design`, remplacer les classes/markup baseline par l'export, **sans changer les props ni les dimensions** (hauteur carte 104px, poster 76px, FAB ~56–64px, ShareCard en styles inline).

- [ ] **Step 2: Vérifier build + rendu visuel**

Run: `npm run build` puis `npm run dev`.
Expected: build OK ; FAB, carte liste, marqueur, carte finale rendent la DA LOTR ; dimensions préservées.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style: wire Claude Design ring visuals"
```

---

## Notes de vérification manuelle (parcours complet)

1. Compte `can_use_token=true`, jeton non dépensé → FAB visible, tourne.
2. Créer un film-jeton → apparaît en `TokenMovieCard`, FAB disparaît.
3. Voter jours/horaires (autre compte) → marqueur visible, vote normal.
4. Clôturer → carte finale LOTR, partage/`.png` OK.
5. Supprimer le film-jeton → le FAB **ne revient pas** (registre `token_spends` conservé).
6. Compte sans `can_use_token` → jamais de FAB ; POST `token:true` forgé → 403.
