import LoginForm from '@/components/auth/LoginForm'
import { Film } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="bg-accent p-4 rounded-2xl shadow-xl shadow-accent/30">
          <Film className="w-8 h-8 text-accent-fg" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">DispoSéance</h1>
        <p className="text-zinc-500 text-sm">Organisez votre prochaine sortie ciné</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold mb-1 text-white">Connexion</h2>
        <p className="text-zinc-500 text-sm mb-6">Entre ton pseudo et ton mot de passe</p>
        <LoginForm />
      </div>
    </main>
  )
}
