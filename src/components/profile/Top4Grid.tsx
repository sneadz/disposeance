'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FilmSearchModal from './FilmSearchModal'
import { addTopFilmAction, removeTopFilmAction, reorderTopFilmsAction } from '@/app/actions/profile'
import type { TmdbMovie } from '@/lib/tmdb/api'
import { getPosterUrl } from '@/lib/tmdb/api'

export interface TopFilm {
  id: string
  position: number
  tmdb_id: string
  title: string
  poster_url: string
}

function SortableSlot({
  film,
  editable,
  onRemove,
  onAdd,
  position,
}: {
  film: TopFilm | null
  editable: boolean
  onRemove: (position: number) => void
  onAdd: (position: number) => void
  position: number
}) {
  const id = film?.id ?? `empty-${position}`
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !film || !editable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-1 aspect-[2/3] relative rounded-xl overflow-hidden bg-surface-fill shadow-card"
    >
      {film ? (
        <>
          <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <Image
              src={getPosterUrl(film.poster_url, 'w200') ?? '/default-avatar.png'}
              alt={film.title}
              fill
              sizes="25vw"
              className="object-cover"
            />
          </div>
          {editable && (
            <button
              onClick={() => onRemove(film.position)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center z-10"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </>
      ) : editable ? (
        <button
          onClick={() => onAdd(position)}
          className="absolute inset-0 flex items-center justify-center text-ink-faint active:text-ink transition-colors"
        >
          <Plus className="w-8 h-8" />
        </button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Plus className="w-6 h-6 text-ink-faint opacity-30" />
        </div>
      )}
    </div>
  )
}

export default function Top4Grid({
  films: initial,
  editable,
}: {
  films: TopFilm[]
  editable: boolean
}) {
  const [films, setFilms] = useState<TopFilm[]>(initial)
  const [modalPosition, setModalPosition] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const slots = [1, 2, 3, 4].map(pos => films.find(f => f.position === pos) ?? null)
  const sortableIds = films.map(f => f.id)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = films.findIndex(f => f.id === active.id)
    const newIndex = films.findIndex(f => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(films, oldIndex, newIndex).map((f, i) => ({ ...f, position: i + 1 }))
    setFilms(reordered)
    await reorderTopFilmsAction(reordered.map(f => ({ id: f.id, position: f.position })))
  }

  const handleSelect = async (movie: TmdbMovie) => {
    if (modalPosition === null) return
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
    const newFilm: TopFilm = {
      id: `temp-${Date.now()}`,
      position: modalPosition,
      tmdb_id: String(movie.id),
      title: movie.title,
      poster_url: posterUrl,
    }
    setFilms(prev => [...prev.filter(f => f.position !== modalPosition), newFilm])
    setModalPosition(null)
    await addTopFilmAction(modalPosition, String(movie.id), movie.title, posterUrl)
  }

  const handleRemove = async (position: number) => {
    setFilms(prev => prev.filter(f => f.position !== position))
    await removeTopFilmAction(position)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 w-full">
            {slots.map((film, i) => (
              <SortableSlot
                key={film?.id ?? `empty-${i + 1}`}
                film={film}
                editable={editable}
                onRemove={handleRemove}
                onAdd={pos => setModalPosition(pos)}
                position={i + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modalPosition !== null && (
        <FilmSearchModal
          onSelect={handleSelect}
          onClose={() => setModalPosition(null)}
        />
      )}
    </>
  )
}
