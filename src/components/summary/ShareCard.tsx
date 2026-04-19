import { Film, Check, Calendar, Users } from 'lucide-react'

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
      className="relative overflow-hidden rounded-2xl"
      style={{
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#0A0A0A',
        boxShadow: '0 8px 24px rgba(255,196,38,0.15)',
      }}
    >
      {/* Content */}
      <div className="relative p-6 space-y-5">
        {/* Header: accent bar + branding + badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Accent bar */}
            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: '#FFC426', minHeight: '40px' }} />
            <div>
              <p className="text-sm font-bold tracking-tight" style={{ color: '#FFC426' }}>DispoSéance</p>
            </div>
          </div>
          {/* Confirmation badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFC426' }}>
              <Check className="w-3.5 h-3.5" style={{ color: '#0A0A0A' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#FFC426' }}>C'est confirmé !</span>
          </div>
        </div>

        {/* Movie info */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-xl" style={{ backgroundColor: '#1A1A1A' }}>
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt={movieTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-6 h-6" style={{ color: '#555' }} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#555' }}>Film</p>
            <h2 className={`font-bold leading-tight text-white ${movieTitle.length > 30 ? 'text-base' : 'text-xl'}`}>{movieTitle}</h2>
          </div>
        </div>

        {/* Date & time block */}
        <div className="rounded-xl px-5 py-4 space-y-1" style={{ backgroundColor: '#141414', border: '1px solid #222' }}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FFC426' }} />
            <p className="text-sm font-medium" style={{ color: '#888' }}>{day}</p>
          </div>
          <p className="text-4xl font-bold tracking-tight text-white">{time}</p>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Users className="w-3.5 h-3.5" style={{ color: '#FFC426' }} />
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#555' }}>
                {participants.length === 1 ? '1 participant' : `${participants.length} participants`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map((pseudo) => (
                <span
                  key={pseudo}
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(255,196,38,0.12)', border: '1px solid rgba(255,196,38,0.25)', color: '#FFC426' }}
                >
                  {pseudo}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
