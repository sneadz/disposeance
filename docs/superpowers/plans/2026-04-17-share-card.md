# Share Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the FinalSummary into a single exportable visual card shareable via the native share sheet (Snapchat, WhatsApp, etc.).

**Architecture:** A new `ShareCard` component renders the pure visual card (poster, title, date, time, participants, branding). `FinalSummary` wraps it with action buttons below. `html2canvas` captures the card as PNG, then the Web Share API opens the native share sheet; download fallback for desktop. Participants are fetched server-side in `movies/[id]/page.tsx` via `time_votes` joined with `profiles`.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, html2canvas, Supabase, Web Share API

---

### Task 1: Install html2canvas

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd /Users/robinperso/Documents/perso/disposeance
npm install html2canvas
npm install --save-dev @types/html2canvas
```

- [ ] **Step 2: Verify it appears in package.json dependencies**

```bash
grep html2canvas package.json
```

Expected: `"html2canvas": "^1.x.x"` in dependencies.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add html2canvas for share card image export"
```

---

### Task 2: Fetch participants in movie page

**Files:**
- Modify: `src/app/movies/[id]/page.tsx`

- [ ] **Step 1: Add participants query after the finalDatetime block**

In `src/app/movies/[id]/page.tsx`, after the `finalDatetime` block (around line 49), add:

```typescript
  let participants: string[] = []
  if (movie.status === "closed" && movie.final_showtime_id) {
    const { data: votes } = await supabase
      .from("time_votes")
      .select("profiles(pseudo)")
      .eq("showtime_id", movie.final_showtime_id)
      .eq("available", true)
    participants = (votes ?? [])
      .map((v: { profiles: { pseudo: string } | null }) => v.profiles?.pseudo)
      .filter(Boolean) as string[]
  }
```

- [ ] **Step 2: Pass posterUrl and participants to FinalSummary**

Find the `<FinalSummary` usage (around line 128) and update it:

```tsx
<FinalSummary
  movieTitle={movie.title}
  posterUrl={getPosterUrl(movie.poster_url, 'w200')}
  finalDatetime={finalDatetime}
  participants={participants}
  isAdmin={isAdmin}
  onReset={resetMovie}
/>
```

- [ ] **Step 3: Build check**

```bash
cd /Users/robinperso/Documents/perso/disposeance
npm run build 2>&1 | tail -20
```

Expected: build succeeds (TypeScript will complain about missing props in FinalSummary — that's expected, will be fixed in Task 3).

- [ ] **Step 4: Commit**

```bash
git add src/app/movies/[id]/page.tsx
git commit -m "feat: fetch participants and poster for share card"
```

---

### Task 3: Create ShareCard component

**Files:**
- Create: `src/components/summary/ShareCard.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/summary/ShareCard.tsx`:

```tsx
import Image from 'next/image'
import { Film } from 'lucide-react'

interface ShareCardProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  participants: string[]
}

export default function ShareCard({ movieTitle, posterUrl, day, time, participants }: ShareCardProps) {
  return (
    <div
      id="share-card"
      className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Background blur poster */}
      {posterUrl && (
        <div className="absolute inset-0">
          <Image
            src={posterUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-10 blur-xl scale-110"
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-zinc-950/90 to-zinc-950" />

      {/* Content */}
      <div className="relative p-6 space-y-5">
        {/* Header: poster + title */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-xl bg-zinc-800">
            {posterUrl ? (
              <Image src={posterUrl} alt={movieTitle} fill sizes="56px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-6 h-6 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">Séance confirmée</p>
            <h2 className="font-bold text-xl leading-tight line-clamp-3">{movieTitle}</h2>
          </div>
        </div>

        {/* Date & time */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 space-y-0.5">
          <p className="text-zinc-400 text-sm font-medium">{day}</p>
          <p className="text-4xl font-bold text-violet-400 tracking-tight">{time}</p>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2.5">
              {participants.length === 1 ? '1 participant' : `${participants.length} participants`}
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((pseudo) => (
                <span
                  key={pseudo}
                  className="bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-semibold px-3 py-1 rounded-full"
                >
                  {pseudo}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Branding */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1 rounded-lg">
            <Film className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-zinc-500">DispoSéance</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/summary/ShareCard.tsx
git commit -m "feat: add ShareCard visual component"
```

---

### Task 4: Update FinalSummary with ShareCard and share button

**Files:**
- Modify: `src/components/summary/FinalSummary.tsx`

- [ ] **Step 1: Replace FinalSummary content**

Replace the entire content of `src/components/summary/FinalSummary.tsx` with:

```tsx
'use client'

import { useRef, useState } from 'react'
import { Calendar, Share2, Check, RotateCcw } from 'lucide-react'
import ShareCard from './ShareCard'

interface FinalSummaryProps {
  movieTitle: string
  posterUrl: string | null
  finalDatetime: string
  participants: string[]
  isAdmin: boolean
  onReset: () => void
}

function formatIcsDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`
}

