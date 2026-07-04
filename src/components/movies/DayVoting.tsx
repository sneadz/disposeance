'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Users, Pencil, RotateCcw, Link } from 'lucide-react'
import VoteStatusModal from './VoteStatusModal'
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
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const text = `Vote pour les jours ici 👉 ${window.location.href}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const [resetting, setResetting] = useState(false)
  const [distinctVoterCount, setDistinctVoterCount] = useState(0)

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

    setDistinctVoterCount(new Set((dayVotes ?? []).map(v => v.user_id)).size)
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
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-surface animate-pulse" />)}
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
        <p className="text-ink-muted text-sm">
          {!isParticipant
            ? 'Résultats en cours — tu ne participes pas à ce vote.'
            : confirmed
              ? 'Tes disponibilités sont confirmées.'
              : 'Sélectionne tous les jours qui te conviennent'}
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      {days.length === 0 ? (
        <p className="text-center text-ink-faint py-8 text-sm">Aucun jour disponible défini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {displayDays.map(day => (
            <button
              key={day.date}
              onClick={() => isParticipant && !confirmed && togglePending(day.date)}
              disabled={!isParticipant || confirmed}
              className={cn(
                'flex items-center justify-between px-3.5 py-3.5 rounded-2xl transition-all min-h-[52px]',
                day.userVoted
                  ? 'bg-accent-fill text-accent-fg shadow-accent-glow'
                  : 'bg-surface-fill shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] text-ink-muted',
                isParticipant && !confirmed && 'active:scale-95 cursor-pointer',
                (!isParticipant || confirmed) && 'cursor-default',
              )}
            >
              <span className="font-bold text-sm">{day.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold flex items-center gap-1', day.userVoted ? 'opacity-70' : 'text-ink-faint')}>
                  <Users className="w-3 h-3" />
                  {day.voterCount}/{participantCount}
                </span>
                {day.userVoted && (
                  <span className="w-[18px] h-[18px] rounded-full bg-black/15 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isParticipant && (confirmed ? (
        <button
          onClick={handleEdit}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-ink bg-white/[0.06] border border-border-subtle transition-colors text-sm"
        >
          <Pencil className="w-4 h-4" />
          Modifier mes votes
        </button>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={submitting || pending.size === 0}
          className="w-full bg-accent-fill text-accent-fg py-4 rounded-2xl font-bold text-base shadow-accent-glow-lg active:scale-[0.99] transition-transform disabled:opacity-40"
        >
          {submitting ? 'Confirmation...' : `Confirmer mes disponibilités${pending.size > 0 ? ` (${pending.size})` : ''}`}
        </button>
      ))}

      {isAdmin && (
        <div className="pt-3 border-t border-border-subtle space-y-2.5">
          <div className="flex justify-end">
            <VoteStatusModal
              movieId={movieId}
              phase="days"
              votedCount={distinctVoterCount}
              totalCount={participantCount}
            />
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-ink bg-white/[0.06] border border-border-subtle text-sm transition-colors"
          >
            <Link className="w-4 h-4" />
            {copied ? 'Copié !' : 'Copier le lien du vote'}
          </button>
          <button
            onClick={() => { window.location.href = `/movies/${movieId}/showtimes` }}
            disabled={days.every(d => d.voterCount === 0)}
            className="w-full bg-accent-fill text-accent-fg py-4 rounded-2xl font-bold text-base shadow-accent-glow-lg active:scale-[0.99] transition-transform disabled:opacity-40 disabled:pointer-events-none"
          >
            Passer au vote des horaires →
          </button>
          {confirmingReset ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingReset(false)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-ink bg-white/[0.06] border border-border-subtle text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => { setResetting(true); await resetMovieAction(movieId) }}
                disabled={resetting}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-white bg-danger border border-danger/70 text-sm active:brightness-90 transition-colors disabled:opacity-60"
              >
                {resetting ? 'Réinitialisation...' : 'Confirmer'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-danger bg-danger/10 border border-danger/30 text-sm transition-colors"
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
