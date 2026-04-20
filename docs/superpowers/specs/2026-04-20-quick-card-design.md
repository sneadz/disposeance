# Quick Card — Design Spec

**Date:** 2026-04-20
**Feature:** Création de carte rapide sans pipeline de vote

---

## Contexte

DispoSéance organise les séances cinéma via un pipeline de vote en deux phases (jours → horaires). La carte rapide permet de créer une séance directement confirmée, sans votes, quand la décision est déjà prise. L'entrée est enregistrée en base de données comme une séance clôturée normale, ce qui donne accès au lien, au calendrier, et au partage d'image.

---

## Flow utilisateur

```
Step 1 → Recherche film (inchangé)
Step 2 → Sélection de date(s) (inchangé)
          └─ si exactement 1 date sélectionnée → bouton "Faire une carte rapide" visible au step 3
Step 3 → Sélection participants (inchangé)
          └─ bouton secondaire "Faire une carte rapide" (conditionnel)
Step 4 → Choix de l'horaire → submit → DB → redirect /movies/[id] → FinalSummary
```

Le bouton "Faire une carte rapide" est uniquement visible au step 3 si `selectedDates.length === 1`. Cette contrainte évite toute ambiguïté sur la date à utiliser.

---

## Architecture

### Modifications de `src/app/movies/new/page.tsx`

- Étendre le type de step : `1 | 2 | 3 | 4`
- Ajouter le state : `selectedTime: string` (format `"HH:MM"`)
- Au step 3 : afficher un bouton secondaire "Faire une carte rapide" conditionné par `selectedDates.length === 1`, qui appelle `setStep(4)`
- Ajouter le rendu du step 4 : saisie d'horaire + bouton de soumission

### Nouveau step 4 UI

- Header sticky identique aux autres steps, titre "Carte rapide", retour → step 3
- Récapitulatif film + date sélectionnée (même card de résumé que steps 2/3)
- `<input type="time">` stylé avec le thème de l'app (bg-zinc-900, border zinc-800, focus ring #FFC426)
- Bouton "Créer la carte" activé dès qu'un horaire est saisi, déclenche `handleQuickCardSubmit`

### Nouveau server action `createQuickCardAction`

Fichier : `src/app/movies/new/actions.ts` (ajout à l'existant)

Séquence d'insertion en base :

1. Insérer dans `movies` : `status: 'closed'`, `participant_ids`, `title`, `tmdb_id`, `poster_url`, `release_date`
2. Insérer dans `available_days` : 1 entrée pour la date sélectionnée
3. Insérer dans `showtimes` : `movie_id`, `datetime` (combinaison date + heure en ISO, timezone Europe/Paris)
4. Mettre à jour `movies.final_showtime_id` avec l'id du showtime créé
5. Insérer dans `time_votes` : une entrée par participant (`showtime_id`, `user_id`, `available: true`) — alimente la liste des participants dans FinalSummary
6. Retourner `{ movieId, error }`

### Redirect

Après succès : `window.location.href = /movies/${movieId}` — identique au flow normal. La page `/movies/[id]` détecte `status: 'closed'` et affiche `FinalSummary` sans modification.

---

## Contraintes et règles

- Accès réservé aux admins (même règle que la création normale — vérifiée côté server action)
- Aucune modification de `FinalSummary`, `ShareCard`, ou `/movies/[id]/page.tsx`
- La séance créée est indiscernable d'une séance clôturée via le pipeline normal
- Le datetime est construit en combinant `selectedDates[0]` (YYYY-MM-DD) + `selectedTime` (HH:MM) avec timezone `Europe/Paris`, cohérent avec le reste de l'app

---

## Ce qui ne change pas

- `FinalSummary` : aucune modification
- `ShareCard` : aucune modification
- `/movies/[id]/page.tsx` : aucune modification
- API route `/api/movies` : aucune modification
- Pipeline de vote existant : aucune modification
