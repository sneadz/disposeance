# Design — Toggle filtre séances (mes séances / toutes)

## Contexte

Sur la page d'accueil, tous les utilisateurs voient toutes les séances, même celles auxquelles ils ne participent pas. On veut afficher par défaut uniquement les séances de l'utilisateur connecté, avec un toggle pour voir toutes les séances.

## Approche choisie : URL query param (`?all=true`)

Le server component lit `searchParams`, filtre la requête Supabase. Un client component minimal gère le toggle via l'URL.

## Architecture

### `src/app/page.tsx` (server component)

- Signature : `export default async function Home({ searchParams }: { searchParams: { all?: string } })`
- Si `all` absent → filtre `.contains('participant_ids', [user.id])`
- Si `all=true` → pas de filtre, toutes les séances
- Sous-titre adapté :
  - Vue filtrée : `"N de tes séances"` / `"Aucune pour toi"`
  - Vue toutes : `"N en cours"` / `"Aucune en cours"`

### `src/components/movies/SeancesToggle.tsx` (client component)

- Reçoit `showAll: boolean` en prop
- Bouton toggle : "Mes séances" ↔ "Toutes"
- Utilise `useRouter` + `useSearchParams` pour push l'URL
- Intégré dans la section titre de `page.tsx`, à droite du sous-titre

## Données

La table `movies` a une colonne `participant_ids` (array UUID[]). Un utilisateur est participant si son `id` est dans ce tableau.

## Comportement

- Par défaut (pas de query param) → vue "Mes séances"
- `?all=true` → vue "Toutes les séances"
- L'état est conservé au refresh
- Empty state adapté selon la vue active
