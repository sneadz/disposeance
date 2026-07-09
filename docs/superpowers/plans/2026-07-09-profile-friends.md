# Profile & Friends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a friends list and public user profiles with photo de profil et top 4 films façon Letterboxd.

**Architecture:** Deux phases — Phase 1 construit la page amis et le profil de base (photo + pseudo) ; Phase 2 ajoute le top 4 films avec drag-and-drop. Les pages profil sont des server components pour les données, client components pour l'interactivité. Les données sont dans Supabase + Storage bucket `avatars`.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + Storage), @dnd-kit/core + @dnd-kit/sortable (Phase 2), design system existant zinc/violet glassmorphism.

## Global Constraints

- Branch: `feat/profile-friends` — créer depuis `main` avant tout
- Design: zinc/violet glassmorphism — utiliser `bg-base`, `bg-surface-fill`, `shadow-card`, `bg-accent-fill`, `text-accent-fg`, `shadow-accent-glow`, `rounded-2xl`, `text-ink`, `text-ink-muted`
- Navigation: toujours `window.location.href` (jamais `router.push`) pour les transitions de page ; dans les server components `redirect()` est OK
- Images: `next/image` avec `fill` + `sizes` pour tous les posters/avatars
- Server data: `createClient()` depuis `@/lib/supabase-server` dans les server components
- Client actions: server actions avec directive `'use server'`
- Default avatar: `/public/default-avatar.png` — ajouter un PNG simple avant la Task 3

---

## PHASE 1 — Page amis & profil de base

### Task 1: Git branch + avatar par défaut

**Files:**
- Create: `public/default-avatar.png`

- [ ] **Step 1: Créer la branche**
```bash
git checkout main && git pull && git checkout -b feat/profile-friends
```

- [ ] **Step 2: Ajouter l'avatar par défaut**
Télécharger ou créer un PNG silhouette neutre (200×200px) et le placer dans `public/default-avatar.png`. N'importe quel avatar générique sobre convient (fond gris, silhouette blanche).

- [ ] **Step 3: Commit**
```bash
git add public/default-avatar.png
git commit -m "feat: add default avatar asset"
```

---

### Task 2: DB migration — avatar_url + bucket avatars

**Files:**
- Modify: Supabase DB via SQL editor ou MCP

**Interfaces:**
- Produces: colonne `profiles.avatar_url: text | null` ; bucket `avatars` public dans Supabase Storage

- [ ] **Step 1: Ajouter avatar_url à profiles**
Exécuter dans le SQL editor Supabase:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
```

- [ ] **Step 2: Créer le bucket avatars**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Policies storage**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name = (auth.uid() || '.jpg'));

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND name = (auth.uid() || '.jpg'));
```

- [ ] **Step 4: Vérifier**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'avatar_url';
```
Expected: une ligne retournée.

- [ ] **Step 5: Commit (SQL exécuté dans Supabase, rien à stager localement)**
```bash
git commit -m "feat: add avatar_url column and avatars storage bucket" --allow-empty
```

---

### Task 3: Header — avatar cliquable → /profile

**Files:**
- Modify: `src/components/ui/Header.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: nouveau prop `avatarUrl?: string | null`
- Produces: le cercle avatar dans la navbar est un `<a href="/profile">` ; `Header` accepte toujours `pseudo: string, backHref?: string`

- [ ] **Step 1: Mettre à jour Header**

Remplacer le contenu complet de `src/components/ui/Header.tsx`:
```tsx
import { Film, ChevronLeft, LogOut } from 'lucide-react'
import { logout } from '@/app/auth/logout/actions'
import Image from 'next/image'

interface HeaderProps {
  pseudo: string
  backHref?: string
  avatarUrl?: string | null
}

export default function Header({ pseudo, backHref, avatarUrl }: HeaderProps) {
  const brand = (
    <div className="flex items-center gap-2.5">
      <div className="bg-accent-fill p-1.5 rounded-xl shadow-accent-glow">
        <Film className="w-4 h-4 text-accent-fg" />
      </div>
      <span className="font-label font-extrabold text-[15px] text-ink">
        Dispo<span className="text-accent">Séance</span>
      </span>
    </div>
  )

  return (
    <header className="sticky top-0 z-10 bg-base/85 backdrop-blur-md shadow-[inset_0_-1px_0_rgba(255,255,255,0.07)] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {backHref ? (
          <a href={backHref} className="flex items-center gap-2 text-ink-muted active:text-ink transition-colors">
            <ChevronLeft className="w-5 h-5" />
            {brand}
          </a>
        ) : (
          brand
        )}
        <div className="flex items-center gap-3">
          <a
            href="/profile"
            className="w-7 h-7 rounded-full overflow-hidden bg-accent-fill flex items-center justify-center text-xs font-bold text-accent-fg flex-shrink-0"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={pseudo} width={28} height={28} className="object-cover w-full h-full" />
            ) : (
              pseudo[0]?.toUpperCase()
            )}
          </a>
          <form action={logout}>
            <button className="p-1.5 text-ink-faint active:text-ink transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Passer avatarUrl dans la home**

Dans `src/app/page.tsx`, mettre à jour la query profile:
```tsx
const { data: profile } = await supabase
  .from("profiles")
  .select("is_admin, pseudo, avatar_url")
  .eq("id", user.id)
  .single();

