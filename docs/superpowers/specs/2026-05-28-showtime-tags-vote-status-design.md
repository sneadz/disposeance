# Design — Tags de séance & Statut des votes

Date : 2026-05-28

## Contexte

Deux améliorations UX pour les admins de DispoSéance :
1. Différencier visuellement des séances du même film (IMAX, 4DX, +)
2. Savoir en temps réel qui n'a pas encore voté pour relancer les participants

---

## Feature 1 — Tags de séance

### Objectif
Permettre à l'admin d'associer un tag optionnel à chaque horaire saisi, afin de distinguer deux séances du même film en un coup d'œil (ex : 20h10 IMAX vs 20h10 standard).

### Base de données
Migration SQL :
```sql
ALTER TABLE showtimes ADD COLUMN tag TEXT CHECK (tag IN ('IMAX', '4DX', '+'));
```
- Nullable (pas obligatoire)
- Contrainte CHECK côté DB, liste fixe : `IMAX`, `4DX`, `+`

### Saisie (ShowtimesForm)
- Chaque ligne d'horaire dans le formulaire de saisie contient : input time + 3 boutons toggle (`IMAX` / `4DX` / `+`)
- Un seul tag sélectionnable par ligne, re-clic désélectionne
- Le tag est soumis avec l'horaire au moment du submit — un horaire = un tag optionnel

### Affichage vote horaires (TimeVoting)
- Le tag s'affiche en badge compact à côté de l'horaire : `20h10 · IMAX`
- Utile quand deux séances du même jour ont des tags différents

### Affichage carte finale (ShareCard)
- Le tag de la séance retenue apparaît à côté de l'horaire sur la carte exportable

---

## Feature 2 — Badge compteur de votes

### Objectif
Permettre à l'admin de voir en temps réel qui a voté et qui ne l'a pas encore fait, pendant les phases de vote, pour pouvoir relancer les retardataires avant de passer à l'étape suivante.

### Badge
- Affiché sur la page film (`/movies/[id]`) pendant les phases 2 (vote jours) et 4 (vote horaires)
- Visible admin seulement
- Style discret : `👥 3/4`, cliquable
- Positionné près du titre de la phase en cours

### Modale
- Au clic sur le badge, ouvre une modale listant tous les participants du film
- Chaque participant : pastille verte (a voté) ou rouge (n'a pas encore voté)
- Les non-votants affichés en premier pour identification rapide

### Données
- Server action : `getVoteStatusAction(movieId, phase)` où `phase = 'days' | 'times'`
- Phase `days` : croise les participants avec `day_votes` pour ce film
- Phase `times` : croise les participants avec `time_votes` pour ce film
- Retourne : `{ voted: Profile[], pending: Profile[], total: number }`
- Le badge calcule le ratio `voted.length / total` depuis le même appel

### Périmètre
- Uniquement les participants assignés au film (pas tous les profils de l'appli)
- Couvre les deux phases de vote (jours et horaires)

---

## Fichiers impactés (estimation)

| Fichier | Modification |
|---|---|
| `supabase/migrations/` | Nouvelle migration `tag` sur `showtimes` |
| `app/movies/[id]/showtimes/` | Ajout des toggle buttons dans `ShowtimesForm` |
| `components/TimeVoting.tsx` | Affichage du badge tag sur chaque horaire |
| `components/ShareCard.tsx` | Affichage du tag sur la carte finale |
| `app/movies/[id]/page.tsx` | Badge compteur + modale admin |
| `actions/` | Nouvelle server action `getVoteStatusAction` |
