'use client'

import { useState } from 'react'
import { loginWithPseudoAction } from '@/app/auth/login/actions'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginForm() {
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await loginWithPseudoAction(pseudo, password)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div className="space-y-3">
        <div>
          <label htmlFor="pseudo" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Pseudo
          </label>
          <input
            id="pseudo"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            placeholder="ton pseudo"
            value={pseudo}
            onChange={e => setPseudo(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 p-1"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-transform disabled:opacity-50 mt-2"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
