# Spec — Accompagnants sans compte

**Date :** 2026-04-24
**Statut :** Approuvé

## Objectif

Permettre à l'admin d'ajouter des accompagnants (copines, famille…) qui n'ont pas de compte dans l'app, afin qu'ils apparaissent sur la carte finale de la séance. Ces personnes ne votent pas — elles sont juste visibles sur la carte partagée.

## Comportement attendu

### Étape "Qui participe ?" (step 3 — flow normal et step 3 — quick card)

Une section séparée apparaît sous la liste des participants avec compte :

```
─── + Sans compte (copines, famille…) ───

[ Sa copine ✕ ]

[ Ajouter un prénom… ]  [ OK ]
```

- L'input est un champ texte libre. Appuyer sur "OK" ou la touche Entrée ajoute le prénom comme pill.
- Chaque pill est supprimable via un ✕.
- Il n'y a pas de limite de nombre d'accompagnants.
- La section est optionnelle — si vide, aucun accompagnant n'est ajouté.

### Carte finale (ShareCard)

Les accompagnants apparaissent dans la section participants avec un style visuellement distinct des participants avec compte :

- **Participants avec compte** : pill jaune `#FFC426`, fond `rgba(255,196,38,0.12)`, bordure pleine
- **Accompagnants sans compte** : pill grisé, fond transparent, bordure pointillée `#444`, couleur `#888`

## Modèle de données

### Modification DB — table `movies`

Ajouter une colonne :

```sql
ALTER TABLE movies ADD COLUMN guests text[] NOT NULL DEFAULT '{}';
```

Pas de nouvelle table. Les accompagnants sont une donnée statique de la séance.

## Composants modifiés

### `src/app/movies/new/page.tsx`

- Ajouter le state `guests: string[]` et `guestInput: string`
- Ajouter la section "sans compte" dans le step 3 (participants) et le step 4 (quick card)
- Passer `guests` dans le body du POST `/api/movies` et dans l'appel à `createQuickCardAction`

### `src/app/api/movies/route.ts`

- Accepter `guests: string[]` dans le body JSON
- L'inclure dans l'insert Supabase sur la table `movies`

### `src/app/movies/new/actions.ts` — `createQuickCardAction`

- Accepter `guests: string[]` en paramètre
- L'inclure dans l'insert `movies`

### `src/components/summary/FinalSummary.tsx`

- Récupérer `movie.guests` depuis Supabase (déjà dans la query du movie detail ou à ajouter)
- Passer `guests` comme prop à `ShareCard`

### `src/components/summary/ShareCard.tsx`

- Ajouter la prop `guests: string[]`
- Rendre les pills accompagnants avec le style ghost après les pills participants normaux
- Garder le compteur "N participants" pour les comptes uniquement (les guests ne comptent pas dans le titre de section)

## Style des pills accompagnants (inline, pour html-to-image)

```tsx
// Ghost pill — accompagnant sans compte
{
  background: 'transparent',
  border: '1px dashed #444',
  color: '#888',
  fontSize: '14px',
  fontWeight: 600,
  padding: '4px 12px',
  borderRadius: '9999px',
}
```

## Ce qui ne change pas

- Les accompagnants n'apparaissent pas dans les phases de vote (jour, horaire)
- Ils ne sont pas des profils — pas d'auth, pas de RLS à gérer
- Le compteur de participants dans les composants de vote reste inchangé
