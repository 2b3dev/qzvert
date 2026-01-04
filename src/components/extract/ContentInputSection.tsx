'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ClipboardPaste,
  Coins,
  FileSpreadsheet,
  FileText,
  FileUp,
  Globe,
  Image,
  Languages,
  Loader2,
  Sparkles,
  Upload,
  Volume2,
  Wand2,
  X,
  Youtube,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import type { CreditProcessMode, ExtractionInputType } from '../../types/database'
import { Button } from '../ui/button'
import { CreditPreview } from './CreditPreview'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileType, setFileType] = useState<ExtractionInputType | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = {
    textTab: translations?.textTab || 'Text / URL',
    fileTab: translations?.fileTab || 'File',
    textTabDesc: translations?.textTabDesc || 'Paste text or URL',
    fileTabDesc: translations?.fileTabDesc || 'Upload file',
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
    loudNow: translations?.loudNow || 'Loud Now',
    louding: translations?.louding || 'Processing...',
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

  // Detect URL type - only check if starts with http/https
  const detectUrlType = (text: string): 'youtube' | 'web' | null => {
    const trimmed = text.trim()
    if (!trimmed) return null

    // Only check URLs that start with http:// or https://
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return null
    }

    // Validate it's a proper URL
    try {
      new URL(trimmed)
    } catch {
      return null
    }

    // Check for YouTube patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/,
    ]
    for (const pattern of youtubePatterns) {
      if (pattern.test(trimmed)) return 'youtube'
    }

    return 'web'
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
    // File tab - file only
    return selectedFile && fileBase64 && fileType
  }

  // Handle extract
  const handleExtract = () => {
    if (!canExtract()) return

    if (inputSource === 'text') {
      const trimmedText = textInput.trim()
      const urlType = detectUrlType(trimmedText)

      // Check if input is a URL (starts with http/https)
      if (urlType) {
        onExtract({
          type: 'url',
          content: trimmedText,
          inputType: urlType,
          mode: selectedMode,
          targetLanguage,
          easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
        })
      } else {
        // Plain text
        onExtract({
          type: 'text',
          content: trimmedText,
          mode: selectedMode,
          targetLanguage,
          easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
        })
      }
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
            <div className="text-xs text-muted-foreground text-right">
              {textInput.length.toLocaleString()} characters
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
            <p className="text-sm text-muted-foreground">{t.fileTabDesc}</p>

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
                  isLoading && 'opacity-50 cursor-not-allowed pointer-events-none',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                whileHover={!isLoading ? { scale: 1.01 } : undefined}
                whileTap={!isLoading ? { scale: 0.99 } : undefined}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
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
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
              {availableLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => onTargetLanguageChange(lang.code)}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    targetLanguage === lang.code && 'bg-primary/10 text-primary',
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {targetLanguage === lang.code && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Credit Preview - show when content exists and not original mode */}
      {textInput.trim() && selectedMode !== 'original' && (
        <CreditPreview
          content={textInput}
          mode={selectedMode as CreditProcessMode}
          easyExplainEnabled={easyExplainEnabled}
          className="mb-3"
        />
      )}

      {/* Step 4: Extract/Loud Button */}
      <Button
        onClick={handleExtract}
        disabled={!canExtract()}
        size="lg"
        className={cn(
          'w-full gap-2',
          selectedMode === 'original'
            ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-500/90 hover:to-purple-500/90'
            : 'bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90',
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {selectedMode === 'original' ? t.louding : t.extracting}
          </>
        ) : selectedMode === 'original' ? (
          <>
            <Volume2 className="w-5 h-5" />
            {t.loudNow}
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