const avatarUrl = profile?.avatar_url ?? null;
```

Et mettre à jour l'appel `<Header>`:
```tsx
<Header pseudo={pseudo} avatarUrl={avatarUrl} />
```

- [ ] **Step 3: Vérifier TypeScript**
```bash
npx tsc --noEmit
```
Expected: aucune erreur.

- [ ] **Step 4: Commit**
```bash
git add src/components/ui/Header.tsx src/app/page.tsx
git commit -m "feat: make header avatar a link to /profile"
```

---

### Task 4: Pages profil de base (photo + pseudo)

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/app/profile/[id]/page.tsx`
- Create: `src/app/actions/profile.ts`
- Create: `src/components/profile/AvatarUpload.tsx`

**Interfaces:**
- Consumes: `profiles.avatar_url`, `profiles.pseudo`, `profiles.id`
- Produces:
  - Route `/profile` (propre profil, éditable)
  - Route `/profile/[id]` (autre user, lecture seule)
  - `uploadAvatarAction(formData: FormData): Promise<{ error?: string }>`

- [ ] **Step 1: Server action upload avatar**

Créer `src/app/actions/profile.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase-server'

export async function uploadAvatarAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier' }

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(`${user.id}.jpg`, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`${user.id}.jpg`)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  return updateError ? { error: updateError.message } : {}
}
```

- [ ] **Step 2: AvatarUpload client component**

Créer `src/components/profile/AvatarUpload.tsx`:
```tsx
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { uploadAvatarAction } from '@/app/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  pseudo: string
}

export default function AvatarUpload({ currentUrl, pseudo }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    await uploadAvatarAction(fd)
    setUploading(false)
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-fill shadow-card group"
    >
      <Image
        src={preview ?? '/default-avatar.png'}
        alt={pseudo}
        fill
        sizes="96px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
        <Camera className="w-6 h-6 text-white" />
      </div>
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </button>
  )
}
```

- [ ] **Step 3: Page profil propre**

Créer `src/app/profile/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import AvatarUpload from '@/components/profile/AvatarUpload'
import Button from '@/components/ui/Button'
import { Users } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('pseudo, avatar_url')
    .eq('id', user.id)
    .single()

  const pseudo = profile?.pseudo ?? '?'
  const avatarUrl = profile?.avatar_url ?? null

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header pseudo={pseudo} avatarUrl={avatarUrl} backHref="/" />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <AvatarUpload currentUrl={avatarUrl} pseudo={pseudo} />
          <h1 className="font-display text-2xl uppercase tracking-wide">{pseudo}</h1>
          <a href="/friends">
            <Button variant="ghost">
              <Users className="w-4 h-4" />
              Amis
            </Button>
          </a>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Page profil autre user (lecture seule)**

Créer `src/app/profile/[id]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/ui/Header'
import Image from 'next/image'

export default async function OtherProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  if (params.id === user.id) redirect('/profile')

  const [{ data: selfProfile }, { data: profile }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', params.id).single(),
  ])

  if (!profile) notFound()

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header
        pseudo={selfProfile?.pseudo ?? '?'}
        avatarUrl={selfProfile?.avatar_url ?? null}
        backHref="/friends"
      />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-fill shadow-card">
            <Image
              src={profile.avatar_url ?? '/default-avatar.png'}
              alt={profile.pseudo}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wide">{profile.pseudo}</h1>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Vérifier TypeScript**
```bash
npx tsc --noEmit
```
Expected: aucune erreur.

- [ ] **Step 6: Commit**
```bash
git add src/app/actions/profile.ts src/components/profile/AvatarUpload.tsx src/app/profile/page.tsx src/app/profile/[id]/page.tsx
git commit -m "feat: add basic profile pages with avatar upload"
```

---

