# Séances Filter Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un toggle sur la page d'accueil pour filtrer les séances — par défaut l'utilisateur ne voit que ses séances (celles où il est dans `participant_ids`), avec un toggle "Toutes" pour tout afficher.

**Architecture:** La page d'accueil (`page.tsx`) est un server component qui lit `searchParams`. Si `?all=true` est absent, la requête Supabase filtre sur `participant_ids.contains(user.id)`. Un client component `SeancesToggle` gère le bouton toggle et modifie l'URL via `useRouter`.

**Tech Stack:** Next.js 16 App Router (server components, async searchParams), Supabase, Tailwind CSS, lucide-react

---

## File Map

- **Modify:** `src/app/page.tsx` — ajout `searchParams`, requête conditionnelle, sous-titre adapté, intégration du toggle
- **Create:** `src/components/movies/SeancesToggle.tsx` — client component bouton toggle

---

### Task 1: Créer le composant SeancesToggle

**Files:**
- Create: `src/components/movies/SeancesToggle.tsx`

- [ ] **Step 1: Créer le fichier**

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SeancesToggleProps {
  showAll: boolean
}

export default function SeancesToggle({ showAll }: SeancesToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (showAll) {
      params.delete('all')
    } else {
      params.set('all', 'true')
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
    >
      {showAll ? 'Mes séances' : 'Toutes'}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/movies/SeancesToggle.tsx
git commit -m "feat: add SeancesToggle client component"
```

---

### Task 2: Mettre à jour page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Ajouter le type searchParams et l'import du toggle**

Remplacer la ligne d'imports en haut du fichier et la signature de la fonction :

```tsx
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/logout/actions";
import DeleteMovieButton from "@/components/movies/DeleteMovieButton";
import SeancesToggle from "@/components/movies/SeancesToggle";
import { Plus, LogOut, Film, Megaphone } from "lucide-react";
import { getPosterUrl } from "@/lib/tmdb/api";
```

- [ ] **Step 2: Mettre à jour la signature de la fonction et la requête**

Remplacer `export default async function Home()` et le bloc de requête movies par :

```tsx
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, pseudo")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;
  const pseudo = profile?.pseudo ?? "?";

  const { all } = await searchParams;
  const showAll = all === "true";

  const query = supabase
    .from("movies")
    .select("id, title, poster_url, status")
    .order("created_at", { ascending: false });

  const { data: movies } = showAll
    ? await query
    : await query.contains("participant_ids", [user.id]);

  const movieList = movies ?? [];
```

- [ ] **Step 3: Mettre à jour la section titre avec le toggle et le sous-titre adapté**

Remplacer le bloc `{/* Title row */}` (lignes 66–91 actuelles) par :

```tsx
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Séances</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-zinc-500 text-sm">
                {movieList.length === 0
                  ? showAll ? "Aucune en cours" : "Aucune pour toi"
                  : showAll
                    ? `${movieList.length} en cours`
                    : `${movieList.length} de tes séances`}
              </p>
              <SeancesToggle showAll={showAll} />
            </div>
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

- [ ] **Step 4: Mettre à jour l'empty state pour la vue filtrée**

Remplacer le bloc empty state (actuellement `{movieList.length === 0 ? (...)`) — adapter le message selon `showAll` :

```tsx
        {/* Empty state */}
        {movieList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Film className="w-9 h-9 text-zinc-600" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-semibold">
                {showAll ? "Rien à l'affiche" : "Pas de séances pour toi"}
              </p>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                {showAll
                  ? "Lance une organisation pour votre prochaine sortie ciné !"
                  : "Tu n'as pas encore été invité à une séance."}
              </p>
            </div>
            {isAdmin && showAll && (
              <a
                href="/movies/new"
                className="bg-[#FFC426] text-[#0A0A0A] px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-[#FFC426]/20 active:scale-95 transition-transform"
              >
                Organiser une séance
              </a>
            )}
          </div>
        ) : (
```

- [ ] **Step 5: Vérifier que TypeScript compile sans erreur**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: filter home page movies by participant_ids with toggle"
```

---

### Task 3: Vérification manuelle

- [ ] **Step 1: Lancer le serveur de dev**

```bash
npm run dev
```

- [ ] **Step 2: Vérifier le comportement**

1. Aller sur `/` — vérifier que seules les séances où l'utilisateur est participant apparaissent
2. Cliquer "Toutes" — l'URL passe à `/?all=true`, toutes les séances s'affichent
3. Cliquer "Mes séances" — l'URL revient à `/`, retour à la vue filtrée
4. Rafraîchir la page avec `?all=true` dans l'URL — la vue "Toutes" persiste

- [ ] **Step 3: Vérifier l'empty state**

Se connecter avec un compte sans séances assignées et vérifier le message "Pas de séances pour toi" en vue par défaut.
