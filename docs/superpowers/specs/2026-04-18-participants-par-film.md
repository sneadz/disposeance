# Spec — Participants par film

## Objectif
Permettre à l'admin de définir les participants d'une séance à la création du film. Seuls ces participants peuvent voter. L'affichage des votes passe de `x` à `x/n` partout.

## Décisions clés
- Les participants sont fixés une fois pour toutes à la création, ils ne changent pas.
- Stockage : colonne `participant_ids uuid[]` sur la table `movies` (pas de nouvelle table).
- Seuls les participants inscrits peuvent voter (vérification dans les server actions).

## Changements

### Base de données
```sql
alter table movies add column participant_ids uuid[] default '{}';
```

### `/movies/new` — Étape 3
Nouveau step (état `step: 1 | 2 | 3`) après la sélection des jours :
- Fetch tous les `profiles` (id + pseudo) au montage du step 3
- Checkboxes pour sélectionner les participants
- Submit envoie `{ movie, availableDates, participantIds: string[] }` à `/api/movies`

### `/api/movies` — POST
Reçoit `participantIds: string[]`, stocke dans `movies.participant_ids` à l'insert.

### Server actions (`votes.ts`)
`confirmDayVotesAction` et `confirmTimeVotesAction` vérifient que `user.id` est dans `movie.participant_ids` avant d'écrire. Retournent `{ error: 'Non autorisé' }` sinon.

### `/movies/[id]/page.tsx`
La requête `movies` sélectionne aussi `participant_ids`. Calcule `participantCount = movie.participant_ids.length`. Passe `participantCount` en prop à `DayVoting` et `TimeVoting`.

### `DayVoting`
- Prop `participantCount: number` ajouté
- Affichage : `{voterCount}/{participantCount}` au lieu de `{voterCount}`

### `TimeVoting`
- Prop `participantCount: number` ajouté
- Affichage : `{voterCount}/{participantCount}` au lieu de `{voterCount}`

## Hors scope
- Modification des participants après création
- Affichage x/n sur FinalSummary / ShareCard (déjà nommé/listé)
