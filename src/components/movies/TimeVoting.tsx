'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import * as Lucide from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { voteTimeAction } from '@/app/actions/votes'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

interface TimeVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
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
    timeLabel: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    dateLabel: `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
  }
}

export default function TimeVoting({ movieId, userId, isAdmin }: TimeVotingProps) {
  const { Check, Users } = Lucide
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(true)
  const [voteError, setVoteError] = useState<string | null>(null)

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
    setShowtimes((stData ?? []).map(st => {
      const votes = (vData ?? []).filter(v => v.showtime_id === st.id)
      return { id: st.id, datetime: st.datetime, ...formatShowtime(st.datetime), voterCount: votes.length, userVoted: votes.some(v => v.user_id === userId) }
    }))
    setLoading(false)
  }

  const toggleVote = async (showtimeId: string, hasVoted: boolean) => {
    const prev = showtimes
    setShowtimes(s => s.map(st =>
      st.id === showtimeId
        ? { ...st, userVoted: !hasVoted, voterCount: hasVoted ? st.voterCount - 1 : st.voterCount + 1 }
        : st
    ))
    setVoteError(null)
    try {
      const result = await voteTimeAction(movieId, showtimeId, hasVoted)
      if (result?.error) { setShowtimes(prev); setVoteError('Erreur lors du vote, réessaie.') }
    } catch {
      setShowtimes(prev); setVoteError('Erreur lors du vote, réessaie.')
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-800 animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold">À quelle heure tu es dispo ?</h2>
        <p className="text-zinc-400 text-sm">Vote pour les horaires qui te conviennent</p>
      </div>

      {voteError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {voteError}
        </div>
      )}

      <div className="space-y-2">
        {showtimes.map(st => (
          <button
            key={st.id}
            onClick={() => toggleVote(st.id, st.userVoted)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-[0.99] min-h-[60px]',
              st.userVoted
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            )}
          >
            <div className="text-left">
              <p className="text-xl font-bold leading-none">{st.timeLabel}</p>
              <p className="text-xs mt-0.5 opacity-60">{st.dateLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-semibold flex items-center gap-1', st.userVoted ? 'opacity-80' : 'text-zinc-400')}>
                <Users className="w-3.5 h-3.5" />
                {st.voterCount}
              </span>
              {st.userVoted && <Check className="w-5 h-5" />}
            </div>
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={() => { window.location.href = `/movies/${movieId}/close` }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-transform"
          >
            Clôturer et confirmer →
          </button>
        </div>
      )}
    </div>
  )
}
