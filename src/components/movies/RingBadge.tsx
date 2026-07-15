// Marqueur "Séance du Jeton" — même pastille or que la carte (DA Claude Design).
export default function RingBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        font: "700 9.5px 'Archivo',sans-serif",
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: '#FFC426',
        background: 'rgba(255,196,38,.15)',
        border: '1px solid rgba(255,196,38,.3)',
        padding: '3px 9px',
        borderRadius: 999,
      }}
    >
      ⌾ Séance du Jeton
    </span>
  )
}
