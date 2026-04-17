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
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      } as any)
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
        className="w-full flex items-center justify-center gap-2.5 bg-violet-600 disabled:opacity-60 text-white py-4 rounded-xl font-bold active:scale-[0.99] transition-all shadow-lg"
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
