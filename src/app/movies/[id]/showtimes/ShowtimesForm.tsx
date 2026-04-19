'use client'

import { useState } from 'react'
import { setShowtimesAction } from './actions'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'

interface TiedDate { date: string; label: string; votes: number }

export default function ShowtimesForm({
  movieId,
  tiedDates,
}: {
  movieId: string
  tiedDates: TiedDate[]
}) {
  const allDates = tiedDates.map(d => d.date)

  // Jours sélectionnés par l'admin (tous cochés par défaut)
  const [selectedDays, setSelectedDays] = useState<string[]>(allDates)

  // Horaires par jour
  const [timesByDay, setTimesByDay] = useState<Record<string, string[]>>(
    () => Object.fromEntries(allDates.map(d => [d, ['20:00']]))
  )

  // Input heure en cours par jour
  const [newTimeByDay, setNewTimeByDay] = useState<Record<string, string>>(
    () => Object.fromEntries(allDates.map(d => [d, '']))
  )

  // Fallback date libre quand aucun vote (tiedDates vide)
  const [freeDate, setFreeDate] = useState('')
  const [freeTimes, setFreeTimes] = useState<string[]>(['20:00'])
  const [freeNewTime, setFreeNewTime] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const noVotes = tiedDates.length === 0
  const hasMultipleDays = tiedDates.length > 1

  const toggleDay = (date: string) => {
    setSelectedDays(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const addTime = (date: string) => {
    const t = newTimeByDay[date]
    if (!t || (timesByDay[date] ?? []).includes(t)) return
    setTimesByDay(prev => ({ ...prev, [date]: [...(prev[date] ?? []), t].sort() }))
    setNewTimeByDay(prev => ({ ...prev, [date]: '' }))
  }

  const removeTime = (date: string, time: string) => {
    setTimesByDay(prev => ({ ...prev, [date]: (prev[date] ?? []).filter(t => t !== time) }))
  }

  const handleSubmit = async () => {
    let datetimes: string[] = []

    if (noVotes) {
      if (!freeDate) { setError('Sélectionne une date'); return }
      if (freeTimes.length === 0) { setError('Ajoute au moins un horaire'); return }
      datetimes = freeTimes.map(t => `${freeDate}T${t}:00`)
    } else {
      if (selectedDays.length === 0) { setError('Sélectionne au moins un jour'); return }
      datetimes = selectedDays.flatMap(day => (timesByDay[day] ?? []).map(t => `${day}T${t}:00`))
      if (datetimes.length === 0) { setError('Ajoute au moins un horaire'); return }
    }

    setLoading(true)
    setError(null)
    const result = await setShowtimesAction(movieId, datetimes)
    if (result?.error) { setError(result.error); setLoading(false) }
    else window.location.href = `/movies/${movieId}`
  }

  // Cas sans votes : saisie libre avec date picker
  if (noVotes) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</p>
          <input
            type="date"
            value={freeDate}
            onChange={e => setFreeDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Horaires proposés</p>
          {freeTimes.map(t => (
            <div key={t} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#FFC426]" />
                <span className="text-lg font-bold">{t}</span>
              </div>
              <button onClick={() => setFreeTimes(p => p.filter(x => x !== t))} className="p-1.5 text-zinc-600 active:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="time"
              value={freeNewTime}
              onChange={e => setFreeNewTime(e.target.value)}
              className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors"
            />
            <button
              onClick={() => {
                if (!freeNewTime || freeTimes.includes(freeNewTime)) return
                setFreeTimes(p => [...p, freeNewTime].sort())
                setFreeNewTime('')
              }}
              className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-semibold active:bg-zinc-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">{error}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || !freeDate || freeTimes.length === 0}
          className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
        >
          {loading ? 'Enregistrement...' : 'Lancer le vote des horaires →'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Sélecteur de jours — uniquement si ex-æquo */}
      {hasMultipleDays && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jours à proposer</p>
          <div className="flex flex-wrap gap-2">
            {tiedDates.map(d => {
              const isSelected = selectedDays.includes(d.date)
              return (
                <button
                  key={d.date}
                  onClick={() => toggleDay(d.date)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#FFC426] border-[#FFC426] text-[#0A0A0A]'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Saisie des horaires par jour sélectionné */}
      {allDates
        .filter(date => selectedDays.includes(date))
        .map(date => {
          const d = tiedDates.find(td => td.date === date)!
          const times = timesByDay[date] ?? []
          return (
            <div key={date} className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                {hasMultipleDays && <Calendar className="w-3 h-3" />}
                {hasMultipleDays ? d.label : 'Horaires proposés'}
              </p>
              <div className="space-y-2">
                {times.map(t => (
                  <div key={t} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#FFC426]" />
                      <span className="text-lg font-bold">{t}</span>
                    </div>
                    <button
                      onClick={() => removeTime(date, t)}
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
                  value={newTimeByDay[date] ?? ''}
                  onChange={e => setNewTimeByDay(prev => ({ ...prev, [date]: e.target.value }))}
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors"
                />
                <button
                  onClick={() => addTime(date)}
                  className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-semibold active:bg-zinc-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )
        })}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selectedDays.length === 0}
        className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
      >
        {loading ? 'Enregistrement...' : 'Lancer le vote des horaires →'}
      </button>
    </div>
  )
}
