App context — DispoSéance

Application mobile-first de coordination de sorties cinéma entre amis. Stack : Next.js 14 App Router, Tailwind CSS, TypeScript, Supabase. Déployée sur Vercel, utilisée uniquement sur mobile.

Flows utilisateur :
1. Login → liste des séances en cours
2. Clic sur une séance → vote des jours disponibles (grille de boutons)
3. Phase 2 → vote des horaires (même pattern)
4. Phase 3 → page de confirmation avec ShareCard exportable en image

État actuel du design system :
- Dark theme fixe
- Tokens déjà définis dans tailwind.config.ts — tous les fichiers utilisent ces tokens, plus de hex hardcodés :
  - accent / accent-fg = #FFC426 / #0A0A0A
  - base / surface / raised = surfaces sombres (page / card / input)
  - success / success-fg, danger / danger-fg / etc.
- Fonts : Space Grotesk (body), Anton et Archivo chargées via next/font avec CSS variables
- Pas de composants UI partagés — Button, Card, Badge sont inline partout

Objectif :
Rendre l'UI plus moderne et premium — dans l'esprit d'une app de divertissement haut de gamme (Letterboxd, Linear). Pas un redesign complet, une élévation : meilleure hiérarchie visuelle, surfaces plus riches, typographie plus expressive, micro-interactions plus soignées.

Ce que j'attends :

1. Révision des tokens dans tailwind.config.ts : ajuste la palette si tu as mieux (l'amber peut légèrement évoluer), affine les surfaces, ajoute radius / shadows personnalisés si pertinent.

2. Composants UI primitifs à créer dans src/components/ui/ : Button (variants : primary, ghost, danger), Card, Badge (status pill). Utilise cva (class-variance-authority, déjà installé).

3. Refonte de la home page (src/app/page.tsx) : liste de séances plus impactante, cards plus riches avec le poster en arrière-plan/ambiance.

4. Refonte du header/nav partagé entre home et movie detail — le rendre plus premium.

5. Refonte de la page de vote (src/components/movies/DayVoting.tsx ou TimeVoting.tsx) : les boutons de vote sont le cœur de l'UX, ils méritent le plus d'attention.

Contraintes absolues :
- Mobile-first, max-w-2xl sur desktop
- Ne pas toucher à la logique state/fetch dans DayVoting et TimeVoting — uniquement le JSX/classes
- ShareCard.tsx a des inline styles nécessaires pour l'export canvas — ne pas les convertir en Tailwind
- Ne pas ajouter de dépendances UI tierces (pas de shadcn, radix, framer-motion)
