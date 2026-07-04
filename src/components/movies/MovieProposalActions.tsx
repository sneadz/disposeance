'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Check, Share2, ChevronDown, ChevronUp } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb/api'

interface Props {
  title: string
  overview: string
  posterPath: string | null
  releaseYear: string
  trailerKey: string | null
}

export default function MovieProposalActions({ title, overview, posterPath, releaseYear, trailerKey }: Props) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    const lines = [`Qui chaud pour aller voir ${title} ? 🎬`]
    if (trailerKey) lines.push(`Bande-annonce : https://youtube.com/watch?v=${trailerKey}`)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!posterPath) return
    const posterUrl = getPosterUrl(posterPath, 'w500')!
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(posterUrl)}`
    const response = await fetch(proxyUrl)
    const blob = await response.blob()
    const file = new File([blob], `${title}.jpg`, { type: blob.type })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title })
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${title}.jpg`
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }

  return (
    <div className="space-y-5">
      {posterPath && (
        <div className="relative mx-auto w-48 h-72 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
          <Image
            src={getPosterUrl(posterPath, 'w500')!}
            alt={title}
            fill
            sizes="192px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-ink-muted text-sm mt-0.5">{releaseYear}</p>
      </div>

      {overview && (
        <div className="bg-surface-fill shadow-card rounded-2xl p-4">
          <p className={`text-sm text-ink leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {overview}
          </p>
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-xs text-ink-muted active:text-ink transition-colors"
          >
            {expanded
              ? <><ChevronUp className="w-3.5 h-3.5" /> Voir moins</>
              : <><ChevronDown className="w-3.5 h-3.5" /> Voir plus</>
            }
          </button>
        </div>
      )}

      {trailerKey && (
        <p className="text-center text-xs text-ink-muted">Bande-annonce disponible 🎬</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-white/[0.06] border border-border-subtle text-ink py-4 rounded-2xl font-semibold text-sm active:scale-[0.99] transition-all"
        >
          {copied
            ? <><Check className="w-4 h-4 text-success-fg" /> Copié ✓</>
            : <><Copy className="w-4 h-4" /> Copier le message</>
          }
        </button>
        {posterPath && (
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-accent-fill text-accent-fg py-4 rounded-2xl font-bold text-sm shadow-accent-glow active:scale-[0.99] transition-transform"
          >
            <Share2 className="w-4 h-4" />
            Partager l&apos;affiche
          </button>
        )}
      </div>
    </div>
  )
}
