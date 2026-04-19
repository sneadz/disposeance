# Design Spec — Thème Pathé

**Date :** 2026-04-19  
**Statut :** Approuvé, prêt à implémenter

## Objectif

Remplacer le thème zinc/violet par le thème noir/jaune inspiré de l'identité visuelle Cinémas Pathé Gaumont. L'app doit ressembler à une extension naturelle de l'app Pathé, cohérente avec leur charte graphique officielle.

## Couleurs

### Palette Pathé officielle
| Token | Valeur | Usage |
|---|---|---|
| `pathe-yellow` | `#FFC426` | Accent principal (ex-violet-600) |
| `pathe-yellow-dark` | `#E6A800` | Hover / ombres jaunes |
| `pathe-black` | `#0A0A0A` | Fond général (quasi identique à zinc-950) |
| `pathe-card` | `#1A1A1A` | Fond des cartes (ex-zinc-800/900) |
| `pathe-card-alt` | `#141414` | Fond des sections imbriquées |
| `pathe-border` | `#252525` | Bordures des cartes |
| `pathe-border-strong` | `#333` | Bordures boutons secondaires |

### Mapping violet → jaune (exhaustif)
| Classe Tailwind actuelle | Remplacement |
|---|---|
| `bg-violet-600` | `bg-[#FFC426]` |
| `bg-gradient-to-r from-violet-600 to-fuchsia-600` | `bg-[#FFC426]` (flat, pas de gradient) |
| `border-violet-500` | `border-[#FFC426]` |
| `text-violet-300` | `text-[#FFC426]` |
| `text-violet-400` | `text-[#FFC426]` |
| `ring-violet-500` | `ring-[#FFC426]` |
| `shadow-violet-500/20` | `shadow-[#FFC426]/20` |
| `bg-violet-600/10` | `bg-[#FFC426]/10` |
| `border-violet-500/20` | `border-[#FFC426]/20` |
| `active:text-violet-400` | `active:text-[#FFC426]` |
| `active:border-violet-500` | `active:border-[#FFC426]` |
| `focus:border-violet-500` | `focus:border-[#FFC426]` |
| `focus:ring-violet-500` | `focus:ring-[#FFC426]` |

## Composants

### Cartes de vote sélectionnées
```
Avant : bg-violet-600 border-violet-500 text-white shadow-violet-500/20
Après : bg-[#FFC426] border-[#FFC426] text-[#0A0A0A] shadow-[#FFC426]/20
```
- Texte heure : `text-[#0A0A0A]` (noir)
- Sous-texte date : `text-[#0A0A0A] opacity-60`
- Icône Users : `stroke="#0A0A0A" opacity-65`
- Icône Check : `stroke="#0A0A0A"`

### Bouton primaire (Confirmer, Lancer le vote, Clôturer)
```
Avant : bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white
Après : bg-[#FFC426] text-[#0A0A0A] font-bold
```
Note : le bouton "Clôturer" était emerald/teal → passe aussi en `#FFC426` pour uniformité.

### Bouton secondaire neutre (Copier le lien, Modifier mes votes, Annuler)
```
Avant : border border-zinc-700 text-zinc-400
Après : bg-[#222] border border-[#333] text-[#E5E5E5]
```

### Bouton secondaire rouge (Recommencer le vote)
```
Avant : border border-red-900/40 text-red-500
Après : bg-[#2a0a0a] border border-[#5f1f1f] text-[#f87171]
```

### Pills de statut (page d'accueil)
```
picking_days  → bg-[#FFC426]/15 text-[#FFC426] ring-1 ring-[#FFC426]/30
picking_times → bg-[#FFC426]/15 text-[#FFC426] ring-1 ring-[#FFC426]/30
done          → bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 (inchangé)
```

### Inputs (focus)
```
focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426]
```

### Badge ex-æquo (showtimes page)
```
Avant : bg-amber-500/10 border-amber-500/20 text-amber-300
Après : bg-[#FFC426]/10 border-[#FFC426]/20 text-[#FFC426]
```

## ShareCard

Redessin complet en noir/jaune Pathé :

- **Fond** : `#0A0A0A`
- **Accent bar** : barre verticale `#FFC426` à gauche du header
- **Label** : "DispoSéance" en `#FFC426`, sous-titre "Cinémas Pathé" en `#555`
- **Badge confirmation** : cercle `#FFC426` avec checkmark `#0A0A0A` + texte "C'est confirmé !" en `#FFC426`
- **Bloc infos séance** : fond `#141414`, bordure `#222`, icônes calendrier + users en `#FFC426`
- **Footer** : badge `bg-[#FFC426] text-[#0A0A0A]` avec texte "PATHÉ"
- **Ombres jaunes** : `box-shadow: 0 8px 24px rgba(255,196,38,0.15)`

## Fichiers à modifier

| Fichier | Nature des changements |
|---|---|
| `src/components/movies/DayVoting.tsx` | Couleurs sélection + boutons |
| `src/components/movies/TimeVoting.tsx` | Couleurs sélection + boutons |
| `src/app/page.tsx` | Pills de statut |
| `src/app/movies/[id]/page.tsx` | Pills de statut |
| `src/app/movies/[id]/showtimes/ShowtimesForm.tsx` | Boutons + inputs |
| `src/app/movies/[id]/showtimes/page.tsx` | Badge ex-æquo |
| `src/app/movies/[id]/close/CloseMovieForm.tsx` | Bouton primaire |
| `src/app/movies/new/page.tsx` | Boutons + inputs |
| `src/components/summary/ShareCard.tsx` | Redessin complet |
| `src/components/summary/FinalSummary.tsx` | Boutons |

## Ce qui ne change pas

- Fonds noirs (`zinc-950`, `zinc-900`, `zinc-800`) — quasi identiques à la palette Pathé
- Bouton destructif rouge "Confirmer reset" (inline) — garde `bg-red-600`
- Textes zinc-400/500 pour le texte secondaire
- Icônes lucide-react — même taille et style
