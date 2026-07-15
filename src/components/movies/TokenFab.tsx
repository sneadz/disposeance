// ponytail: vidéo pré-rendue du jeton (pas de 3D runtime).
export default function TokenFab() {
  return (
    <a
      href="/movies/new?token=1"
      aria-label="Utiliser ton jeton"
      className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full overflow-hidden active:scale-95 transition-transform"
      style={{ boxShadow: '0 0 0 1.5px rgba(255,196,38,.55),0 8px 28px -6px rgba(255,196,38,.5)' }}
    >
      <video src="/token.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
    </a>
  )
}
