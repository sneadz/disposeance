# CONTEXT.md - État d'avancement - DispoSéance

## État actuel
- [x] Initialisation Next.js + Tailwind + TypeScript
- [x] Installation des dépendances (Supabase, date-fns, lucide-react, @supabase/ssr)
- [x] Définition du PLAN.md
- [x] Script SQL pour les tables et comptes
- [x] Configuration Supabase client & server (Migration vers @supabase/ssr pour Next.js 14)
- [x] Page de Login (Adaptée pour Email/Password selon demande utilisateur)
- [x] Page d'Accueil : Liste des films en cours (Multi-films support)
- [x] Phase 1 : Recherche de film (Admin) via TMDB
- [x] Phase 2 : Vote jours (Tous) avec Polling 30s - Interface Grid Mobile optimisée (2 cols)
- [x] Phase 3 : Saisie horaires (Admin)
- [x] Phase 4 : Vote horaires (Tous) avec Polling 30s - Interface Grid Mobile optimisée (2 cols)
- [x] Phase 5 : Clôture et export (Admin/Tous) - Carte récap, .ics, Snapchat

## Décisions techniques finales
- Passage d'une application "Mono-film" à une application "Multi-films" avec routes dynamiques `/movies/[id]`.
- Utilisation de `@supabase/ssr` au lieu de `auth-helpers` pour une meilleure compatibilité Next.js 14.
- Authentification par Email/Password suite à la mise en place des vrais comptes par l'utilisateur.
- Interface utilisateur "Mobile-First" avec grilles compactes 2 colonnes et arrondis prononcés (3xl).
- Polling 30s via `setInterval` pour garder les votes à jour sans surcharger la DB.
- Navigation fluide avec bouton Retour (Home) et bouton Déconnexion explicite.
- Export `.ics` généré côté client pour compatibilité immédiate iOS/Android.
