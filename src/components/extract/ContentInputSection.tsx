'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ClipboardPaste,
  FileSpreadsheet,
  FileText,
  FileUp,
  Globe,
  Image,
  Languages,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
  X,
  Youtube,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import type { ExtractionInputType } from '../../types/database'
import { Button } from '../ui/button'

export type InputSourceType = 'text' | 'file'
export type ProcessMode = 'original' | 'summarize' | 'lesson'

export interface LanguageOption {
  code: string
  name: string
  flag: string
}

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

const ACCEPT_FILES =
  '.pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.key,.pages,.png,.jpg,.jpeg,.gif,.webp,.svg'

export interface ContentInputSectionProps {
  onExtract: (data: {
    type: 'text' | 'url' | 'file'
    content: string
    file?: File
    base64Data?: string
    inputType?: ExtractionInputType | 'youtube' | 'web'
    mode: ProcessMode
    targetLanguage: string
    easyExplainEnabled: boolean
  }) => void
  isLoading?: boolean
  disabled?: boolean
  maxSizeMB?: number
  targetLanguage: string
  onTargetLanguageChange: (lang: string) => void
  availableLanguages: LanguageOption[]
  selectedMode: ProcessMode
  onModeChange: (mode: ProcessMode) => void
  easyExplainEnabled: boolean
  onEasyExplainToggle: () => void
  canUseEasyExplain: boolean
  aiEnabled?: boolean
  className?: string
  translations?: {
    textTab?: string
    fileTab?: string
    textTabDesc?: string
    fileTabDesc?: string
    pasteFromClipboard?: string
    textPlaceholder?: string
    urlPlaceholder?: string
    dropzone?: string
    browseFiles?: string
    maxSize?: string
    supportedTypes?: string
    youtube?: string
    web?: string
    pdf?: string
    excel?: string
    doc?: string
    image?: string
    selectMode?: string
    original?: string
    summarize?: string
    lesson?: string
    originalDesc?: string
    summarizeDesc?: string
    lessonDesc?: string
    targetLanguage?: string
    easyExplain?: string
    easyExplainUpgrade?: string
    extract?: string
    extracting?: string
    or?: string
  }
}

export function ContentInputSection({
  onExtract,
  isLoading = false,
  disabled = false,
  maxSizeMB = 50,
  targetLanguage,
  onTargetLanguageChange,
  availableLanguages,
  selectedMode,
  onModeChange,
  easyExplainEnabled,
  onEasyExplainToggle,
  canUseEasyExplain,
  aiEnabled = true,
  className,
  translations,
}: ContentInputSectionProps) {
  const [inputSource, setInputSource] = useState<InputSourceType>('text')
  const [textInput, setTextInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileType, setFileType] = useState<ExtractionInputType | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [detectedUrlType, setDetectedUrlType] = useState<'youtube' | 'web' | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = {
    textTab: translations?.textTab || 'Text / Clipboard',
    fileTab: translations?.fileTab || 'File / URL',
    textTabDesc: translations?.textTabDesc || 'Paste or type text content',
    fileTabDesc: translations?.fileTabDesc || 'Upload file or paste URL',
    pasteFromClipboard: translations?.pasteFromClipboard || 'Paste from Clipboard',
    textPlaceholder: translations?.textPlaceholder || 'Paste or type your text here...',
    urlPlaceholder: translations?.urlPlaceholder || 'Paste URL (YouTube, Website)',
    dropzone: translations?.dropzone || 'Drop files here or click to upload',
    browseFiles: translations?.browseFiles || 'Browse Files',
    maxSize: translations?.maxSize || `Max ${maxSizeMB}MB`,
    supportedTypes: translations?.supportedTypes || 'PDF, Excel, Word, Images',
    youtube: translations?.youtube || 'YouTube',
    web: translations?.web || 'Web',
    pdf: translations?.pdf || 'PDF',
    excel: translations?.excel || 'Excel',
    doc: translations?.doc || 'Document',
    image: translations?.image || 'Image',
    selectMode: translations?.selectMode || 'Output Mode',
    original: translations?.original || 'Original',
    summarize: translations?.summarize || 'Summarize',
    lesson: translations?.lesson || 'Lesson',
    originalDesc: translations?.originalDesc || 'Extract text as-is',
    summarizeDesc: translations?.summarizeDesc || 'AI summarizes content',
    lessonDesc: translations?.lessonDesc || 'AI crafts into lesson',
    targetLanguage: translations?.targetLanguage || 'Target Language',
    easyExplain: translations?.easyExplain || 'Easy Explain',
    easyExplainUpgrade: translations?.easyExplainUpgrade || 'Upgrade to Plus',
    extract: translations?.extract || 'Extract',
    extracting: translations?.extracting || 'Extracting...',
    or: translations?.or || 'or',
  }

  const selectedLang = availableLanguages.find((l) => l.code === targetLanguage)

  // Detect file type
  const getFileType = (file: File): ExtractionInputType | null => {
    const mimeType = MIME_TYPE_MAP[file.type]
    if (mimeType) return mimeType
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext && FILE_TYPE_MAP[ext]) return FILE_TYPE_MAP[ext]
    return null
  }

  // Detect URL type
  const detectUrlType = (url: string): 'youtube' | 'web' | null => {
    const trimmed = url.trim()
    if (!trimmed) return null
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/,
    ]
    for (const pattern of youtubePatterns) {
      if (pattern.test(trimmed)) return 'youtube'
    }
    if (/^https?:\/\/[^\s]+$/.test(trimmed)) return 'web'
    return null
  }

  // Handle paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setTextInput(text)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
      setError('Failed to read from clipboard')
    }
  }, [])

  // Handle file selection
  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be less than ${maxSizeMB}MB`)
      return
    }
    const inputType = getFileType(file)
    if (!inputType) {
      setError('Unsupported file type')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      setSelectedFile(file)
      setFileBase64(base64Data)
      setFileType(inputType)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isLoading) setIsDragging(true)
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
    if (file) handleFile(file)
  }

  // Handle URL input change
  const handleUrlChange = (value: string) => {
    setUrlInput(value)
    setError(null)
    setDetectedUrlType(detectUrlType(value))
  }

  // Clear file selection
  const clearFile = () => {
    setSelectedFile(null)
    setFileBase64(null)
    setFileType(null)
  }

  // Check if can extract
  const canExtract = () => {
    if (isLoading || disabled) return false
    if (inputSource === 'text') {
      return textInput.trim().length > 0
    }
    // File tab - either file or URL
    return (selectedFile && fileBase64 && fileType) || (urlInput.trim() && detectedUrlType)
  }

  // Handle extract
  const handleExtract = () => {
    if (!canExtract()) return

    if (inputSource === 'text') {
      onExtract({
        type: 'text',
        content: textInput.trim(),
        mode: selectedMode,
        targetLanguage,
        easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
      })
    } else if (selectedFile && fileBase64 && fileType) {
      onExtract({
        type: 'file',
        content: selectedFile.name,
        file: selectedFile,
        base64Data: fileBase64,
        inputType: fileType,
        mode: selectedMode,
        targetLanguage,
        easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
      })
    } else if (urlInput.trim() && detectedUrlType) {
      onExtract({
        type: 'url',
        content: urlInput.trim(),
        inputType: detectedUrlType,
        mode: selectedMode,
        targetLanguage,
        easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
      })
    }
  }

  // Get file type icon
  const getTypeIcon = (type: ExtractionInputType | 'youtube' | 'web') => {
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
    <div className={cn('space-y-6', className)}>
      {/* Step 1: Input Source Tabs */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50 border border-border">
          <button
            type="button"
            onClick={() => setInputSource('text')}
            disabled={isLoading}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
              inputSource === 'text'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              isLoading && 'opacity-50 cursor-not-allowed',
            )}
          >
            <ClipboardPaste className="w-4 h-4" />
            {t.textTab}
          </button>
          <button
            type="button"
            onClick={() => setInputSource('file')}
            disabled={isLoading}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
              inputSource === 'file'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              isLoading && 'opacity-50 cursor-not-allowed',
            )}
          >
            <FileUp className="w-4 h-4" />
            {t.fileTab}
          </button>
        </div>
      </div>

      {/* Step 2: Input Content */}
      <AnimatePresence mode="wait">
        {inputSource === 'text' ? (
          <motion.div
            key="text-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t.textTabDesc}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteFromClipboard}
                disabled={isLoading}
                className="gap-1.5"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                {t.pasteFromClipboard}
              </Button>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t.textPlaceholder}
              disabled={isLoading}
              rows={6}
              className={cn(
                'w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'transition-colors placeholder:text-muted-foreground',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{textInput.length.toLocaleString()} characters</span>
              <span>{textInput.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* URL Input */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t.fileTabDesc}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={t.urlPlaceholder}
                    disabled={isLoading || !!selectedFile}
                    className={cn(
                      'w-full px-4 py-3 pr-24 rounded-xl border border-input bg-background text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                      'transition-colors placeholder:text-muted-foreground',
                      (isLoading || selectedFile) && 'opacity-50 cursor-not-allowed',
                    )}
                  />
                  <AnimatePresence>
                    {detectedUrlType && !selectedFile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
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
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">{t.or}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* File Drop Zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_FILES}
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />

            {selectedFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5"
              >
                <div className="p-2 rounded-lg bg-primary/20">
                  {getTypeIcon(fileType!)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                className={cn(
                  'relative rounded-xl border-2 border-dashed transition-all cursor-pointer',
                  'hover:border-primary/50 hover:bg-primary/5',
                  isDragging
                    ? 'border-primary bg-primary/10 scale-[1.02]'
                    : 'border-border bg-muted/30',
                  (isLoading || urlInput) && 'opacity-50 cursor-not-allowed pointer-events-none',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoading && !urlInput && fileInputRef.current?.click()}
                whileHover={!isLoading && !urlInput ? { scale: 1.01 } : undefined}
                whileTap={!isLoading && !urlInput ? { scale: 0.99 } : undefined}
              >
                <div className="flex flex-col items-center justify-center gap-3 p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{t.dropzone}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.supportedTypes} ({t.maxSize})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Settings Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Target Language Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" />
            {t.targetLanguage}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-input bg-background hover:bg-accent/50 transition-colors',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedLang?.flag || '🌐'}</span>
                <span className="text-sm font-medium">{selectedLang?.name || targetLanguage}</span>
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  showLangDropdown && 'rotate-180',
                )}
              />
            </button>
            <AnimatePresence>
              {showLangDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-popover shadow-lg"
                >
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onTargetLanguageChange(lang.code)
                        setShowLangDropdown(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors',
                        targetLanguage === lang.code && 'bg-primary/10 text-primary',
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {targetLanguage === lang.code && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{t.selectMode}</label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted/50 border border-border">
            <button
              type="button"
              onClick={() => onModeChange('original')}
              disabled={isLoading}
              className={cn(
                'flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all',
                selectedMode === 'original'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              {t.original}
            </button>
            <button
              type="button"
              onClick={() => aiEnabled && onModeChange('summarize')}
              disabled={isLoading || !aiEnabled}
              className={cn(
                'flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all',
                selectedMode === 'summarize'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                (isLoading || !aiEnabled) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.summarize}
            </button>
            <button
              type="button"
              onClick={() => aiEnabled && onModeChange('lesson')}
              disabled={isLoading || !aiEnabled}
              className={cn(
                'flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all',
                selectedMode === 'lesson'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                (isLoading || !aiEnabled) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {t.lesson}
            </button>
          </div>
        </div>
      </div>

      {/* Easy Explain Toggle (only for summarize/lesson modes) */}
      {(selectedMode === 'summarize' || selectedMode === 'lesson') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              {t.easyExplain}
            </span>
            <span className="text-xs text-muted-foreground">
              {selectedMode === 'summarize' ? t.summarizeDesc : t.lessonDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={onEasyExplainToggle}
            disabled={!canUseEasyExplain || isLoading}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              easyExplainEnabled && canUseEasyExplain ? 'bg-yellow-500' : 'bg-muted',
              (!canUseEasyExplain || isLoading) && 'opacity-50 cursor-not-allowed',
            )}
            title={canUseEasyExplain ? t.easyExplain : t.easyExplainUpgrade}
          >
            <motion.div
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
              animate={{
                left: easyExplainEnabled && canUseEasyExplain ? '1.375rem' : '0.125rem',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </motion.div>
      )}

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

      {/* Step 4: Extract Button */}
      <Button
        onClick={handleExtract}
        disabled={!canExtract()}
        size="lg"
        className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.extracting}
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {t.extract}
          </>
        )}
      </Button>
    </div>
  )
}

export default ContentInputSection
