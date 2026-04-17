'use client'

import { useState } from 'react'
import { setShowtimesAction } from './actions'
import { Plus, Trash2, Clock } from 'lucide-react'

export default function ShowtimesForm({ movieId, winningDate }: { movieId: string; winningDate: string }) {
  const [times, setTimes] = useState<string[]>(['20:00'])
  const [newTime, setNewTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const addTime = () => {
    if (!newTime || times.includes(newTime)) return
    setTimes(prev => [...prev, newTime].sort())
    setNewTime('')
  }

  const handleSubmit = async () => {
    if (times.length === 0) { setError('Ajoutez au moins un horaire'); return }
    setLoading(true)
    setError(null)
    const datetimes = times.map(t => `${winningDate}T${t}:00`)
    const result = await setShowtimesAction(movieId, datetimes)
    if (result?.error) { setError(result.error); setLoading(false) }
    else window.location.href = `/movies/${movieId}`
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Horaires proposés</p>

      <div className="space-y-2">
        {times.map(t => (
          <div key={t} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-lg font-bold">{t}</span>
            </div>
            <button
              onClick={() => setTimes(p => p.filter(x => x !== t))}
              className="p-1.5 text-zinc-600 active:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="time"
          value={newTime}
          onChange={e => setNewTime(e.target.value)}
          className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
        />
        <button
          onClick={addTime}
          className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-semibold active:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || times.length === 0}
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform disabled:opacity-40"
      >
        {loading ? 'Enregistrement...' : 'Lancer le vote des horaires →'}
      </button>
    </div>
  )
}
