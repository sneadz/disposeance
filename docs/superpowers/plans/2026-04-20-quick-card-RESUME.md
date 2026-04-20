# Reprise — Quick Card

## Contexte en une phrase
Ajouter un step 4 "Carte rapide" dans le wizard `/movies/new` : bouton visible au step 3 si 1 seule date sélectionnée → saisie horaire → insertion DB directement `closed` → redirect FinalSummary.

## Fichiers à toucher (2 seulement)
- `src/app/movies/new/actions.ts` — ajouter `createQuickCardAction`
- `src/app/movies/new/page.tsx` — étendre le wizard avec step 4 + bouton step 3

## Plan complet
`docs/superpowers/plans/2026-04-20-quick-card.md`

## Spec de référence
`docs/superpowers/specs/2026-04-20-quick-card-design.md`

## Lancer l'exécution
Dire à Claude : **"Exécute le plan `docs/superpowers/plans/2026-04-20-quick-card.md` en mode inline (executing-plans)"**
