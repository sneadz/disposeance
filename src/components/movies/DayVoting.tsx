'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Users, Pencil, RotateCcw } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { confirmDayVotesAction } from '@/app/actions/votes'
import { resetMovieAction } from '@/app/actions/movie'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

interface DayVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
  participantCount: number
  isParticipant: boolean
}

interface AvailableDay {
  id: string
  date: string
  label: string
  voterCount: number
  userVoted: boolean
}

function formatDate(dateStr: string): string {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const d = new Date(dateStr + 'T00:00:00')
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default function DayVoting({ movieId, userId, isAdmin, participantCount, isParticipant }: DayVotingProps) {
  const [days, setDays] = useState<AvailableDay[]>([])
  const [loading, setLoading] = useState(true)
  // Local pending selection (not yet confirmed)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('day_votes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_votes', filter: `movie_id=eq.${movieId}` }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [movieId])

  const fetchData = async () => {
    const [{ data: availableDays }, { data: dayVotes }] = await Promise.all([
      supabase.from('available_days').select('id, date').eq('movie_id', movieId).order('date'),
      supabase.from('day_votes').select('user_id, date').eq('movie_id', movieId).eq('available', true),
    ])

    const myVotedDates = new Set(
      (dayVotes ?? []).filter(v => v.user_id === userId).map(v => v.date)
    )
    const hasExistingVotes = myVotedDates.size > 0

    const formatted = (availableDays ?? []).map(ad => ({
      id: ad.id,
      date: ad.date,
      label: formatDate(ad.date),
      voterCount: (dayVotes ?? []).filter(v => v.date === ad.date).length,
      userVoted: myVotedDates.has(ad.date),
    }))

    setDays(formatted)
    // On first load, init pending from existing votes and mark as confirmed if they exist
    setPending(prev => {
      if (prev.size === 0 && hasExistingVotes) {
        setConfirmed(true)
        return myVotedDates
      }
      return prev
    })
    setLoading(false)
  }

  const togglePending = (date: string) => {
    setPending(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    const result = await confirmDayVotesAction(movieId, Array.from(pending))
    if (result?.error) {
      setError('Erreur lors de la confirmation, réessaie.')
    } else {
      setConfirmed(true)
      // Sync days immediately so confirmed view reflects the just-saved selection
      setDays(prev => prev.map(d => {
        const wasVoted = d.userVoted
        const isNowVoted = pending.has(d.date)
        return {
          ...d,
          userVoted: isNowVoted,
          voterCount: d.voterCount + (isNowVoted ? 1 : 0) - (wasVoted ? 1 : 0),
        }
      }))
    }
    setSubmitting(false)
  }

  const handleEdit = () => {
    setConfirmed(false)
    setError(null)
  }

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" />)}
    </div>
  )

  // Merge pending selection with server state for display
  const displayDays = days.map(d => ({
    ...d,
    userVoted: confirmed ? d.userVoted : pending.has(d.date),
    // In edit mode, voterCount excludes my own vote to avoid double-counting pending
    voterCount: confirmed
      ? d.voterCount
      : d.voterCount - (d.userVoted ? 1 : 0) + (pending.has(d.date) ? 1 : 0),
  }))

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold">Quel jour tu es dispo ?</h2>
        <p className="text-zinc-400 text-sm">
          {!isParticipant
            ? 'Résultats en cours — tu ne participes pas à ce vote.'
            : confirmed
              ? 'Tes disponibilités sont confirmées.'
              : 'Sélectionne tous les jours qui te conviennent'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      {days.length === 0 ? (
        <p className="text-center text-zinc-500 py-8 text-sm">Aucun jour disponible défini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {displayDays.map(day => (
            <button
              key={day.date}
              onClick={() => isParticipant && !confirmed && togglePending(day.date)}
              disabled={!isParticipant || confirmed}
              className={cn(
                'flex items-center justify-between px-3.5 py-3.5 rounded-xl border transition-all min-h-[52px]',
                day.userVoted
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300',
                isParticipant && !confirmed && 'active:scale-95 cursor-pointer',
                (!isParticipant || confirmed) && 'cursor-default',
              )}
            >
              <span className="font-semibold text-sm">{day.label}</span>
              <div className="flex items-center gap-1.5">
                {day.userVoted
                  ? <Check className="w-4 h-4" />
                  : <span className="flex items-center gap-1 text-xs text-zinc-500"><Users className="w-3 h-3" />{day.voterCount}/{participantCount}</span>
                }
                {day.userVoted && <span className="text-xs opacity-70">{day.voterCount}/{participantCount}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {isParticipant && (confirmed ? (
        <button
          onClick={handleEdit}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-zinc-400 border border-zinc-700 active:border-violet-500 active:text-violet-400 transition-colors text-sm"
        >
          <Pencil className="w-4 h-4" />
          Modifier mes votes
        </button>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={submitting || pending.size === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform disabled:opacity-40"
        >
          {submitting ? 'Confirmation...' : `Confirmer mes disponibilités${pending.size > 0 ? ` (${pending.size})` : ''}`}
        </button>
      ))}

      {isAdmin && (
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          <button
            onClick={() => { window.location.href = `/movies/${movieId}/showtimes` }}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform"
          >
            Passer au vote des horaires →
          </button>
          {confirmingReset ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingReset(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-zinc-400 border border-zinc-700 text-sm active:bg-zinc-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => { setResetting(true); await resetMovieAction(movieId) }}
                disabled={resetting}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 border border-red-500 text-sm active:bg-red-700 transition-colors disabled:opacity-60"
              >
                {resetting ? 'Réinitialisation...' : 'Confirmer'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-red-500 border border-red-900/40 text-sm active:bg-red-950/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Recommencer le vote
            </button>
          )}
        </div>
      )}
    </div>
  )
}
