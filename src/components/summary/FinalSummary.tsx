'use client'

import { useRef, useState, useEffect } from 'react'
import { Calendar, Share2, Check, RotateCcw, Link } from 'lucide-react'
import ShareCard from './ShareCard'

interface FinalSummaryProps {
  movieTitle: string
  posterUrl: string | null
  finalDatetime: string
  participants: string[]
  guests: string[]
  isAdmin: boolean
  movieId: string
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
    day: `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
    time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
  }
}

async function toDataUrl(tmdbUrl: string): Promise<string> {
  const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(tmdbUrl)}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function FinalSummary({ movieTitle, posterUrl, finalDatetime, participants, guests, isAdmin, movieId, onReset }: FinalSummaryProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null)
  const { day, time } = formatDisplay(finalDatetime)

  // Pre-load poster as data URL at mount so html-to-image never needs to fetch it
  useEffect(() => {
    if (!posterUrl) return
    toDataUrl(posterUrl)
      .then(setPosterDataUrl)
      .catch(() => setPosterDataUrl(posterUrl)) // fallback to original URL
  }, [posterUrl])

  const posterReady = !posterUrl || posterDataUrl !== null

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/movies/${movieId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

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
      const { toPng } = await import('html-to-image')

      // Wait for all imgs to be fully decoded and painted
      const imgs = Array.from(cardRef.current.querySelectorAll<HTMLImageElement>('img'))
      await Promise.all(imgs.map((img) => {
        if (img.complete) return img.decode?.() ?? Promise.resolve()
        return new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve() })
      }))
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

      await document.fonts.ready
      const dataUrl = await toPng(cardRef.current, { width: 360, height: 640, pixelRatio: 3 })
      const blob = await (await fetch(dataUrl)).blob()
      const filename = `disposeance-${movieTitle.replace(/\s+/g, '-').toLowerCase()}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
      setSharing(false)
    } catch {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Visual card */}
      <div className="flex justify-center">
        <div ref={cardRef}>
          <ShareCard
            movieTitle={movieTitle}
            posterUrl={posterDataUrl ?? posterUrl}
            day={day}
            time={time}
            participants={participants}
            guests={guests}
          />
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={handleShare}
        disabled={sharing || !posterReady}
        className="w-full flex items-center justify-center gap-2.5 bg-[#FFC426] disabled:opacity-60 text-[#0A0A0A] py-4 rounded-xl font-bold active:scale-[0.99] transition-all shadow-lg shadow-[#FFC426]/20"
      >
        {shared ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        {sharing ? 'Préparation...' : shared ? 'Partagé !' : !posterReady ? 'Chargement...' : 'Partager la carte'}
      </button>

      <button
        onClick={handleDownloadIcs}
        className="w-full flex items-center justify-center gap-2.5 bg-white text-zinc-900 py-4 rounded-xl font-bold active:scale-[0.99] transition-transform shadow-lg"
      >
        <Calendar className="w-5 h-5" />
        Ajouter au calendrier
      </button>

      {isAdmin && (
        <>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2.5 bg-[#222] border border-[#333] text-[#E5E5E5] py-4 rounded-xl font-bold active:scale-[0.99] transition-all"
          >
            {linkCopied ? <Check className="w-5 h-5 text-[#FFC426]" /> : <Link className="w-5 h-5" />}
            <span className={linkCopied ? 'text-[#FFC426]' : ''}>
              {linkCopied ? 'Lien copié !' : 'Copier le lien de la séance'}
            </span>
          </button>

          <button
            onClick={() => onReset()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-[#f87171] bg-[#2a0a0a] border border-[#5f1f1f] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Supprimer cette séance
          </button>
        </>
      )}
    </div>
  )
}
