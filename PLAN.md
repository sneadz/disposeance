# Plan de Développement - DispoSéance

Ce document détaille l'architecture et les décisions techniques pour le projet DispoSéance.

## Architecture
- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Backend/Base de données** : Supabase (Auth + PostgreSQL) via `@supabase/ssr` (Next.js 14)
- **API Externes** :
    - TMDB API (Recherche de films)
    - Allociné (Saisie manuelle)
- **Déploiement** : Vercel

## Structure des Pages
- `/login` : Connexion Email/Password.
- `/` : Accueil, liste des films actifs.
- `/movies/new` : Recherche et création d'un film (Admin).
- `/movies/[id]` : Interface de vote dynamique pour un film.
- `/movies/[id]/showtimes` : Saisie des horaires (Admin).
- `/movies/[id]/close` : Clôture de la séance (Admin).

## Schéma de Base de Données (Supabase)

### Tables
- `profiles` : id (uuid), pseudo (text), is_admin (boolean)
- `movies` : id (uuid), title (text), tmdb_id (text), poster_url (text), release_date (date), status (text), final_showtime_id (uuid)
- `available_days` : id (uuid), movie_id (uuid), date (date)
- `day_votes` : id (uuid), user_id (uuid), movie_id (uuid), date (date), available (boolean)
- `showtimes` : id (uuid), movie_id (uuid), datetime (timestamp)
- `time_votes` : id (uuid), user_id (uuid), showtime_id (uuid), available (boolean)

## Flux de l'application
1. **Accueil** : Liste tous les films proposés. Possibilité d'en créer un nouveau (Admin).
2. **Phase 1 (Admin)** : Recherche TMDB et sélection des dates.
3. **Phase 2 (Tous)** : Vote jours (Grid 2 cols sur mobile). Polling 30s.
4. **Phase 3 (Admin)** : Sélection jour et saisie manuelle des horaires.
5. **Phase 4 (Tous)** : Vote horaires (Grid 2 cols sur mobile). Polling 30s.
6. **Phase 5 (Tous)** : Récapitulatif final, bouton `.ics` et résumé Snapchat.

## Décisions Techniques
- **Architecture** : Support Multi-films via routes dynamiques.
- **Auth** : `@supabase/ssr` avec sessions sécurisées. Login par pseudo (pas email), case-insensitive.
- **UI/UX** : Design sombre zinc/violet, mobile-first, glassmorphism. Pas de polling — actions serveur + navigation complète.
- **Navigation** : `window.location.href` partout (pas next/navigation) pour éviter les bugs de cache SSR.
- **Images** : `getPosterUrl(path, size)` dans `lib/tmdb/api.ts` — gère URL complète ou path TMDB.
- **ShareCard** : `html-to-image` (toPng) + Web Share API (`navigator.share({ files })`) pour partage natif mobile. Fallback download sur desktop. Composant `ShareCard` pur visuel 100% inline styles (compatibilité html-to-image), `FinalSummary` orchestre les actions. Images TMDB proxiées via `/api/image-proxy` avant capture pour contourner CORS.
- **Création film** : REST API `/api/movies` (POST) au lieu de server action pour éviter les problèmes de navigation.

## État des fonctionnalités

### Complètes ✅
L'application est fonctionnelle de bout en bout avec le pipeline de vote complet.

### En attente 🔲
Aucune fonctionnalité en attente.
