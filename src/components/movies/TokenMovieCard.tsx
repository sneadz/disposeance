import Image from 'next/image'
import { Film } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb/api'
import Badge from '@/components/ui/Badge'
import DeleteMovieButton from './DeleteMovieButton'

// DA "Anneau Unique" (Claude Design) mais dimensions/espacements identiques à la carte de base.
// Le style (or, glow, filigrane) change ; le format (76px poster, m-2.5, px-3.5 py-3, Badge) reste.
export default function TokenMovieCard({
  movie,
  isAdmin,
  statusLabel,
  badgeStatus,
}: {
  movie: { id: string; title: string; poster_url: string | null }
  isAdmin: boolean
  statusLabel: string
  badgeStatus: 'pending' | 'closed' | 'wishlist'
}) {
  return (
    <div
      className="relative h-[104px] rounded-2xl2 overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        background: 'linear-gradient(160deg,#2b230f,#1d1a12)',
        boxShadow:
          '0 0 0 1.5px rgba(255,196,38,.55),0 0 22px -4px rgba(255,196,38,.4),inset 0 0 0 1px rgba(255,255,255,.05)',
      }}
    >
      {/* Filigrane anneau */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -28,
          top: 0,
          width: 130,
          height: 130,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 30%,#FFEBA8,#F0B93A 45%,#B9781A 82%,#8a5610 100%)',
          opacity: 0.14,
        }}
      >
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: 'absolute', inset: 0 }} fill="none">
          <circle cx="65" cy="65" r="57" stroke="#2a1c0a" strokeWidth="2" />
          <circle cx="65" cy="65" r="48" stroke="#2a1c0a" strokeWidth="1" strokeDasharray="2 5" />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 22,
            height: 22,
            transform: 'translate(-50%,-50%) rotate(45deg)',
            background: '#1d1a12',
          }}
        />
      </div>

      <a href={`/movies/${movie.id}`} className="absolute inset-0 flex items-stretch text-ink">
        <div
          className="relative w-[76px] flex-shrink-0 m-2.5 rounded-xl overflow-hidden"
          style={{ background: '#332913', boxShadow: '0 0 0 1px rgba(255,196,38,.4),0 6px 16px rgba(0,0,0,.4)' }}
        >
          {movie.poster_url ? (
            <Image src={getPosterUrl(movie.poster_url, 'w200')!} alt={movie.title} fill sizes="76px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6" style={{ color: '#c9a34a' }} />
            </div>
          )}
        </div>
        <div className="relative flex flex-col justify-center gap-1.5 px-3.5 py-3 flex-grow min-w-0">
          <Badge status={badgeStatus} className="self-start" style={{ fontFamily: 'var(--font-cinzel), serif' }}>{statusLabel}</Badge>
          <h3 className="font-bold text-base text-ink leading-snug line-clamp-2 pr-6" style={{ fontFamily: 'var(--font-cinzel), serif', textShadow: '0 0 14px rgba(255,196,38,.25)' }}>
            {movie.title}
          </h3>
          <p className="text-xs" style={{ fontFamily: 'var(--font-cinzel), serif', color: '#c9a860' }}>Voir les votes →</p>
        </div>
      </a>

      {isAdmin && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <DeleteMovieButton movieId={movie.id} movieTitle={movie.title} />
        </div>
      )}
    </div>
  )
}
