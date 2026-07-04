import { Film, ChevronLeft, LogOut } from 'lucide-react'
import { logout } from '@/app/auth/logout/actions'

interface HeaderProps {
  pseudo: string
  backHref?: string
}

export default function Header({ pseudo, backHref }: HeaderProps) {
  const brand = (
    <div className="flex items-center gap-2.5">
      <div className="bg-accent-fill p-1.5 rounded-xl shadow-accent-glow">
        <Film className="w-4 h-4 text-accent-fg" />
      </div>
      <span className="font-label font-extrabold text-[15px] text-ink">
        Dispo<span className="text-accent">Séance</span>
      </span>
    </div>
  )

  return (
    <header className="sticky top-0 z-10 bg-base/85 backdrop-blur-md shadow-[inset_0_-1px_0_rgba(255,255,255,0.07)] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {backHref ? (
          <a href={backHref} className="flex items-center gap-2 text-ink-muted active:text-ink transition-colors">
            <ChevronLeft className="w-5 h-5" />
            {brand}
          </a>
        ) : (
          brand
        )}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-accent-fill flex items-center justify-center text-xs font-bold text-accent-fg">
            {pseudo[0]?.toUpperCase()}
          </div>
          <form action={logout}>
            <button className="p-1.5 text-ink-faint active:text-ink transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
