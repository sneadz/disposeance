'use client'

import { useState } from 'react'
import { setShowtimesAction } from './actions'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'

interface TiedDate { date: string; label: string; votes: number }

const TAGS = ['IMAX', '4DX', '+'] as const

export default function ShowtimesForm({
  movieId,
  tiedDates,
}: {
  movieId: string
  tiedDates: TiedDate[]
}) {
  const allDates = tiedDates.map(d => d.date)

  const [selectedDays, setSelectedDays] = useState<string[]>(allDates)

  const [timesByDay, setTimesByDay] = useState<Record<string, string[]>>(
    () => Object.fromEntries(allDates.map(d => [d, ['20:00']]))
  )

  const [newTimeByDay, setNewTimeByDay] = useState<Record<string, string>>(
    () => Object.fromEntries(allDates.map(d => [d, '']))
  )

  const [tagsByDay, setTagsByDay] = useState<Record<string, Record<string, string | null>>>(
    () => Object.fromEntries(allDates.map(d => [d, { '20:00': null }]))
  )

  const [freeDate, setFreeDate] = useState('')
  const [freeTimes, setFreeTimes] = useState<string[]>(['20:00'])
  const [freeNewTime, setFreeNewTime] = useState('')
  const [freeTagByTime, setFreeTagByTime] = useState<Record<string, string | null>>({ '20:00': null })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const noVotes = tiedDates.length === 0
  const hasMultipleDays = tiedDates.length > 1

  const toggleDay = (date: string) => {
    setSelectedDays(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const toggleTag = (date: string, time: string, tag: string) => {
    setTagsByDay(prev => ({
      ...prev,
      [date]: { ...(prev[date] ?? {}), [time]: prev[date]?.[time] === tag ? null : tag },
    }))
  }

  const toggleFreeTag = (time: string, tag: string) => {
    setFreeTagByTime(prev => ({ ...prev, [time]: prev[time] === tag ? null : tag }))
  }

  const addTime = (date: string) => {
    const t = newTimeByDay[date]
    if (!t || (timesByDay[date] ?? []).includes(t)) return
    setTimesByDay(prev => ({ ...prev, [date]: [...(prev[date] ?? []), t].sort() }))
    setTagsByDay(prev => ({ ...prev, [date]: { ...(prev[date] ?? {}), [t]: null } }))
    setNewTimeByDay(prev => ({ ...prev, [date]: '' }))
  }

  const removeTime = (date: string, time: string) => {
    setTimesByDay(prev => ({ ...prev, [date]: (prev[date] ?? []).filter(t => t !== time) }))
    setTagsByDay(prev => {
      const updated = { ...(prev[date] ?? {}) }
      delete updated[time]
      return { ...prev, [date]: updated }
    })
  }

  const handleSubmit = async () => {
    let entries: { datetime: string; tag?: string | null }[] = []

    if (noVotes) {
      if (!freeDate) { setError('Sélectionne une date'); return }
      if (freeTimes.length === 0) { setError('Ajoute au moins un horaire'); return }
      entries = freeTimes.map(t => ({ datetime: `${freeDate}T${t}:00`, tag: freeTagByTime[t] ?? null }))
    } else {
      if (selectedDays.length === 0) { setError('Sélectionne au moins un jour'); return }
      entries = selectedDays.flatMap(day =>
        (timesByDay[day] ?? []).map(t => ({ datetime: `${day}T${t}:00`, tag: tagsByDay[day]?.[t] ?? null }))
      )
      if (entries.length === 0) { setError('Ajoute au moins un horaire'); return }
    }

    setLoading(true)
    setError(null)
    const result = await setShowtimesAction(movieId, entries)
    if (result?.error) { setError(result.error); setLoading(false) }
    else window.location.href = `/movies/${movieId}`
  }

  if (noVotes) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</p>
          <input
            type="date"
            value={freeDate}
            onChange={e => setFreeDate(e.target.value)}
            className="w-full bg-surface-fill shadow-card rounded-2xl px-4 py-3 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Horaires proposés</p>
          {freeTimes.map(t => (
            <div key={t} className="flex items-center justify-between bg-surface-fill shadow-card rounded-2xl px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-lg font-bold">{t}</span>
                <div className="flex items-center gap-1">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFreeTag(t, tag)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide transition-colors ${
                        freeTagByTime[t] === tag
                          ? 'bg-accent-fill text-accent-fg'
                          : 'bg-raised text-ink-faint border border-border-subtle'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setFreeTimes(p => p.filter(x => x !== t))
                  setFreeTagByTime(prev => { const u = { ...prev }; delete u[t]; return u })
                }}
                className="p-1.5 text-ink-faint active:text-danger transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="time"
              value={freeNewTime}
              onChange={e => setFreeNewTime(e.target.value)}
              className="flex-grow bg-surface-fill shadow-card rounded-2xl px-4 py-3 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            <button
              onClick={() => {
                if (!freeNewTime || freeTimes.includes(freeNewTime)) return
                setFreeTimes(p => [...p, freeNewTime].sort())
                setFreeTagByTime(p => ({ ...p, [freeNewTime]: null }))
                setFreeNewTime('')
              }}
              className="flex items-center gap-2 bg-white/[0.06] border border-border-subtle text-ink px-4 py-3 rounded-2xl font-semibold active:bg-white/[0.1] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-sm text-center rounded-2xl p-3">{error}</div>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || !freeDate || freeTimes.length === 0}
          className="w-full bg-accent-fill text-accent-fg py-4 rounded-2xl font-bold text-base shadow-accent-glow active:scale-[0.99] transition-transform disabled:opacity-40"
        >
          {loading ? 'Enregistrement...' : 'Lancer le vote des horaires →'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {hasMultipleDays && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Jours à proposer</p>
          <div className="flex flex-wrap gap-2">
            {tiedDates.map(d => {
              const isSelected = selectedDays.includes(d.date)
              return (
                <button
                  key={d.date}
                  onClick={() => toggleDay(d.date)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-accent-fill shadow-accent-glow text-accent-fg'
                      : 'bg-surface-fill shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] text-ink-muted'
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

      {allDates
        .filter(date => selectedDays.includes(date))
        .map(date => {
          const d = tiedDates.find(td => td.date === date)!
          const times = timesByDay[date] ?? []
          return (
            <div key={date} className="space-y-2">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                {hasMultipleDays && <Calendar className="w-3 h-3" />}
                {hasMultipleDays ? d.label : 'Horaires proposés'}
              </p>
              <div className="space-y-2">
                {times.map(t => (
                  <div key={t} className="flex items-center justify-between bg-surface-fill shadow-card rounded-2xl px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-lg font-bold">{t}</span>
                      <div className="flex items-center gap-1">
                        {TAGS.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(date, t, tag)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide transition-colors ${
                              tagsByDay[date]?.[t] === tag
                                ? 'bg-accent-fill text-accent-fg'
                                : 'bg-raised text-ink-faint border border-border-subtle'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTime(date, t)}
                      className="p-1.5 text-ink-faint active:text-danger transition-colors"
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
                  className="flex-grow bg-surface-fill shadow-card rounded-2xl px-4 py-3 text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  onClick={() => addTime(date)}
                  className="flex items-center gap-2 bg-white/[0.06] border border-border-subtle text-ink px-4 py-3 rounded-2xl font-semibold active:bg-white/[0.1] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )
        })}

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm text-center rounded-2xl p-3">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selectedDays.length === 0}
        className="w-full bg-accent-fill text-accent-fg py-4 rounded-2xl font-bold text-base shadow-accent-glow active:scale-[0.99] transition-transform disabled:opacity-40"
      >
        {loading ? 'Enregistrement...' : 'Lancer le vote des horaires →'}
      </button>
    </div>
  )
}
