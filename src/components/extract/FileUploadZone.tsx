'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Loader2,
  Upload,
  X,
  Youtube,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import type { ExtractionInputType } from '../../types/database'
import { Button } from '../ui/button'

// File extension to input type mapping
const FILE_TYPE_MAP: Record<string, ExtractionInputType> = {
  pdf: 'pdf',
  xlsx: 'excel',
  xls: 'excel',
  csv: 'excel',
  doc: 'doc',
  docx: 'doc',
  ppt: 'doc',
  pptx: 'doc',
  key: 'doc',
  pages: 'doc',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
}

// MIME type to input type mapping
const MIME_TYPE_MAP: Record<string, ExtractionInputType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/vnd.ms-excel': 'excel',
  'text/csv': 'excel',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'application/vnd.ms-powerpoint': 'doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'doc',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
}

// Accept string for file input
const ACCEPT_FILES =
  '.pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.key,.pages,.png,.jpg,.jpeg,.gif,.webp,.svg'

export interface FileUploadZoneProps {
  onFileSelect: (file: File, base64Data: string, inputType: ExtractionInputType) => void
  onUrlDetect?: (url: string, inputType: 'youtube' | 'web') => void
  isLoading?: boolean
  disabled?: boolean
  maxSizeMB?: number
  className?: string
  translations?: {
    dropzone?: string
    or?: string
    browseFiles?: string
    pasteUrl?: string
    maxSize?: string
    supportedTypes?: string
    youtube?: string
    web?: string
    pdf?: string
    excel?: string
    doc?: string
    image?: string
  }
}

export function FileUploadZone({
  onFileSelect,
  onUrlDetect,
  isLoading = false,
  disabled = false,
  maxSizeMB = 50,
  className,
  translations,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [detectedUrlType, setDetectedUrlType] = useState<'youtube' | 'web' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = {
    dropzone: translations?.dropzone || 'Drop files here or click to upload',
    or: translations?.or || 'or',
    browseFiles: translations?.browseFiles || 'Browse Files',
    pasteUrl: translations?.pasteUrl || 'Paste URL (YouTube, Web)',
    maxSize: translations?.maxSize || `Max ${maxSizeMB}MB`,
    supportedTypes: translations?.supportedTypes || 'PDF, Excel, Word, Images',
    youtube: translations?.youtube || 'YouTube',
    web: translations?.web || 'Web',
    pdf: translations?.pdf || 'PDF',
    excel: translations?.excel || 'Excel',
    doc: translations?.doc || 'Document',
    image: translations?.image || 'Image',
  }

  // Detect input type from file
  const getFileType = (file: File): ExtractionInputType | null => {
    // Try MIME type first
    const mimeType = MIME_TYPE_MAP[file.type]
    if (mimeType) return mimeType

    // Fallback to extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext && FILE_TYPE_MAP[ext]) return FILE_TYPE_MAP[ext]

    return null
  }

  // Detect URL type
  const detectUrlType = (url: string): 'youtube' | 'web' | null => {
    const trimmed = url.trim()
    if (!trimmed) return null

    // YouTube patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/,
    ]

    for (const pattern of youtubePatterns) {
      if (pattern.test(trimmed)) return 'youtube'
    }

    // Web URL pattern
    if (/^https?:\/\/[^\s]+$/.test(trimmed)) return 'web'

    return null
  }

  // Handle file selection
  const handleFile = async (file: File) => {
    setError(null)

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be less than ${maxSizeMB}MB`)
      return
    }

    // Detect file type
    const inputType = getFileType(file)
    if (!inputType) {
      setError('Unsupported file type')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      onFileSelect(file, base64Data, inputType)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isLoading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || isLoading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  // Handle URL input change
  const handleUrlChange = (value: string) => {
    setUrlInput(value)
    setError(null)
    const detected = detectUrlType(value)
    setDetectedUrlType(detected)
  }

  // Handle URL submit
  const handleUrlSubmit = () => {
    if (!urlInput.trim() || !detectedUrlType || !onUrlDetect) return
    onUrlDetect(urlInput.trim(), detectedUrlType)
    setUrlInput('')
    setDetectedUrlType(null)
  }

  // Get icon for file type
  const getTypeIcon = (type: ExtractionInputType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />
      case 'web':
        return <Globe className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />
      case 'doc':
        return <FileText className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* URL Input */}
      {onUrlDetect && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder={t.pasteUrl}
                disabled={disabled || isLoading}
                className={cn(
                  'w-full px-4 py-3 pr-24 rounded-xl border border-input bg-background text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                  'transition-colors',
                  (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
                )}
              />
              <AnimatePresence>
                {detectedUrlType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full',
                        detectedUrlType === 'youtube'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-blue-500/20 text-blue-500',
                      )}
                    >
                      {detectedUrlType === 'youtube' ? (
                        <Youtube className="w-3 h-3" />
                      ) : (
                        <Globe className="w-3 h-3" />
                      )}
                      {detectedUrlType === 'youtube' ? t.youtube : t.web}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              onClick={handleUrlSubmit}
              disabled={!detectedUrlType || disabled || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Extract'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Divider */}
      {onUrlDetect && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase">{t.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* File Drop Zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_FILES}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      <motion.div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border bg-muted/30',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
        whileHover={!disabled && !isLoading ? { scale: 1.01 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.99 } : undefined}
      >
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          )}

          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              {isLoading ? 'Processing...' : t.dropzone}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.supportedTypes} ({t.maxSize})
            </p>
          </div>

          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <Upload className="w-4 h-4" />
              {t.browseFiles}
            </Button>
          )}

          {/* Supported file type icons */}
          <div className="flex items-center gap-3 mt-2">
            {(['pdf', 'excel', 'doc', 'image'] as const).map((type) => (
              <div
                key={type}
                className="flex items-center gap-1 text-xs text-muted-foreground"
                title={t[type]}
              >
                {getTypeIcon(type)}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUploadZone
