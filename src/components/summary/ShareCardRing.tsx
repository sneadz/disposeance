'use client'

// Variante "Anneau Unique" de la carte partageable — portée depuis Claude Design
// (DispoSeance Final.dc.html). Styles inline purs (capture html-to-image).
// Les boutons du design vivent dans FinalSummary : cette carte est le visuel capturé seul.

interface ShareCardRingProps {
  movieTitle: string
  posterUrl: string | null
  day: string
  time: string
  tag?: string | null
  participants: string[]
  guests: string[]
}

export default function ShareCardRing({ movieTitle, posterUrl, day, time, tag, participants, guests }: ShareCardRingProps) {
  const allCount = participants.length + guests.length

  return (
    <div
      id="share-card"
      style={{
        width: '340px',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        background: '#161109',
        borderRadius: '26px',
        boxShadow: '0 0 0 1.5px rgba(255,196,38,.5),0 30px 60px -20px rgba(0,0,0,.7),0 0 30px -6px rgba(255,196,38,.25)',
        WebkitFontSmoothing: 'antialiased',
        flexShrink: 0,
      }}
    >
      {/* Hero */}
      <div style={{ position: 'relative', height: '300px', background: '#33291a' }}>
        {posterUrl ? (
          <img src={posterUrl} alt="" style={{ position: 'absolute', inset: 0, width: '340px', height: '300px', objectFit: 'cover', objectPosition: 'center' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,#3a2e1a 0px,#3a2e1a 9px,#2c2314 9px,#2c2314 18px)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(22,17,9,.25) 0%,rgba(22,17,9,.55) 55%,#161109 100%)' }} />

        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#FFE8A3,#E8AC1F)', borderRadius: '2px' }} />
            <span style={{ fontFamily: "var(--font-cinzel), serif", fontWeight: 700, fontSize: '13px', color: '#f2ead9', letterSpacing: '.02em' }}>
              Dispo<span style={{ color: '#F0B93A' }}>Séance</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(155deg,#FFE8A3,#E8AC1F)', padding: '5px 10px 5px 6px', borderRadius: '999px', boxShadow: '0 3px 10px -2px rgba(255,196,38,.5)' }}>
            <span style={{ position: 'relative', width: '14px', height: '14px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#fff6de,#F0B93A 55%,#8a5610 100%)', display: 'grid', placeItems: 'center' }}>
              <span style={{ width: '5px', height: '5px', transform: 'rotate(45deg)', background: '#241a0c' }} />
            </span>
            <span style={{ font: "800 9.5px 'Archivo',sans-serif", letterSpacing: '.1em', textTransform: 'uppercase', color: '#1a1207' }}>Confirmé</span>
          </div>
        </div>

        <div style={{ position: 'absolute', left: '20px', right: '20px', bottom: '18px' }}>
          <span style={{ display: 'inline-block', width: '34px', height: '2px', background: 'linear-gradient(90deg,#FFE8A3,#E8AC1F)', marginBottom: '9px', borderRadius: '2px' }} />
          <p style={{ margin: '0 0 2px', font: "700 10.5px 'Archivo',sans-serif", letterSpacing: '.2em', textTransform: 'uppercase', color: '#d8b876' }}>Séance du Jeton</p>
          <h2 style={{ margin: 0, fontFamily: "var(--font-cinzel), serif", fontWeight: 800, fontSize: '29px', letterSpacing: '.02em', textTransform: 'uppercase', color: '#f8f0dc', lineHeight: 1.05, textShadow: '0 0 18px rgba(255,196,38,.3)' }}>
            {movieTitle}
          </h2>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,196,38,.15)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', font: "700 9.5px 'Archivo',sans-serif", letterSpacing: '.18em', textTransform: 'uppercase', color: '#a8813a' }}>On se retrouve</p>
            <p style={{ margin: 0, font: "700 16px 'Space Grotesk',sans-serif", color: '#f2ead9' }}>
              {day}
              {tag && (
                <span style={{ display: 'inline-block', marginLeft: '8px', font: "700 10px 'Archivo',sans-serif", letterSpacing: '.08em', textTransform: 'uppercase', color: '#F0B93A', background: 'rgba(255,196,38,.1)', border: '1px solid rgba(255,196,38,.35)', padding: '2px 7px', borderRadius: '6px', verticalAlign: 'middle' }}>
                  {tag}
                </span>
              )}
            </p>
          </div>
          <p style={{ margin: 0, fontFamily: "var(--font-cinzel), serif", fontWeight: 800, fontSize: '34px', lineHeight: 1, color: '#F0B93A', textShadow: '0 0 16px rgba(255,196,38,.35)', whiteSpace: 'nowrap' }}>{time}</p>
        </div>

        {allCount > 0 && (
          <div>
            <p style={{ margin: '0 0 9px', display: 'flex', alignItems: 'center', gap: '6px', font: "700 9.5px 'Archivo',sans-serif", letterSpacing: '.18em', textTransform: 'uppercase', color: '#a8813a' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 6a2 2 0 1 0 0-4M13 13c0-2-1.2-3.3-2.8-3.8M6.5 7A2.5 2.5 0 1 0 6.5 2a2.5 2.5 0 0 0 0 5Z" stroke="#a8813a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {allCount} Compagnon{allCount > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {participants.map((pseudo) => (
                <span key={pseudo} style={{ font: "700 12.5px 'Space Grotesk',sans-serif", color: '#F0B93A', background: 'rgba(255,196,38,.08)', border: '1px solid rgba(255,196,38,.35)', padding: '6px 14px', borderRadius: '999px' }}>{pseudo}</span>
              ))}
              {guests.map((name) => (
                <span key={name} style={{ font: "700 12.5px 'Space Grotesk',sans-serif", color: '#F0B93A', background: 'rgba(255,196,38,.08)', border: '1px dashed rgba(255,196,38,.35)', padding: '6px 14px', borderRadius: '999px' }}>{name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
