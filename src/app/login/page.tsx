import LoginForm from '@/components/auth/LoginForm'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <Image src="/favicon.png" alt="DispoSéance" width={64} height={64} className="rounded-2xl shadow-accent-glow" />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface-fill shadow-card rounded-2xl p-6 shadow-2xl">
        <LoginForm />
      </div>
    </main>
  )
}