function formatDisplay(datetimeStr: string): { day: string; time: string } {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const d = new Date(datetimeStr)
  return {
    day: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  }
}

export default function FinalSummary({ movieTitle, posterUrl, finalDatetime, participants, isAdmin, onReset }: FinalSummaryProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const { day, time } = formatDisplay(finalDatetime)

  const handleDownloadIcs = () => {
    const start = new Date(finalDatetime)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DispoSéance//FR',
      'BEGIN:VEVENT',
      `DTSTART;TZID=Europe/Paris:${formatIcsDate(start)}`,
      `DTEND;TZID=Europe/Paris:${formatIcsDate(end)}`,
      `SUMMARY:Cinéma : ${movieTitle}`,
      'DESCRIPTION:Séance organisée via DispoSéance',
      'LOCATION:Au cinéma',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `disposeance-${movieTitle.replace(/\s+/g, '-').toLowerCase()}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `disposeance-${movieTitle.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${movieTitle} — DispoSéance`,
          })
          setShared(true)
          setTimeout(() => setShared(false), 2000)
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          a.click()
          URL.revokeObjectURL(url)
        }
        setSharing(false)
      }, 'image/png')
    } catch {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Visual card */}
      <div ref={cardRef}>
        <ShareCard
          movieTitle={movieTitle}
          posterUrl={posterUrl}
          day={day}
          time={time}
          participants={participants}
        />
      </div>

      {/* Actions */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white py-4 rounded-xl font-bold active:scale-[0.99] transition-all shadow-lg"
      >
        {shared ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        {sharing ? 'Préparation...' : shared ? 'Partagé !' : 'Partager la carte'}
      </button>

      <button
        onClick={handleDownloadIcs}
        className="w-full flex items-center justify-center gap-2.5 bg-white text-zinc-900 py-4 rounded-xl font-bold active:scale-[0.99] transition-transform shadow-lg"
      >
        <Calendar className="w-5 h-5" />
        Ajouter au calendrier
      </button>

      {isAdmin && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-zinc-500 border border-zinc-800 active:border-red-900/50 active:text-red-400 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Supprimer cette séance
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/robinperso/Documents/perso/disposeance
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/summary/FinalSummary.tsx
git commit -m "feat: unified share card with native share sheet export"
```

---

### Task 5: Fix CORS for TMDB images in html2canvas

**Files:**
- Modify: `next.config.js` (or `next.config.mjs`)

html2canvas with `useCORS: true` requires the image server to send CORS headers. TMDB images do support CORS, but Next.js Image optimization proxy may interfere. To avoid this, the ShareCard uses the raw TMDB URL directly (not via Next.js `<Image>`) when captured by html2canvas.

- [ ] **Step 1: Check next.config file name**

```bash
ls /Users/robinperso/Documents/perso/disposeance/next.config*
```

- [ ] **Step 2: Verify image domains already include TMDB**

Read the config file and confirm `image.tmdb.org` is in `remotePatterns` or `domains`. If missing, add it:

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
    ],
  },
}
module.exports = nextConfig
```

- [ ] **Step 3: If ShareCard images fail to render in html2canvas**

If the poster is blank in the exported image, update `ShareCard.tsx` to use a plain `<img>` tag instead of Next.js `<Image>` for the captured elements (html2canvas cannot proxy Next.js optimized images):

In `ShareCard.tsx`, replace the background blur `<Image>` and the poster thumbnail `<Image>` with plain `<img>`:

```tsx
{/* Background blur poster */}
{posterUrl && (
  <div className="absolute inset-0 overflow-hidden">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={posterUrl}
      alt=""
      className="w-full h-full object-cover opacity-10 blur-xl scale-110"
    />
  </div>
)}

{/* Poster thumbnail */}
<div className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-xl bg-zinc-800">
  {posterUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={posterUrl} alt={movieTitle} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <Film className="w-6 h-6 text-zinc-600" />
    </div>
  )}
</div>
```

- [ ] **Step 4: Commit if changes were needed**

```bash
git add src/components/summary/ShareCard.tsx next.config.*
git commit -m "fix: use plain img tags in ShareCard for html2canvas compatibility"
```