### Task 5: Page amis

**Files:**
- Create: `src/app/friends/page.tsx`

**Interfaces:**
- Consumes: table `profiles` (id, pseudo, avatar_url) ; filtre `id != current_user_id`
- Produces: route `/friends` listant tous les autres users, lien vers `/profile/[id]`

- [ ] **Step 1: Créer la page amis**

Créer `src/app/friends/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import Image from 'next/image'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: selfProfile }, { data: profiles }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('id, pseudo, avatar_url').neq('id', user.id).order('pseudo'),
  ])

  const friends = profiles ?? []

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header
        pseudo={selfProfile?.pseudo ?? '?'}
        avatarUrl={selfProfile?.avatar_url ?? null}
        backHref="/profile"
      />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="font-display text-[26px] uppercase leading-none tracking-wide">Amis</h1>
        <div className="space-y-2">
          {friends.map(friend => (
            <a
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="flex items-center gap-4 bg-surface-fill shadow-card rounded-2xl p-4 active:scale-[0.99] transition-transform"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-raised flex-shrink-0">
                <Image
                  src={friend.avatar_url ?? '/default-avatar.png'}
                  alt={friend.pseudo}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-ink">{friend.pseudo}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Vérifier TypeScript**
```bash
npx tsc --noEmit
```
Expected: aucune erreur.

- [ ] **Step 3: Commit**
```bash
git add src/app/friends/page.tsx
git commit -m "feat: add friends list page"
```

---

## PHASE 2 — Top 4 films

### Task 6: DB — table profile_top_films + RLS

**Files:**
- Modify: Supabase DB via SQL editor

**Interfaces:**
- Produces: `profile_top_films(id uuid, profile_id uuid, position int 1-4, tmdb_id text, title text, poster_url text)` avec RLS

- [ ] **Step 1: Créer la table + RLS**
```sql
CREATE TABLE IF NOT EXISTS profile_top_films (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 4),
  tmdb_id text NOT NULL,
  title text NOT NULL,
  poster_url text NOT NULL,
  UNIQUE (profile_id, position)
);

ALTER TABLE profile_top_films ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read top films"
ON profile_top_films FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage own top films"
ON profile_top_films FOR ALL
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
```

- [ ] **Step 2: Vérifier**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'profile_top_films';
```
Expected: une ligne.

- [ ] **Step 3: Commit**
```bash
git commit -m "feat: add profile_top_films table with RLS" --allow-empty
```

---

### Task 7: Installer @dnd-kit + server actions top 4

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/app/actions/profile.ts`

**Interfaces:**
- Produces:
  - `addTopFilmAction(position: number, tmdbId: string, title: string, posterUrl: string): Promise<{ error?: string }>`
  - `removeTopFilmAction(position: number): Promise<{ error?: string }>`
  - `reorderTopFilmsAction(newOrder: { id: string; position: number }[]): Promise<{ error?: string }>`

- [ ] **Step 1: Installer @dnd-kit**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Ajouter les actions dans src/app/actions/profile.ts**

Ajouter à la fin du fichier existant (après `uploadAvatarAction`):
```ts
export async function addTopFilmAction(
  position: number,
  tmdbId: string,
  title: string,
  posterUrl: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('profile_top_films').upsert(
    { profile_id: user.id, position, tmdb_id: tmdbId, title, poster_url: posterUrl },
    { onConflict: 'profile_id,position' }
  )

  return error ? { error: error.message } : {}
}

export async function removeTopFilmAction(position: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profile_top_films')
    .delete()
    .eq('profile_id', user.id)
    .eq('position', position)

  return error ? { error: error.message } : {}
}

export async function reorderTopFilmsAction(
  newOrder: { id: string; position: number }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const results = await Promise.all(
    newOrder.map(({ id, position }) =>
      supabase.from('profile_top_films').update({ position }).eq('id', id).eq('profile_id', user.id)
    )
  )
  const failed = results.find(r => r.error)
  return failed?.error ? { error: failed.error.message } : {}
}
```

- [ ] **Step 3: Vérifier TypeScript**
```bash
npx tsc --noEmit
```
Expected: aucune erreur.

- [ ] **Step 4: Commit**
```bash
git add src/app/actions/profile.ts package.json package-lock.json
git commit -m "feat: add top 4 server actions and install @dnd-kit"
```

---

### Task 8: Composants Top4Grid + FilmSearchModal

**Files:**
- Create: `src/components/profile/FilmSearchModal.tsx`
- Create: `src/components/profile/Top4Grid.tsx`

**Interfaces:**
- Consumes:
  - `TopFilm { id: string; position: number; tmdb_id: string; title: string; poster_url: string }`
  - `addTopFilmAction`, `removeTopFilmAction`, `reorderTopFilmsAction` depuis `@/app/actions/profile`
  - `searchMoviesAction` depuis `@/app/movies/new/actions`
  - `getPosterUrl` depuis `@/lib/tmdb/api`
- Produces:
  - `<FilmSearchModal onSelect: (movie: TmdbMovie) => void, onClose: () => void />`
  - `<Top4Grid films: TopFilm[], editable: boolean />` — 4 slots en ligne, drag-sortable si `editable`

- [ ] **Step 1: Créer FilmSearchModal**

Créer `src/components/profile/FilmSearchModal.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Film, X } from 'lucide-react'
import { searchMoviesAction } from '@/app/movies/new/actions'
import type { TmdbMovie } from '@/lib/tmdb/api'

