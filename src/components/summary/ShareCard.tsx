import { Film, Check, Calendar, Users } from 'lucide-react'

interface ShareCardProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  participants: string[]
  guests: string[]
}

export default function ShareCard({ movieTitle, posterUrl, day, time, participants, guests }: ShareCardProps) {
  const hasGuests = guests.length > 0
  const hasParticipants = participants.length > 0

  return (
    <div
      id="share-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#0A0A0A',
        boxShadow: '0 8px 24px rgba(255,196,38,0.15)',
        width: '100%',
      }}
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '4px', alignSelf: 'stretch', borderRadius: '9999px', backgroundColor: '#FFC426', minHeight: '40px', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '-0.025em', color: '#FFC426' }}>DispoSéance</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '9999px', backgroundColor: '#FFC426', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check style={{ width: '14px', height: '14px', color: '#0A0A0A' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFC426' }}>{'C\'est confirmé\u00a0!'}</span>
          </div>
        </div>

        {/* Movie info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '56px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#1A1A1A' }}>
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt={movieTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Film style={{ width: '24px', height: '24px', color: '#555' }} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>Film</p>
            <h2 style={{ margin: 0, fontWeight: 700, lineHeight: 1.2, color: '#fff', fontSize: movieTitle.length > 30 ? '16px' : '20px' }}>{movieTitle}</h2>
          </div>
        </div>

        {/* Date & time block */}
        <div style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Calendar style={{ width: '14px', height: '14px', flexShrink: 0, color: '#FFC426' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#888' }}>{day}</p>
          </div>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff' }}>{time}</p>
        </div>

        {/* Participants + guests */}
        {(hasParticipants || hasGuests) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Users style={{ width: '14px', height: '14px', flexShrink: 0, color: '#FFC426' }} />
              <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: '#555' }}>
                {participants.length === 1 ? '1 participant' : `${participants.length} participants`}
                {hasGuests && ` + ${guests.length} accompagnant${guests.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {participants.map((pseudo) => (
                <span
                  key={pseudo}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255,196,38,0.12)',
                    border: '1px solid rgba(255,196,38,0.25)',
                    color: '#FFC426',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                  }}
                >
                  {pseudo}
                </span>
              ))}
              {guests.map((name) => (
                <span
                  key={name}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'transparent',
                    border: '1px dashed #444',
                    color: '#888',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                  }}
                >
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
