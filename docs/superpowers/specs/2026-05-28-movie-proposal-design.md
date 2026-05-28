# Movie Proposal Feature — Design Spec

**Date:** 2026-05-28  
**Status:** Approved

## Context

Before a voting session is created, the group needs to agree on which movie to see. Currently this happens on Snapchat via manual screenshots from Pathé. The TMDB API already provides poster, synopsis, and video data — this feature leverages them to generate a shareable message and image directly from the app.

## Goals

- Any logged-in user can search for a movie and generate shareable content for Snapchat
- Two share actions: copy a text message with trailer link, and share the poster image
- No new database tables required

## Pages

### `/propose` — Search page

- Accessible to all authenticated users (existing middleware covers this)
- Search bar with debounce calling existing `searchMovies()` from `/lib/tmdb/api.ts`
- Results list: poster (w200) + title + release year, each card links to `/propose/[tmdbId]`
- Pattern mirrors existing `/movies/new` search page

### `/propose/[tmdbId]` — Movie detail page

- Server component fetching `getMovieDetails(tmdbId)` and `getMovieVideos(tmdbId)` in parallel; passes data to a `<MovieProposalActions>` client component that handles the interactive elements (synopsis toggle, copy button, share button)
- If TMDB returns null for the movie, redirect to `/propose`
- Layout (mobile-first):
  - Poster (w500)
  - Title + release year
  - Synopsis (`overview` from TMDB), truncated to 3 lines with "voir plus" toggle
  - Two action buttons: **"Copier le message"** and **"Partager l'affiche"**

## TMDB Library Changes

New function in `/lib/tmdb/api.ts`:

```ts
getMovieVideos(tmdbId: number): Promise<string | null>
```

Calls `/movie/{id}/videos?language=fr-FR`, returns the YouTube `key` of the first result with `type === "Trailer"` and `site === "YouTube"`. Returns `null` if none found.

## Share Actions

### "Copier le message"

Copies to clipboard:
```
Qui chaud pour aller voir [TITRE] ? 🎬
Bande-annonce : https://youtube.com/watch?v=KEY
```

- If no trailer found, the second line is omitted
- Button shows "Copié ✓" for 2 seconds as feedback

### "Partager l'affiche"

1. Fetch poster image via existing `/api/image-proxy` route (avoids CORS)
2. Convert to `File` object
3. Call `navigator.share({ files: [file], title: movieTitle })` — opens native share sheet (Snapchat, WhatsApp, etc.)
4. Fallback: if `navigator.canShare({ files })` is false (desktop), trigger a direct download of the poster

## Navigation

Add a "Proposer un film" link/button on the home page (`/`), visible to all authenticated users.

## Out of Scope

- Saving proposals to the database
- Notifications to other participants
- Linking a proposal to a future voting session