interface FilmSearchModalProps {
  onSelect: (movie: TmdbMovie) => void
  onClose: () => void
}

export default function FilmSearchModal({ onSelect, onClose }: FilmSearchModalProps) {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 3) { setMovies([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const { movies: results } = await searchMoviesAction(query)
      setMovies(results)
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-base rounded-t-3xl p-4 space-y-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">Choisir un film</span>
          <button onClick={onClose} className="p-1.5 text-ink-muted active:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint w-4 h-4" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher un film..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface-fill shadow-card rounded-2xl py-3.5 pl-11 pr-4 text-ink text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-ink-faint transition-colors"
          />
        </div>
        <div className="overflow-y-auto flex-1 space-y-2">
          {loading && [1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />)}
          {!loading && query.length >= 3 && movies.length === 0 && (
            <div className="text-center py-8 text-ink-muted text-sm">Aucun résultat</div>
          )}
          {movies.map(movie => (
            <button
              key={movie.id}
              onClick={() => onSelect(movie)}
              className="w-full flex items-center gap-3 bg-surface-fill shadow-card rounded-2xl p-3 active:scale-[0.99] transition-transform text-left"
            >
              <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-4 h-4 text-ink-faint" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink leading-snug line-clamp-1">{movie.title}</p>
                <p className="text-xs text-ink-muted">{movie.release_date?.split('-')[0]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Créer Top4Grid**

Créer `src/components/profile/Top4Grid.tsx`:
```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FilmSearchModal from './FilmSearchModal'
import { addTopFilmAction, removeTopFilmAction, reorderTopFilmsAction } from '@/app/actions/profile'
import type { TmdbMovie } from '@/lib/tmdb/api'
import { getPosterUrl } from '@/lib/tmdb/api'

export interface TopFilm {
  id: string
  position: number
  tmdb_id: string
  title: string
  poster_url: string
}

function SortableSlot({
  film,
  editable,
  onRemove,
  onAdd,
  position,
}: {
  film: TopFilm | null
  editable: boolean
  onRemove: (position: number) => void
  onAdd: (position: number) => void
  position: number
}) {
  const id = film?.id ?? `empty-${position}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !film || !editable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-1 aspect-[2/3] relative rounded-xl overflow-hidden bg-surface-fill shadow-card"
    >
      {film ? (
        <>
          <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <Image
              src={getPosterUrl(film.poster_url, 'w200') ?? '/default-avatar.png'}
              alt={film.title}
              fill
              sizes="25vw"
              className="object-cover"
            />
          </div>
          {editable && (
            <button
              onClick={() => onRemove(film.position)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center z-10"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </>
      ) : editable ? (
        <button
          onClick={() => onAdd(position)}
          className="absolute inset-0 flex items-center justify-center text-ink-faint active:text-ink transition-colors"
        >
          <Plus className="w-8 h-8" />
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Plus className="w-6 h-6 text-ink-faint opacity-30" />
        </div>
      )}
    </div>
  )
}

export default function Top4Grid({
  films: initial,
  editable,
}: {
  films: TopFilm[]
  editable: boolean
}) {
  const [films, setFilms] = useState<TopFilm[]>(initial)
  const [modalPosition, setModalPosition] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const slots = [1, 2, 3, 4].map(pos => films.find(f => f.position === pos) ?? null)
  const sortableIds = films.map(f => f.id)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = films.findIndex(f => f.id === active.id)
    const newIndex = films.findIndex(f => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(films, oldIndex, newIndex).map((f, i) => ({ ...f, position: i + 1 }))
    setFilms(reordered)
    await reorderTopFilmsAction(reordered.map(f => ({ id: f.id, position: f.position })))
  }

  const handleSelect = async (movie: TmdbMovie) => {
    if (modalPosition === null) return
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
    const newFilm: TopFilm = {
      id: `temp-${Date.now()}`,
      position: modalPosition,
      tmdb_id: String(movie.id),
      title: movie.title,
      poster_url: posterUrl,
    }
    setFilms(prev => [...prev.filter(f => f.position !== modalPosition), newFilm])
    setModalPosition(null)
    await addTopFilmAction(modalPosition, String(movie.id), movie.title, posterUrl)
  }

  const handleRemove = async (position: number) => {
    setFilms(prev => prev.filter(f => f.position !== position))
    await removeTopFilmAction(position)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 w-full">
            {slots.map((film, i) => (
              <SortableSlot
                key={film?.id ?? `empty-${i + 1}`}
                film={film}
                editable={editable}
                onRemove={handleRemove}
                onAdd={pos => setModalPosition(pos)}
                position={i + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modalPosition !== null && (
        <FilmSearchModal
          onSelect={handleSelect}
          onClose={() => setModalPosition(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Vérifier TypeScript**
```bash
npx tsc --noEmit
```
Expected: aucune erreur.

- [ ] **Step 4: Commit**
```bash
git add src/components/profile/Top4Grid.tsx src/components/profile/FilmSearchModal.tsx
git commit -m "feat: add Top4Grid with drag-and-drop and FilmSearchModal"
```

---

### Task 9: Brancher Top4Grid dans les pages profil

**Files:**
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/profile/[id]/page.tsx`

**Interfaces:**
- Consumes: `Top4Grid` et `TopFilm` depuis `@/components/profile/Top4Grid` ; table `profile_top_films`
- Produces: top 4 affiché sur les deux pages profil (éditable sur `/profile`, lecture seule sur `/profile/[id]`)

- [ ] **Step 1: Mettre à jour /profile (propre profil)**

Remplacer le contenu de `src/app/profile/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import AvatarUpload from '@/components/profile/AvatarUpload'
import Top4Grid, { type TopFilm } from '@/components/profile/Top4Grid'
import Button from '@/components/ui/Button'
import { Users } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: profile }, { data: topFilms }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profile_top_films').select('*').eq('profile_id', user.id).order('position'),
  ])

  const pseudo = profile?.pseudo ?? '?'
  const avatarUrl = profile?.avatar_url ?? null
  const films = (topFilms ?? []) as TopFilm[]

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header pseudo={pseudo} avatarUrl={avatarUrl} backHref="/" />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <AvatarUpload currentUrl={avatarUrl} pseudo={pseudo} />
          <h1 className="font-display text-2xl uppercase tracking-wide">{pseudo}</h1>
          <a href="/friends">
            <Button variant="ghost">
              <Users className="w-4 h-4" />
              Amis
            </Button>
          </a>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Top 4 films</h2>
          <Top4Grid films={films} editable={true} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Mettre à jour /profile/[id] (autre user)**

Remplacer le contenu de `src/app/profile/[id]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/ui/Header'
import Image from 'next/image'
import Top4Grid, { type TopFilm } from '@/components/profile/Top4Grid'

export default async function OtherProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  if (params.id === user.id) redirect('/profile')

  const [{ data: selfProfile }, { data: profile }, { data: topFilms }] = await Promise.all([
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('pseudo, avatar_url').eq('id', params.id).single(),
    supabase.from('profile_top_films').select('*').eq('profile_id', params.id).order('position'),
  ])

  if (!profile) notFound()

  const films = (topFilms ?? []) as TopFilm[]

  return (
    <main className="min-h-screen bg-base text-ink">
      <Header
        pseudo={selfProfile?.pseudo ?? '?'}
        avatarUrl={selfProfile?.avatar_url ?? null}
        backHref="/friends"
      />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-fill shadow-card">
            <Image
              src={profile.avatar_url ?? '/default-avatar.png'}
              alt={profile.pseudo}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-wide">{profile.pseudo}</h1>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Top 4 films</h2>
          <Top4Grid films={films} editable={false} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Vérifier TypeScript**
```bash
npx tsc --noEmit
```
Expected: aucune erreur.

- [ ] **Step 4: Commit**
```bash
git add src/app/profile/page.tsx src/app/profile/[id]/page.tsx
git commit -m "feat: wire Top4Grid into profile pages"
```

---

## Final: PR

```bash
git push -u origin feat/profile-friends
```
Ouvrir une PR `feat/profile-friends` → `main`.
