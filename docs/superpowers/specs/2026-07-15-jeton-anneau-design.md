# Le Jeton de l'Anneau Unique — Design

**Date :** 2026-07-15
**Statut :** validé, prêt pour plan d'implémentation

## Résumé

Un mini-jeu entre 3 amis (Robin, Joana, Florian). Chacun dispose d'**un jeton par
trimestre**. L'utiliser permet de **forcer une séance** : proposer un film que les 2
autres sont (socialement) obligés de venir voir. Thème visuel : **Le Seigneur des
Anneaux** — le jeton EST l'Anneau Unique.

Mécaniquement, le parcours est **identique au pipeline de base** (proposer film → voter
jours → voter horaires → carte finale). Le jeton ajoute : une économie 1/trimestre, le
droit pour un non-admin de créer ce film, et une direction artistique (DA) LOTR sur
certains écrans.

## Modèle de données

Aucune refonte, 2 colonnes + 1 mini-table.

- **`profiles.can_use_token`** `boolean not null default false`
  Mis à `true` pour les 3 porteurs. Souple : ajouter/retirer quelqu'un = un UPDATE.

- **`movies.token_owner_id`** `uuid null references profiles(id)`
  `null` = film normal. Un id = film-jeton, dépensé par cette personne. Sert à
  l'**affichage / DA** (quels films sont des films-jeton). `is_token ≡ token_owner_id IS NOT NULL`.

- **`token_spends`** (nouvelle table — le registre anti-triche)
  | colonne     | type          | notes                                  |
  |-------------|---------------|----------------------------------------|
  | `user_id`   | uuid          | references profiles(id)                |
  | `quarter`   | text          | ex. `"2026-Q3"`                        |
  | `created_at`| timestamptz   | default now()                          |

  **Contrainte `UNIQUE(user_id, quarter)`** → la règle « un seul jeton par trimestre »
  est garantie par la base, pas par du code applicatif. Cette table **survit à la
  suppression du film** : un jeton dépensé le reste (choix anti-triche validé).

## Règle de disponibilité du jeton

Le jeton d'un user est disponible si :

```
profiles.can_use_token = true
ET  il n'existe pas de token_spends(user_id = moi, quarter = trimestre courant)
```

- **Trimestre courant** : `[jan–mars] Q1`, `[avr–juin] Q2`, `[juil–sept] Q3`,
  `[oct–déc] Q4`. Format `"YYYY-Q{1..4}"`. Reset automatique au changement de trimestre,
  **zéro cron**.
- Fonction utilitaire pure `currentQuarter(date = new Date()): string` avec un self-check
  (assert sur les 4 bornes de trimestre).

## Parcours utilisateur

1. **FAB anneau** — bouton flottant en bas à droite de l'accueil (`/`), visible
   **seulement si le jeton du user courant est disponible**. Aucun FAB flottant
   n'existe aujourd'hui : nouveau composant `TokenFab`.
2. Clic → `/movies/new?token=1`.
3. La page `/movies/new` réutilise **le flux existant tel quel** (recherche TMDB →
   sélection jours → participants). Le param `token=1` est propagé jusqu'au POST.
4. Le POST `/api/movies` reçoit `token: true` et écrit `token_owner_id = user.id` +
   insère la ligne `token_spends`.
5. La suite (vote jours, horaires, carte finale) se passe sur les routes existantes
   `/movies/[id]/...`, qui lisent `token_owner_id` pour décider du rendu.

## Sécurité — le cœur du mécanisme

`POST /api/movies` gate aujourd'hui sur `is_admin` (route.ts:9-10). Le jeton **débloque
ce droit pour un non-admin**, donc la validation serveur doit être stricte :

```
si body.token === true :
    - exiger profiles.can_use_token = true       (sinon 403)
    - insérer token_spends(user, currentQuarter)  AVANT ou pendant l'insert film
      → si violation de la contrainte UNIQUE : 409 "Jeton déjà utilisé ce trimestre"
        (protège aussi contre le double-clic / la course)
    - poser token_owner_id = user.id sur le film
    - ce chemin CONTOURNE le check is_admin
sinon :
    - comportement actuel (exiger is_admin)
```

Ne jamais se fier au masquage du FAB : toute la règle est ré-appliquée serveur.

## Direction artistique (DA) — option 3 + marqueur

Habillage LOTR sur :

- **Le FAB anneau** (entrée).
- **La carte du film-jeton dans la liste d'accueil** (rendu conditionnel
  `token_owner_id ? carteAnneau : carteNormale`).
- **La carte finale partageable** : version LOTR du `ShareCard` existant
  (`src/components/summary/ShareCard.tsx`) — **même mécanique** `html-to-image` +
  Web Share API, seul l'habillage change.

Les **écrans de vote intermédiaires gardent le design normal** + un **petit marqueur
anneau discret** (badge « ⌾ Séance de l'Anneau ») rendu quand `movie.token_owner_id`,
pour signaler le contexte sans refaire la DA partout.

Les visuels sont produits séparément sur Claude Design puis câblés (voir la liste de
demandes ci-dessous).

## Réutilisation (principe directeur)

**Aucun écran de vote n'est dupliqué.** On ajoute une colonne au flux existant + du
rendu conditionnel. Le pipeline vit une seule fois. Le film-jeton n'est qu'un film
normal avec `token_owner_id` renseigné et un habillage différent.

## Ce qui est explicitement HORS scope

- Pas de notification / relance automatique aux 2 autres (« obligation » = sociale).
- Pas de blocage du vote : les 2 autres votent leurs dispos normalement (comme le base).
- Pas de compteur/badge de jetons restants ailleurs que le FAB.
- Pas de cron de reset : la dispo est calculée à la volée.

## Demandes Claude Design (livrables visuels)

Thème : Le Seigneur des Anneaux, l'Anneau Unique. Palette or/braise sur fond sombre,
gravure elfique. 4 livrables :

1. **FAB anneau** — bouton flottant rond, l'Anneau Unique (or, éventuellement
   inscription elfique qui rougeoie). État normal + état pressé/hover. Petit format
   (~56px), lisible en bas à droite sur fond de liste sombre.
2. **Carte de film-jeton (liste accueil)** — variante de la carte film normale, mais
   habillage anneau : bordure/glow doré, éventuel filigrane d'anneau, badge « Séance de
   l'Anneau ». Doit rester lisible (titre, poster, statut du vote) et cohérente avec la
   largeur des cartes existantes.
3. **Marqueur discret** — petit badge/pictogramme anneau « ⌾ Séance de l'Anneau » à
   poser en tête des écrans de vote (jours/horaires) qui gardent le design normal.
4. **Carte finale LOTR (ShareCard)** — version themée de la carte partageable existante :
   titre du film, date/heure retenue, participants. Format portrait partageable
   (screenshot). Doit rendre en pur inline-style (contrainte `html-to-image`).
