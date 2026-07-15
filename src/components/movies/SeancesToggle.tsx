'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SeancesToggleProps {
  showAll: boolean
}

export default function SeancesToggle({ showAll }: SeancesToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const go = (all: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (all) {
      params.set('all', 'true')
    } else {
      params.delete('all')
    }
    router.push(`/?${params.toString()}`)
  }

  const seg = (active: boolean) =>
    `flex-1 md:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-accent-fill text-accent-fg shadow-accent-glow' : 'text-ink-muted'
    }`

  return (
    <div className="inline-flex w-full md:w-auto gap-1 p-1 rounded-xl bg-white/[0.04] border border-border-subtle">
      <button onClick={() => go(false)} className={seg(!showAll)} aria-pressed={!showAll}>
        Mes séances
      </button>
      <button onClick={() => go(true)} className={seg(showAll)} aria-pressed={showAll}>
        Toutes
      </button>
    </div>
  )
}
