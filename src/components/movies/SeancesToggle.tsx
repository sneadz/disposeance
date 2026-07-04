'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SeancesToggleProps {
  showAll: boolean
}

export default function SeancesToggle({ showAll }: SeancesToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (showAll) {
      params.delete('all')
    } else {
      params.set('all', 'true')
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <button
      onClick={toggle}
      className="mt-1 text-sm font-semibold bg-raised border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
    >
      {showAll ? 'Voir mes séances' : 'Voir toutes les séances'}
    </button>
  )
}
