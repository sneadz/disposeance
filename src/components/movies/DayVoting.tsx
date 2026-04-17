'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import * as Lucide from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { voteDayAction } from '@/app/actions/votes'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

interface DayVotingProps {
  movieId: string
  userId: string
  isAdmin: boolean
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

export default function DayVoting({ movieId, userId, isAdmin }: DayVotingProps) {
  const { Check, Users } = Lucide
  const [days, setDays] = useState<AvailableDay[]>([])
  const [loading, setLoading] = useState(true)
  const [voteError, setVoteError] = useState<string | null>(null)

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

    const formatted = (availableDays ?? []).map(ad => ({
      id: ad.id,
      date: ad.date,
      label: formatDate(ad.date),
      voterCount: (dayVotes ?? []).filter(v => v.date === ad.date).length,
      userVoted: (dayVotes ?? []).some(v => v.date === ad.date && v.user_id === userId),
    }))

    setDays(formatted)
    setLoading(false)
  }

  const toggleVote = async (date: string, hasVoted: boolean) => {
    const prevDays = days
    setDays(prev => prev.map(d =>
      d.date === date
        ? { ...d, userVoted: !hasVoted, voterCount: hasVoted ? d.voterCount - 1 : d.voterCount + 1 }
        : d
    ))
    setVoteError(null)
    try {
      const result = await voteDayAction(movieId, date, hasVoted)
      if (result?.error) { setDays(prevDays); setVoteError('Erreur lors du vote, réessaie.') }
    } catch {
      setDays(prevDays); setVoteError('Erreur lors du vote, réessaie.')
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold">Quel jour tu es dispo ?</h2>
        <p className="text-zinc-400 text-sm">Sélectionne tous les jours qui te conviennent</p>
      </div>

      {voteError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {voteError}
        </div>
      )}

      {days.length === 0 ? (
        <p className="text-center text-zinc-500 py-8 text-sm">Aucun jour disponible défini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {days.map(day => (
            <button
              key={day.date}
              onClick={() => toggleVote(day.date, day.userVoted)}
              className={cn(
                'flex items-center justify-between px-3.5 py-3.5 rounded-xl border transition-all active:scale-95 min-h-[52px]',
                day.userVoted
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300'
              )}
            >
              <span className="font-semibold text-sm">{day.label}</span>
              <div className="flex items-center gap-1.5">
                {day.userVoted
                  ? <Check className="w-4 h-4" />
                  : <span className="flex items-center gap-1 text-xs text-zinc-500"><Users className="w-3 h-3" />{day.voterCount}</span>
                }
                {day.userVoted && <span className="text-xs opacity-70">{day.voterCount}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={() => { window.location.href = `/movies/${movieId}/showtimes` }}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform"
          >
            Passer au vote des horaires →
          </button>
        </div>
      )}
    </div>
  )
}
