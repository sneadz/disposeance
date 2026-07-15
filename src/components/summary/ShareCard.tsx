'use client'

interface ShareCardProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  tag?: string | null
  participants: string[]
  guests: string[]
  isRing?: boolean
}

export default function ShareCard({ movieTitle, posterUrl, day, time, tag, participants, guests, isRing }: ShareCardProps) {
  const allCount = participants.length + guests.length

  return (
    <div
      id="share-card"
      style={{
        width: '360px',
        height: '640px',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        background: isRing ? 'linear-gradient(160deg,#221c0f,#191a1e 55%)' : '#191a1e',
        color: '#fff',
        borderRadius: '6px',
        fontFamily: "var(--font-archivo), sans-serif",
        WebkitFontSmoothing: 'antialiased',
        flexShrink: 0,
        boxShadow: isRing ? 'inset 0 0 0 1.5px rgba(255,196,38,.55), inset 0 0 60px -10px rgba(255,196,38,.25)' : undefined,
      }}
    >
      {/* Poster */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          style={{ position: 'absolute', top: 0, left: 0, width: '360px', height: '380px', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
        />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '380px', zIndex: 1,
        background: 'linear-gradient(180deg, rgba(10,10,11,.42) 0%, transparent 28%, transparent 58%, #191a1e 99%)',
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontFamily: "var(--font-archivo), sans-serif", fontWeight: 800, fontSize: '15px' }}>
          <div style={{ width: '4px', height: '17px', background: '#FFC426', borderRadius: '2px' }} />
          <span style={{ color: '#fff', fontWeight: 800 }}>Dispo<span style={{ color: '#FFC426' }}>Séance</span></span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#FFC426', color: '#1a1300',
          fontWeight: 800, fontSize: '11px', letterSpacing: '.04em', textTransform: 'uppercase' as const,
          padding: '6px 11px 6px 8px', borderRadius: '999px',
        }}>
          <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#1a1300', color: '#FFC426', display: 'grid', placeItems: 'center' }}>
            <svg viewBox="0 0 12 12" fill="none" style={{ width: '9px', height: '9px' }}>
              <path d="M2 6.2l2.6 2.6L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {isRing ? 'Anneau' : 'Confirmé'}
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '330px', zIndex: 10,
        padding: '0 24px 26px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: '46px', height: '3px', background: '#FFC426', borderRadius: '2px', marginBottom: '12px' }} />
        <span style={{ fontSize: '10.5px', letterSpacing: '.22em', textTransform: 'uppercase' as const, color: isRing ? '#c9a860' : '#8a8a90', fontWeight: 700 }}>
          {isRing ? "⌾ Séance de l'Anneau" : 'La séance'}
        </span>
        <h1 style={{
          fontFamily: "var(--font-anton), sans-serif", lineHeight: 0.93, textTransform: 'uppercase' as const,
          letterSpacing: '.005em', fontSize: '33px', margin: '8px 0 20px', color: '#fff',
        }}>
          {movieTitle}
        </h1>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end',
          borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: '18px',
        }}>
          <div style={{ minWidth: 0, fontSize: '17px', color: '#fff', fontWeight: 700 }}>
            <span style={{ display: 'block', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase' as const, color: '#FFC426', marginBottom: '5px', fontWeight: 700 }}>
              On se retrouve
            </span>
            {day}
            {tag && (
              <span style={{
                display: 'inline-block', marginLeft: '8px',
                fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                color: '#FFC426', background: 'rgba(255,196,38,.15)', border: '1px solid rgba(255,196,38,.3)',
                padding: '2px 7px', borderRadius: '6px', verticalAlign: 'middle',
              }}>
                {tag}
              </span>
            )}
          </div>
          <div style={{ whiteSpace: 'nowrap' as const, fontFamily: "var(--font-anton), sans-serif", fontSize: '50px', lineHeight: 0.78, color: '#FFC426', textAlign: 'right' as const }}>
            {time}
          </div>
        </div>
        {allCount > 0 && (
          <div style={{ marginTop: 'auto', paddingTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '14px', height: '14px', color: '#FFC426', flexShrink: 0 }}>
                <circle cx="5.5" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="11" cy="5.6" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M1.5 13c0-2.2 1.8-3.6 4-3.6s4 1.4 4 3.6M10.5 9.6c1.8.1 3.8 1.1 4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: '10.5px', letterSpacing: '.22em', textTransform: 'uppercase' as const, fontWeight: 700, color: '#8a8a90' }}>
                {allCount === 1 ? '1 participant' : `${allCount} participants`}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
              {participants.map((pseudo) => (
                <span key={pseudo} style={{
                  display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: '999px',
                  fontWeight: 700, fontSize: '13px', background: 'rgba(255,196,38,.13)', border: '1px solid rgba(255,196,38,.4)', color: '#FFC426',
                }}>
                  {pseudo}
                </span>
              ))}
              {guests.map((name) => (
                <span key={name} style={{
                  display: 'inline-flex', alignItems: 'center', padding: '7px 13px', borderRadius: '999px',
                  fontWeight: 700, fontSize: '13px', background: 'rgba(255,196,38,.13)', border: '1px dashed rgba(255,196,38,.4)', color: '#FFC426',
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
