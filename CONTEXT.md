# CONTEXT.md - État d'avancement - DispoSéance

## État actuel
- [x] Initialisation Next.js + Tailwind + TypeScript
- [x] Installation des dépendances (Supabase, date-fns, lucide-react, @supabase/ssr)
- [x] Définition du PLAN.md
- [x] Script SQL pour les tables et comptes
- [x] Configuration Supabase client & server (Migration vers @supabase/ssr pour Next.js 14)
- [x] Page de Login (authentification par pseudo/password, insensible à la casse)
- [x] Page d'Accueil : Dashboard multi-films, design mobile-first glassmorphism
- [x] Phase 1 : Recherche de film (Admin) via TMDB + sélection des jours disponibles
- [x] Phase 2 : Vote jours (Tous) - Interface Grid Mobile optimisée
- [x] Phase 3 : Saisie horaires (Admin) - datetime complet
- [x] Phase 4 : Vote horaires (Tous) - Interface Grid Mobile optimisée
- [x] Phase 5 : Carte finale exportable (ShareCard) + partage natif (Web Share API) + .ics
- [x] Correction URL images TMDB (getPosterUrl gère path seul ou URL complète)
- [x] Suppression film avec confirmation (DeleteMovieButton, server action)
- [x] Navigation standardisée avec window.location.href
- [x] Création film via REST API (/api/movies)

- [x] Carte rapide : step 4 dans `/movies/new` — séance directement `closed` sans vote (bouton au step 3 si 1 seule date, saisie horaire, insertion DB via `createQuickCardAction`, redirect FinalSummary)
- [x] Ex-æquo jours : page saisie horaires détecte les jours à égalité, affiche badge ⚖️ et sélecteur de jours
- [x] Saisie horaires par jour : chaque jour sélectionné a sa propre liste d'horaires indépendante
- [x] Vote horaires groupé par jour : headers de date quand plusieurs jours, dateLabel dans carte sinon

- [x] Profils publics + page amis : avatar cliquable dans navbar → `/profile`, page `/friends` liste tous les users, `/profile/[id]` en lecture seule
- [x] Upload photo de profil : direct navigateur → Supabase Storage bucket `avatars` (contourne la limite 1MB des server actions), conversion canvas + fallback `heic-to` pour les photos iPhone HEIC
- [x] Top 4 films façon Letterboxd : 4 slots en ligne, recherche TMDB en modal, drag-and-drop (@dnd-kit, `touch-action: none` pour le mobile), table `profile_top_films`
- [x] Logo de marque = `favicon.png` dans navbar + login ; fond dark sur html/body + theme-color pour les safe areas iOS

## Décisions techniques finales
- Multi-films via routes dynamiques `/movies/[id]`.
- `@supabase/ssr` pour compatibilité Next.js 14.
- Authentification par pseudo (pas email) — login case-insensitive via `.ilike()`.
- Interface Mobile-First, design sombre zinc/violet, glassmorphism.
- Navigation via `window.location.href` (pas next/navigation) pour éviter les bugs de cache.
- Export `.ics` généré côté client.
- ShareCard : `html-to-image` (toPng, 100% inline styles) capture le composant visuel → Web Share API (Snap, WhatsApp…), fallback download. Proxy TMDB pour CORS.
- Images TMDB : `getPosterUrl()` dans `lib/tmdb/api.ts` — détecte URL complète vs path relatif.
- Participants de la carte finale : `time_votes` filtrés sur `final_showtime_id + available=true`, jointure `profiles`.
