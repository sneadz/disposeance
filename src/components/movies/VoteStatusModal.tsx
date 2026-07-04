'use client'

import { useState } from 'react'
import { X, Users } from 'lucide-react'
import { getVoteStatusAction, type ParticipantVoteStatus } from '@/app/actions/voteStatus'

interface VoteStatusModalProps {
  movieId: string
  phase: 'days' | 'times'
  votedCount: number
  totalCount: number
}

export default function VoteStatusModal({ movieId, phase, votedCount, totalCount }: VoteStatusModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState<ParticipantVoteStatus[]>([])

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    const result = await getVoteStatusAction(movieId, phase)
    setParticipants(result.participants)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-raised border border-zinc-700 text-zinc-400 text-xs font-semibold transition-colors active:bg-zinc-700"
      >
        <Users className="w-3 h-3" />
        {votedCount}/{totalCount} ont voté
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface border border-zinc-800 rounded-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Qui a voté ?</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 active:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-raised animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map(p => (
                  <div
                    key={p.pseudo}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                      p.voted
                        ? 'bg-success/10 border-success/20'
                        : 'bg-danger/10 border-danger/20'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.voted ? 'bg-success-indicator' : 'bg-danger-fg'}`} />
                    <span className={`font-semibold text-sm ${p.voted ? 'text-success-fg' : 'text-danger-fg'}`}>
                      {p.pseudo}
                    </span>
                    <span className={`ml-auto text-xs ${p.voted ? 'text-success' : 'text-danger'}`}>
                      {p.voted ? 'A voté' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
