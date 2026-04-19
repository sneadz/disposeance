'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Check, Users, Pencil, RotateCcw, Link } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { confirmTimeVotesAction } from '@/app/actions/votes'
import { resetMovieAction } from '@/app/actions/movie'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

interface TimeVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
  participantCount: number
  isParticipant: boolean
}

interface Showtime {
  id: string
  datetime: string
  timeLabel: string
  dateLabel: string
  voterCount: number
  userVoted: boolean
}

function formatShowtime(datetimeStr: string): { timeLabel: string; dateLabel: string } {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const d = new Date(datetimeStr)
  return {
    timeLabel: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
    dateLabel: `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
  }
}

export default function TimeVoting({ movieId, userId, isAdmin, participantCount, isParticipant }: TimeVotingProps) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    const text = `Vote pour les horaires ici 👉 ${window.location.href}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const [resetting, setResetting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchData()
    const ch1 = supabase.channel('showtimes_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showtimes', filter: `movie_id=eq.${movieId}` }, fetchData)
      .subscribe()
    const ch2 = supabase.channel('time_votes_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_votes' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
  }, [movieId])

  const fetchData = async () => {
    const [{ data: stData }, { data: vData }] = await Promise.all([
      supabase.from('showtimes').select('id, datetime').eq('movie_id', movieId).order('datetime'),
      supabase.from('time_votes').select('showtime_id, user_id').eq('available', true),
    ])

    const stIds = new Set((stData ?? []).map(st => st.id))
    const myVotedIds = new Set(
      (vData ?? []).filter(v => v.user_id === userId && stIds.has(v.showtime_id)).map(v => v.showtime_id)
    )
    const hasExistingVotes = myVotedIds.size > 0

    const formatted = (stData ?? []).map(st => {
      const votes = (vData ?? []).filter(v => v.showtime_id === st.id)
      return {
        id: st.id,
        datetime: st.datetime,
        ...formatShowtime(st.datetime),
        voterCount: votes.length,
        userVoted: votes.some(v => v.user_id === userId),
      }
    })

    setShowtimes(formatted)
    setPending(prev => {
      if (prev.size === 0 && hasExistingVotes) {
        setConfirmed(true)
        return myVotedIds
      }
      return prev
    })
    setLoading(false)
  }

  const togglePending = (id: string) => {
    setPending(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    const result = await confirmTimeVotesAction(movieId, Array.from(pending))
    if (result?.error) {
      setError('Erreur lors de la confirmation, réessaie.')
    } else {
      setConfirmed(true)
      setShowtimes(prev => prev.map(st => {
        const wasVoted = st.userVoted
        const isNowVoted = pending.has(st.id)
        return {
          ...st,
          userVoted: isNowVoted,
          voterCount: st.voterCount + (isNowVoted ? 1 : 0) - (wasVoted ? 1 : 0),
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
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-800 animate-pulse" />)}
    </div>
  )

  const displayShowtimes = showtimes.map(st => ({
    ...st,
    userVoted: confirmed ? st.userVoted : pending.has(st.id),
    voterCount: confirmed
      ? st.voterCount
      : st.voterCount - (st.userVoted ? 1 : 0) + (pending.has(st.id) ? 1 : 0),
  }))

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold">À quelle heure tu es dispo ?</h2>
        <p className="text-zinc-400 text-sm">
          {!isParticipant
            ? 'Résultats en cours — tu ne participes pas à ce vote.'
            : confirmed
              ? 'Tes disponibilités sont confirmées.'
              : 'Vote pour les horaires qui te conviennent'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      {(() => {
        const groups: { dateLabel: string; items: typeof displayShowtimes }[] = []
        for (const st of displayShowtimes) {
          const last = groups[groups.length - 1]
          if (last && last.dateLabel === st.dateLabel) last.items.push(st)
          else groups.push({ dateLabel: st.dateLabel, items: [st] })
        }
        const multiDay = groups.length > 1
        return (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.dateLabel} className="space-y-2">
                {multiDay && (
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
                    {group.dateLabel}
                  </p>
                )}
                {group.items.map(st => (
                  <button
                    key={st.id}
                    onClick={() => isParticipant && !confirmed && togglePending(st.id)}
                    disabled={!isParticipant || confirmed}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all min-h-[60px]',
                      st.userVoted
                        ? 'bg-[#FFC426] border-[#FFC426] text-[#0A0A0A] shadow-lg shadow-[#FFC426]/20'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300',
                      isParticipant && !confirmed && 'active:scale-[0.99] cursor-pointer',
                      (!isParticipant || confirmed) && 'cursor-default',
                    )}
                  >
                    <div className="text-left">
                      <p className="text-xl font-bold leading-none">{st.timeLabel}</p>
                      {!multiDay && <p className="text-xs mt-0.5 opacity-60">{st.dateLabel}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-semibold flex items-center gap-1', st.userVoted ? 'opacity-80' : 'text-zinc-400')}>
                        <Users className="w-3.5 h-3.5" />
                        {st.voterCount}/{participantCount}
                      </span>
                      {st.userVoted && <Check className="w-5 h-5" />}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )
      })()}

      {isParticipant && (confirmed ? (
        <button
          onClick={handleEdit}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[#E5E5E5] bg-[#222] border border-[#333] transition-colors text-sm"
        >
          <Pencil className="w-4 h-4" />
          Modifier mes votes
        </button>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={submitting || pending.size === 0}
          className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
        >
          {submitting ? 'Confirmation...' : `Confirmer mes disponibilités${pending.size > 0 ? ` (${pending.size})` : ''}`}
        </button>
      ))}

      {isAdmin && (
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[#E5E5E5] bg-[#222] border border-[#333] text-sm transition-colors"
          >
            <Link className="w-4 h-4" />
            {copied ? 'Copié !' : 'Copier le lien du vote'}
          </button>
          <button
            onClick={() => { window.location.href = `/movies/${movieId}/close` }}
            disabled={showtimes.every(st => st.voterCount === 0)}
            className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40 disabled:pointer-events-none"
          >
            Clôturer et confirmer →
          </button>
          {confirmingReset ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingReset(false)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-[#E5E5E5] bg-[#222] border border-[#333] text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => { setResetting(true); await resetMovieAction(movieId) }}
                disabled={resetting}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-red-600 border border-red-500 text-sm active:bg-red-700 transition-colors disabled:opacity-60"
              >
                {resetting ? 'Réinitialisation...' : 'Confirmer'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[#f87171] bg-[#2a0a0a] border border-[#5f1f1f] text-sm transition-colors"
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
