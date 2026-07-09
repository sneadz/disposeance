# Design — Page Profil & Amis

Date: 2026-07-09

## Contexte

DispoSéance est une app privée de vote de séances ciné. Tous les users se connaissent. On ajoute des profils publics avec photo, pseudo et top 4 films façon Letterboxd, ainsi qu'une page amis listant tous les users.

## Périmètre

Deux blocs distincts, implémentés dans cet ordre :
1. **Bloc 1** — Page amis (`/friends`)
2. **Bloc 2** — Page profil (`/profile` et `/profile/[id]`)

---

## Bloc 1 — Page amis

### Routes
- `/friends` — liste de tous les users de l'app (sauf soi-même)

### UI
- Design zinc/violet glassmorphism, cohérent avec le reste de l'app
- Grid de cards : avatar + pseudo
- Avatar = `avatar_url` si défini, sinon image par défaut (`/public/default-avatar.png`)
- Clic sur une card → `/profile/[id]`
- Bouton d'accès depuis la home (même style que les autres boutons de navigation)

### Data
- Lecture de la table `profiles` existante (filtre `id != current_user_id`)
- Pas de pagination (app privée, peu d'users)

---

## Bloc 2 — Page profil

### Routes
- `/profile` — son propre profil (éditable)
- `/profile/[id]` — profil d'un autre user (lecture seule)

### UI
- Design zinc/violet glassmorphism
- Photo de profil centrée en haut
- Pseudo en dessous
- Top 4 films en ligne (4 affiches côte à côte, style Letterboxd)
- Slots vides → placeholder avec `+` au centre (cliquable uniquement par l'owner)
- Sur son propre profil : bouton upload photo, slots top 4 éditables

### Top 4 films
- Slot vide → clic `+` → modal de recherche TMDB (logique réutilisée de `/movies/new`)
- Ajout → insère en DB avec `position` (1-4)
- Drag-and-drop pour réordonner → update `position` en DB
- Suppression : bouton `×` sur chaque affiche (owner uniquement)
- Lecture seule sur `/profile/[id]`

### Photo de profil
- Upload depuis le téléphone (input file)
- Stockée dans bucket Supabase `avatars`, nommée `{user_id}.jpg`
- URL sauvegardée dans `profiles.avatar_url`
- Image par défaut : `/public/default-avatar.png` (asset statique à ajouter)

---

## DB

### Modifications table `profiles`
```sql
ALTER TABLE profiles ADD COLUMN avatar_url text;
```

### Nouvelle table `profile_top_films`
```sql
CREATE TABLE profile_top_films (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  position integer CHECK (position BETWEEN 1 AND 4),
  tmdb_id text NOT NULL,
  title text NOT NULL,
  poster_url text NOT NULL,
  UNIQUE (profile_id, position)
);
```

### Supabase Storage
- Bucket `avatars` (public)
- Fichier : `{user_id}.jpg`

---

## Sécurité / Accès
- Profils publics pour tous les users authentifiés
- Édition (photo + top 4) uniquement si `session.user.id === profile_id`
- RLS sur `profile_top_films` : lecture publique, écriture owner uniquement

---

## Ce qu'on ne fait pas (YAGNI)
- Pas de système de demande d'ami (tous amis par défaut)
- Pas de pagination sur la liste amis
- Pas de bio / description
- Pas de resize d'image côté client
