'use client'

import { Trash2 } from 'lucide-react'
import { deleteMovieAction } from '@/app/actions/movie'

export default function DeleteMovieButton({ movieId, movieTitle }: { movieId: string; movieTitle: string }) {
  const handleDelete = async () => {
    if (!confirm(`Supprimer "${movieTitle}" ?`)) return
    await deleteMovieAction(movieId)
    window.location.reload()
  }

  return (
    <button
      onClick={handleDelete}
      className="w-7 h-7 flex items-center justify-center bg-zinc-950/70 text-zinc-400 active:bg-red-600 active:text-white rounded-lg transition-colors backdrop-blur-sm"
      title="Supprimer"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
