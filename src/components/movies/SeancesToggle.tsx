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
      className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
    >
      {showAll ? 'Mes séances' : 'Toutes'}
    </button>
  )
}
