import { Film } from 'lucide-react'

interface ShareCardProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  participants: string[]
}

export default function ShareCard({ movieTitle, posterUrl, day, time, participants }: ShareCardProps) {
  return (
    <div
      id="share-card"
      className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Background blur poster */}
      {posterUrl && (
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt=""
            className="w-full h-full object-cover opacity-10 blur-xl scale-110"
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-zinc-950/90 to-zinc-950" />

      {/* Content */}
      <div className="relative p-6 space-y-5">
        {/* Header: poster + title */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-xl bg-zinc-800">
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt={movieTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-6 h-6 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">Séance confirmée</p>
            <h2 className="font-bold text-xl leading-tight line-clamp-3">{movieTitle}</h2>
          </div>
        </div>

        {/* Date & time */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 space-y-0.5">
          <p className="text-zinc-400 text-sm font-medium">{day}</p>
          <p className="text-4xl font-bold text-violet-400 tracking-tight">{time}</p>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2.5">
              {participants.length === 1 ? '1 participant' : `${participants.length} participants`}
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((pseudo) => (
                <span
                  key={pseudo}
                  className="bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-semibold px-3 py-1 rounded-full"
                >
                  {pseudo}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Branding */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1 rounded-lg">
            <Film className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-zinc-500">DispoSéance</span>
        </div>
      </div>
    </div>
  )
}
