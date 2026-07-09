'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface AvatarUploadProps {
  currentUrl: string | null
  pseudo: string
}

// ponytail: convert to a small JPEG via canvas before upload. iPhone photos are
// HEIC (browsers/next-image can't render them) and multi-MB. Canvas decodes the
// source (Safari handles HEIC), downscales, and re-encodes as guaranteed JPEG.
async function fileToJpeg(file: File, maxSize = 512, quality = 0.9): Promise<Blob> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('decode failed'))
    image.src = dataUrl
  })
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality)
  })
}

export default function AvatarUpload({ currentUrl, pseudo }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)

  // ponytail: upload direct navigateur → Supabase Storage. Passer par un server
  // action route le fichier via Next.js (limite 1MB) et casse sur les photos de tel.
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      let blob: Blob = file
      try {
        blob = await fileToJpeg(file)
      } catch (convErr) {
        console.error('Avatar convert (upload original):', convErr)
      }
      setPreview(URL.createObjectURL(blob))

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { console.error('Avatar: non authentifié'); return }

      const filename = `${user.id}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, blob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) { console.error('Avatar upload:', uploadError.message); return }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename)
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithBust })
        .eq('id', user.id)
      if (updateError) { console.error('Avatar DB:', updateError.message); return }

      setPreview(urlWithBust)
    } catch (err) {
      console.error('Avatar exception:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-fill shadow-card group"
    >
      {/* ponytail: plain <img> intentional — blob: preview URLs are incompatible with next/image */}
      <img
        src={preview ?? '/default-avatar.png'}
        alt={pseudo}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
        <Camera className="w-6 h-6 text-white" />
      </div>
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </button>
  )
}
