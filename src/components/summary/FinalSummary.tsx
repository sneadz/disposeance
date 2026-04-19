'use client'

import { useRef, useState } from 'react'
import { Calendar, Share2, Check, RotateCcw, Link } from 'lucide-react'
import ShareCard from './ShareCard'

interface FinalSummaryProps {
  movieTitle: string
  posterUrl: string | null
  finalDatetime: string
  participants: string[]
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
    day: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  }
}

export default function FinalSummary({ movieTitle, posterUrl, finalDatetime, participants, isAdmin, movieId, onReset }: FinalSummaryProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { day, time } = formatDisplay(finalDatetime)

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
      const html2canvas = (await import('html2canvas')).default

      // Swap TMDB image sources to proxied URLs before capture
      const images = cardRef.current.querySelectorAll<HTMLImageElement>('img')
      const originals = new Map<HTMLImageElement, string>()
      images.forEach((img) => {
        const src = img.src
        if (src.includes('image.tmdb.org')) {
          originals.set(img, src)
          img.src = `/api/image-proxy?url=${encodeURIComponent(src)}`
        }
      })
      // Wait for images to reload
      await Promise.all(
        Array.from(originals.keys()).map(
          (img) => new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
        )
      )

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      } as any)

      // Restore original sources
      originals.forEach((src, img) => { img.src = src })
      canvas.toBlob(async (blob) => {
        if (!blob) { setSharing(false); return }
        const filename = `disposeance-${movieTitle.replace(/\s+/g, '-').toLowerCase()}.png`
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${movieTitle} — DispoSéance` })
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
        className="w-full flex items-center justify-center gap-2.5 bg-[#FFC426] disabled:opacity-60 text-[#0A0A0A] py-4 rounded-xl font-bold active:scale-[0.99] transition-all shadow-lg shadow-[#FFC426]/20"
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
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-zinc-500 border border-zinc-800 active:border-red-900/50 active:text-red-400 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Supprimer cette séance
          </button>
        </>
      )}
    </div>
  )
}
