'use client'

import { useState } from 'react'
import { closeMovieAction } from './actions'
import { Clock, Check, Trophy, Users } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

interface Showtime { id: string; label: string; voteCount: number }

export default function CloseMovieForm({ movieId, showtimes, participantCount }: { movieId: string; showtimes: Showtime[]; participantCount: number }) {
  const sorted = [...showtimes].sort((a, b) => b.voteCount - a.voteCount)
  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const maxVotes = Math.max(...showtimes.map(s => s.voteCount), 0)

  const handleClose = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    const result = await closeMovieAction(movieId, selectedId)
    if (result?.error) { setError(result.error); setLoading(false) }
    else window.location.href = `/movies/${movieId}`
  }

  return (
    <div className="space-y-4">
      <div className="space-y-0.5 mb-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sélectionne l&apos;horaire final</p>
        <p className="text-sm text-zinc-500">L&apos;horaire avec le plus de votes est pré-sélectionné</p>
      </div>

      <div className="space-y-2">
        {sorted.map(st => {
          const isWinner = st.voteCount === maxVotes && maxVotes > 0
          const isSelected = selectedId === st.id
          return (
            <button
              key={st.id}
              onClick={() => setSelectedId(st.id)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.99] min-h-[60px]',
                isSelected
                  ? 'bg-[#FFC426] border-[#FFC426] text-[#0A0A0A] shadow-lg shadow-[#FFC426]/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              )}
            >
              <div className="flex items-center gap-3">
                {isWinner && <Trophy className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'text-[#0A0A0A] opacity-70' : 'text-amber-400')} />}
                <Clock className={cn('w-4 h-4 flex-shrink-0', isSelected ? 'opacity-70' : 'opacity-40')} />
                <span className="font-bold text-left">{st.label}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className={cn('text-sm font-semibold flex items-center gap-1', isSelected ? 'opacity-80' : 'text-zinc-500')}>
                  <Users className="w-3.5 h-3.5" />
                  {st.voteCount}/{participantCount}
                </span>
                {isSelected && <Check className="w-5 h-5" />}
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        onClick={handleClose}
        disabled={loading || !selectedId}
        className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40 mt-2"
      >
        {loading ? 'Confirmation...' : '🎬 Confirmer cette séance'}
      </button>
    </div>
  )
}
