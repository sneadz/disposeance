'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, Plus, Calendar, Star, Check, ChevronLeft, ChevronRight, Film, Users, Zap } from 'lucide-react'
import { searchMoviesAction, getProfilesAction, createQuickCardAction } from './actions'
import type { TmdbMovie } from '@/lib/tmdb/api'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

function getWeekDays(weekOffset: number): { date: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7 + i)
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      label: `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    }
  })
}

function getWeekLabel(weekOffset: number): string {
  const start = new Date()
  start.setDate(start.getDate() + weekOffset * 7)
  const end = new Date()
  end.setDate(end.getDate() + weekOffset * 7 + 6)
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return `${fmt(start)} — ${fmt(end)}`
}

export default function NewMoviePage() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<TmdbMovie[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [profiles, setProfiles] = useState<{ id: string; pseudo: string }[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [guests, setGuests] = useState<string[]>([])
  const [guestInput, setGuestInput] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')
  const [submittingQuick, setSubmittingQuick] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)
  const dates = getWeekDays(weekOffset)

  useEffect(() => {
    const run = async () => {
      if (query.length < 3) { setMovies([]); return }
      setLoadingSearch(true)
      const { movies: results } = await searchMoviesAction(query)
      setMovies(results)
      setLoadingSearch(false)
    }
    const t = setTimeout(run, 500)
    return () => clearTimeout(t)
  }, [query])

  const goToStep3 = async () => {
    setStep(3)
    setLoadingProfiles(true)
    const { profiles: data } = await getProfilesAction()
    setProfiles(data)
    setLoadingProfiles(false)
  }

  const toggleDate = (date: string) =>
    setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date])

  const toggleParticipant = (id: string) =>
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const addGuest = () => {
    const name = guestInput.trim()
    if (!name || guests.includes(name)) return
    setGuests(prev => [...prev, name])
    setGuestInput('')
  }

  const removeGuest = (name: string) =>
    setGuests(prev => prev.filter(g => g !== name))

  const handleSubmit = async () => {
    if (!selectedMovie) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: selectedMovie,
          availableDates: selectedDates,
          participantIds: selectedParticipants,
          guests,
        }),
      })
      const result = await res.json()
      if (result?.error) { setError(result.error); setSubmitting(false) }
      else window.location.href = '/'
    } catch (e) {
      setError(String(e)); setSubmitting(false)
    }
  }

  const handleQuickCardSubmit = async () => {
    if (!selectedMovie || selectedDates.length !== 1 || !selectedTime) return
    setSubmittingQuick(true)
    setQuickError(null)
    const result = await createQuickCardAction(selectedMovie, selectedDates[0], selectedTime, selectedParticipants, guests)
    if (result.error) {
      setQuickError(result.error)
      setSubmittingQuick(false)
    } else {
      window.location.href = `/movies/${result.movieId}`
    }
  }

  /* ── Step 3 : participant selection ── */
  if (step === 3 && selectedMovie) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setStep(2)} className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-semibold">Qui participe ?</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
            {selectedMovie.poster_path && (
              <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="font-bold leading-tight">{selectedMovie.title}</p>
              <p className="text-zinc-500 text-sm">{selectedDates.length} jour{selectedDates.length > 1 ? 's' : ''} sélectionné{selectedDates.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Sélectionne les participants
            </p>

            {loadingProfiles ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map(p => {
                  const sel = selectedParticipants.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleParticipant(p.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-[0.99] min-h-[52px]',
                        sel
                          ? 'bg-[#FFC426] border-[#FFC426] text-[#0A0A0A] shadow-lg shadow-[#FFC426]/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      )}
                    >
                      <span className="font-semibold">{p.pseudo}</span>
                      {sel && <Check className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section accompagnants sans compte */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              + Sans compte (copines, famille…)
            </p>
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {guests.map(name => (
                  <button
                    key={name}
                    onClick={() => removeGuest(name)}
                    className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-semibold px-3 py-1.5 rounded-full active:opacity-70 transition-opacity"
                  >
                    {name}
                    <span className="text-zinc-500 text-xs">✕</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={guestInput}
                onChange={e => setGuestInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGuest() } }}
                placeholder="Ajouter un prénom…"
                className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors text-sm"
              />
              <button
                onClick={addGuest}
                className="bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl font-semibold text-sm active:bg-zinc-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || selectedParticipants.length === 0}
            className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            {submitting ? 'Création...' : `Lancer le vote — ${selectedParticipants.length} participant${selectedParticipants.length > 1 ? 's' : ''}`}
          </button>

          {selectedDates.length === 1 && (
            <button
              onClick={() => setStep(4)}
              disabled={selectedParticipants.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200 py-4 rounded-xl font-semibold active:scale-[0.99] transition-all disabled:opacity-40"
            >
              <Zap className="w-4 h-4 text-[#FFC426]" />
              Faire une carte rapide
            </button>
          )}
        </div>
      </main>
    )
  }

  /* ── Step 4 : quick card — choix horaire ── */
  if (step === 4 && selectedMovie && selectedDates.length === 1) {
    const dateLabel = (() => {
      const d = new Date(selectedDates[0] + 'T12:00:00')
      return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
    })()

    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setStep(3)} className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-semibold">Carte rapide</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {/* Récap film + date */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
            {selectedMovie.poster_path && (
              <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="font-bold leading-tight">{selectedMovie.title}</p>
              <p className="text-zinc-500 text-sm">{dateLabel} · {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Saisie horaire */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Horaire de la séance</p>
            <input
              type="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white text-lg font-semibold focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] transition-colors"
            />
          </div>

          {quickError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
              {quickError}
            </div>
          )}

          <button
            onClick={handleQuickCardSubmit}
            disabled={submittingQuick || !selectedTime}
            className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            {submittingQuick ? 'Création...' : 'Créer la carte'}
          </button>
        </div>
      </main>
    )
  }

  /* ── Step 2 : date picker ── */
  if (step === 2 && selectedMovie) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setStep(1)} className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-semibold">Choisir les jours</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
            {selectedMovie.poster_path && (
              <div className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`} alt={selectedMovie.title} fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div>
              <p className="font-bold leading-tight">{selectedMovie.title}</p>
              <p className="text-zinc-500 text-sm">{selectedMovie.release_date?.split('-')[0]}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quels jours sont possibles ?</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className="p-1.5 rounded-lg text-zinc-400 disabled:opacity-30 active:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-400 min-w-[110px] text-center">{getWeekLabel(weekOffset)}</span>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="p-1.5 rounded-lg text-zinc-400 active:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {dates.map(({ date, label }) => {
                const sel = selectedDates.includes(date)
                return (
                  <button
                    key={date}
                    onClick={() => toggleDate(date)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-95 min-h-[52px]',
                      sel
                        ? 'bg-[#FFC426] border-[#FFC426] text-[#0A0A0A] shadow-lg shadow-[#FFC426]/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    )}
                  >
                    <span className="font-semibold text-sm">{label}</span>
                    {sel && <Check className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            onClick={goToStep3}
            disabled={selectedDates.length === 0}
            className="w-full bg-[#FFC426] text-[#0A0A0A] py-4 rounded-xl font-bold text-base shadow-lg shadow-[#FFC426]/20 active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            {`Suivant — ${selectedDates.length} jour${selectedDates.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </main>
    )
  }

  /* ── Step 1 : movie search ── */
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="p-1.5 text-zinc-400 active:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </a>
            <span className="text-base font-semibold">Nouvelle séance</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un film..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-11 pr-4 text-base focus:outline-none focus:border-[#FFC426] focus:ring-1 focus:ring-[#FFC426] placeholder-zinc-500 transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loadingSearch && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />)}
          </div>
        )}

        {!loadingSearch && query.length >= 3 && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Film className="w-10 h-10 text-zinc-700" />
            <p className="text-zinc-500 text-sm">Aucun film trouvé pour &quot;{query}&quot;</p>
          </div>
        )}

        <div className="space-y-2">
          {movies.map(movie => (
            <button
              key={movie.id}
              onClick={() => { setSelectedMovie(movie); setStep(2) }}
              className="w-full flex items-stretch bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden active:scale-[0.99] transition-transform text-left"
            >
              <div className="relative w-16 h-24 flex-shrink-0 bg-zinc-800">
                {movie.poster_path ? (
                  <Image src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="p-3.5 flex flex-col justify-between flex-grow min-w-0">
                <div>
                  <h3 className="font-bold leading-snug line-clamp-1">{movie.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {movie.release_date?.split('-')[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      {movie.vote_average?.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{movie.overview}</p>
                </div>
              </div>
              <div className="flex items-center pr-3.5">
                <div className="w-7 h-7 rounded-full bg-[#FFC426]/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-[#FFC426]" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
