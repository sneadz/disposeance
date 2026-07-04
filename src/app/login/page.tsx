import LoginForm from '@/components/auth/LoginForm'
import { Film } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="bg-accent-fill p-4 rounded-2xl shadow-accent-glow">
          <Film className="w-8 h-8 text-accent-fg" />
        </div>
        <h1 className="font-display text-3xl uppercase leading-none tracking-wide text-ink">DispoSéance</h1>
        <p className="text-ink-muted text-sm">Organisez votre prochaine sortie ciné</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface-fill shadow-card rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold mb-1 text-ink">Connexion</h2>
        <p className="text-ink-muted text-sm mb-6">Entre ton pseudo et ton mot de passe</p>
        <LoginForm />
      </div>
    </main>
  )
}
