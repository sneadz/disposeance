'use client'

import { Trash2 } from 'lucide-react'
import { deleteMovieAction } from '@/app/actions/movie'
import { removeFromWishlistAction } from '@/app/wishlist/actions'

export default function DeleteMovieButton({ movieId, movieTitle, isWishlist = false }: { movieId: string; movieTitle: string; isWishlist?: boolean }) {
  const handleDelete = async () => {
    if (!confirm(`Supprimer "${movieTitle}" ?`)) return
    if (isWishlist) {
      await removeFromWishlistAction(movieId)
    } else {
      await deleteMovieAction(movieId)
    }
    window.location.reload()
  }

  return (
    <button
      onClick={handleDelete}
      className="w-7 h-7 flex items-center justify-center bg-base/70 text-ink-faint active:bg-danger-solid active:text-ink rounded-lg transition-colors backdrop-blur-sm"
      title="Supprimer"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
