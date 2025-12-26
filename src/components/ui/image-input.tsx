'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { deleteImage, uploadImage } from '../../server/storage'
import { useAuthStore } from '../../stores/auth-store'
import { Button } from './button'

export interface ImageInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'wide'
  allowExternalUrl?: boolean
}

export function ImageInput({
  value,
  onChange,
  placeholder = 'Add an image',
  className,
  aspectRatio = 'video',
  allowExternalUrl = false,
}: ImageInputProps) {
  const [isUrlMode, setIsUrlMode] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { session } = useAuthStore()

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }[aspectRatio]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    // Check if user is authenticated
    if (!session) {
      // Fallback to base64 if not authenticated
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange(result)
      }
      reader.onerror = () => {
        setError('Failed to read file')
      }
      reader.readAsDataURL(file)
      return
    }

    // Upload to Supabase Storage
    setIsUploading(true)
    try {
      // Convert file to base64 first
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const result = await uploadImage({
        data: {
          base64Data: base64,
          fileName: file.name,
        },
      })

      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    // Basic URL validation
    try {
      new URL(urlInput)
      onChange(urlInput)
      setUrlInput('')
      setIsUrlMode(false)
      setError(null)
    } catch {
      setError('Please enter a valid URL')
    }
  }

  const handleRemove = async () => {
    // If it's a storage URL and user is authenticated, delete from storage
    if (value.includes('/storage/v1/object/public/') && session) {
      try {
        await deleteImage({
          data: {
            imageUrl: value,
          },
        })
      } catch {
        // Ignore delete errors, still remove from UI
      }
    }

    onChange('')
    setError(null)
  }

  if (value) {
    return (
      <div className={cn('relative group', className)}>
        <div
          className={cn(
            'relative rounded-lg overflow-hidden border border-border bg-secondary/30',
            aspectRatioClass,
          )}
        >
          <img
            src={value}
            alt="Thumbnail"
            className="w-full h-full object-cover"
            onError={() => setError('Failed to load image')}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemove}
              className="bg-white/90 hover:bg-white text-black"
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {isUrlMode ? (
          <motion.div
            key="url-input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button size="sm" onClick={handleUrlSubmit}>
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsUrlMode(false)
                  setUrlInput('')
                  setError(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'relative rounded-lg border-2 border-dashed transition-colors',
              aspectRatioClass,
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border bg-secondary/30 hover:border-muted-foreground',
              isUploading && 'pointer-events-none opacity-70',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {placeholder}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag and drop or click to upload
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                    {allowExternalUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsUrlMode(true)}
                      >
                        <LinkIcon className="w-4 h-4" />
                        URL
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
