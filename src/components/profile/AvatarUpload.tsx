'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { uploadAvatarAction } from '@/app/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  pseudo: string
}

export default function AvatarUpload({ currentUrl, pseudo }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await uploadAvatarAction(fd)
    } catch {
      // ignore — preview already shown, user can retry
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
      <Image
        src={preview ?? '/default-avatar.png'}
        alt={pseudo}
        fill
        sizes="96px"
        className="object-cover"
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
