'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface AvatarUploadProps {
  currentUrl: string | null
  pseudo: string
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
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { console.error('Avatar: non authentifié'); return }

      const filename = `${user.id}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { upsert: true, contentType: file.type })
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
