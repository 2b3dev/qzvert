'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Languages,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
  Youtube,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import Markdown from 'react-markdown'
import { cn } from '../../lib/utils'
import type { ExtractedContent, ExtractionInputType } from '../../types/database'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export type ContentMode = 'original' | 'summarized' | 'crafted' | 'translated'

export interface LanguageOption {
  code: string
  name: string
  flag: string
}

export interface ExtractedContentDisplayProps {
  content: ExtractedContent | null
  displayContent: string
  contentMode: ContentMode
  keyPoints: string[]
  isProcessing?: boolean
  processingAction?: string

  // Mode controls
  selectedMode: 'original' | 'summarize' | 'lesson'
  onModeSelect: (mode: 'original' | 'summarize' | 'lesson') => void
  onGenerate: () => void
  onBackToOriginal: () => void

  // Target language
  targetLanguage: string
  onTargetLanguageChange: (lang: string) => void
  availableLanguages: LanguageOption[]

  // Availability flags
  hasSummarized: boolean
  hasCrafted: boolean
  aiEnabled?: boolean

  // Easy Explain mode
  canUseEasyExplain?: boolean
  easyExplainEnabled?: boolean
  onEasyExplainToggle?: () => void

  className?: string
  translations?: {
    original?: string
    summarize?: string
    lesson?: string
    generate?: string
    regenerate?: string
    backToOriginal?: string
    selectMode?: string
    originalDesc?: string
    summarizeDesc?: string
    lessonDesc?: string
    keyPoints?: string
    viewingSummary?: string
    viewingLesson?: string
    viewingTranslated?: string
    characters?: string
    words?: string
    copy?: string
    copied?: string
    export?: string
    showOriginal?: string
    hideOriginal?: string
    easyExplain?: string
    easyExplainUpgrade?: string
    targetLanguage?: string
  }
}

// Get icon for input type
function getTypeIcon(type: ExtractionInputType) {
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

// Get badge style for input type
function getTypeBadgeStyle(type: ExtractionInputType) {
  switch (type) {
    case 'youtube':
      return 'bg-red-500/20 text-red-500'
    case 'web':
      return 'bg-blue-500/20 text-blue-500'
    case 'pdf':
      return 'bg-orange-500/20 text-orange-500'
    case 'excel':
      return 'bg-emerald-500/20 text-emerald-500'
    case 'doc':
      return 'bg-violet-500/20 text-violet-500'
    case 'image':
      return 'bg-pink-500/20 text-pink-500'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function ExtractedContentDisplay({
  content,
  displayContent,
  contentMode,
  keyPoints,
  isProcessing = false,
  processingAction,
  selectedMode,
  onModeSelect,
  onGenerate,
  onBackToOriginal,
  targetLanguage,
  onTargetLanguageChange,
  availableLanguages,
  hasSummarized,
  hasCrafted,
  aiEnabled = true,
  canUseEasyExplain = false,
  easyExplainEnabled = false,
  onEasyExplainToggle,
  className,
  translations,
}: ExtractedContentDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  const t = {
    original: translations?.original || 'Original',
    summarize: translations?.summarize || 'Summarize',
    lesson: translations?.lesson || 'Lesson',
    generate: translations?.generate || 'Generate',
    regenerate: translations?.regenerate || 'Regenerate',
    backToOriginal: translations?.backToOriginal || 'Back to Original',
    selectMode: translations?.selectMode || 'Select Mode',
    originalDesc: translations?.originalDesc || 'View original extracted text',
    summarizeDesc: translations?.summarizeDesc || 'Summarize content',
    lessonDesc: translations?.lessonDesc || 'Craft into structured lesson',
    keyPoints: translations?.keyPoints || 'Key Points',
    viewingSummary: translations?.viewingSummary || 'Viewing Summary',
    viewingLesson: translations?.viewingLesson || 'Viewing Lesson',
    viewingTranslated: translations?.viewingTranslated || 'Viewing Translation',
    characters: translations?.characters || 'characters',
    words: translations?.words || 'words',
    copy: translations?.copy || 'Copy',
    copied: translations?.copied || 'Copied!',
    export: translations?.export || 'Export',
    showOriginal: translations?.showOriginal || 'Show Original',
    hideOriginal: translations?.hideOriginal || 'Hide Original',
    easyExplain: translations?.easyExplain || 'Easy Explain',
    easyExplainUpgrade: translations?.easyExplainUpgrade || 'Upgrade to Plus',
    targetLanguage: translations?.targetLanguage || 'Target Language',
  }

  const selectedLang = availableLanguages.find((l) => l.code === targetLanguage)

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [displayContent])

  // Export as text file
  const handleExport = useCallback(() => {
    const filename = content?.title
      ? `${content.title.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}.txt`
      : 'extracted_content.txt'

    const blob = new Blob([displayContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [displayContent, content?.title])

  // Count words
  const wordCount = displayContent.trim().split(/\s+/).filter(Boolean).length

  if (!displayContent && !content) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
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
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-input bg-background hover:bg-accent/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedLang?.flag || '🌐'}</span>
                <span className="text-sm font-medium">
                  {selectedLang?.name || targetLanguage}
                </span>
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto"
          >
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
                {targetLanguage === lang.code && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground">
          {t.selectMode}
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-background border border-input">
          {/* Original Mode */}
          <button
            onClick={() => onModeSelect('original')}
            disabled={isProcessing}
            className={cn(
              'relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
              selectedMode === 'original'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
              isProcessing && 'opacity-50 cursor-not-allowed',
            )}
          >
            <FileText className="w-4 h-4" />
            {t.original}
          </button>

          {/* Summarize Mode */}
          <div className="relative group/summarize">
            <button
              onClick={() => aiEnabled && onModeSelect('summarize')}
              disabled={isProcessing || !aiEnabled}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                selectedMode === 'summarize'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                (isProcessing || !aiEnabled) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Sparkles className="w-4 h-4" />
              {t.summarize}
              {hasSummarized && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            {!aiEnabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-sm text-foreground opacity-0 group-hover/summarize:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                AI is disabled
              </div>
            )}
          </div>

          {/* Lesson Mode */}
          <div className="relative group/lesson">
            <button
              onClick={() => aiEnabled && onModeSelect('lesson')}
              disabled={isProcessing || !aiEnabled}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                selectedMode === 'lesson'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                (isProcessing || !aiEnabled) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Wand2 className="w-4 h-4" />
              {t.lesson}
              {hasCrafted && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            {!aiEnabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-sm text-foreground opacity-0 group-hover/lesson:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                AI is disabled
              </div>
            )}
          </div>
        </div>

        {/* Mode Description with Easy Explain toggle for summarize/lesson */}
        {(selectedMode === 'summarize' || selectedMode === 'lesson') && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/20">
                  {selectedMode === 'summarize' ? (
                    <Sparkles className="w-4 h-4 text-primary" />
                  ) : (
                    <Wand2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedMode === 'summarize' ? t.summarizeDesc : t.lessonDesc}
                </p>
              </div>

              {/* Easy Explain Toggle */}
              {onEasyExplainToggle && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.easyExplain}</span>
                  <button
                    type="button"
                    onClick={onEasyExplainToggle}
                    disabled={!canUseEasyExplain}
                    className={cn(
                      'relative w-9 h-5 rounded-full transition-colors duration-200',
                      easyExplainEnabled && canUseEasyExplain
                        ? 'bg-yellow-500'
                        : 'bg-muted',
                      !canUseEasyExplain && 'opacity-50 cursor-not-allowed',
                    )}
                    title={
                      canUseEasyExplain ? t.easyExplain : t.easyExplainUpgrade
                    }
                  >
                    <motion.div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{
                        left:
                          easyExplainEnabled && canUseEasyExplain
                            ? '1.125rem'
                            : '0.125rem',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {selectedMode === 'original' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-emerald-500/20">
                <FileText className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">{t.originalDesc}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content Mode Indicator */}
      {contentMode !== 'original' && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
          <div className="flex items-center gap-2">
            {contentMode === 'summarized' && <Sparkles className="w-4 h-4" />}
            {contentMode === 'crafted' && <Wand2 className="w-4 h-4" />}
            {contentMode === 'translated' && <Languages className="w-4 h-4" />}
            <span className="font-medium">
              {contentMode === 'summarized' && t.viewingSummary}
              {contentMode === 'crafted' && t.viewingLesson}
              {contentMode === 'translated' && t.viewingTranslated}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToOriginal}
            className="text-primary hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.backToOriginal}
          </Button>
        </div>
      )}

      {/* Content Display */}
      <div className="relative">
        {/* Metadata bar */}
        {content && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Type badge */}
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full',
                getTypeBadgeStyle(content.input_type),
              )}
            >
              {getTypeIcon(content.input_type)}
              {content.input_type}
            </span>

            {/* Title */}
            {content.title && (
              <span className="text-sm font-medium truncate max-w-[300px]">
                {content.title}
              </span>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="relative min-h-[200px] max-h-[400px] overflow-auto p-4 rounded-xl border border-border bg-muted/30">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
            <Markdown>{displayContent}</Markdown>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between gap-2 mt-2 px-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {displayContent.length.toLocaleString()} {t.characters}
            </span>
            <span className="text-xs text-muted-foreground">
              {wordCount.toLocaleString()} {t.words}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={t.copy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={t.export}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Original content (collapsible) */}
      {contentMode !== 'original' && content?.extracted_text && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="w-full flex items-center justify-between gap-2 p-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span>{showOriginal ? t.hideOriginal : t.showOriginal}</span>
            {showOriginal ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {showOriginal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="max-h-[200px] overflow-auto p-4 border-t border-border bg-muted/20">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{content.extracted_text}</Markdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Key Points */}
      <AnimatePresence>
        {keyPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.keyPoints}
            </h4>
            <ul className="space-y-1">
              {keyPoints.map((point, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-emerald-500">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Generate/Regenerate button for summarize/lesson modes */}
        {selectedMode !== 'original' && (
          <Button
            onClick={onGenerate}
            disabled={isProcessing || !displayContent.trim()}
            variant={
              (selectedMode === 'summarize' && hasSummarized) ||
              (selectedMode === 'lesson' && hasCrafted)
                ? 'outline'
                : 'default'
            }
            className="gap-2"
          >
            {isProcessing && (processingAction === selectedMode || processingAction === 'craft') ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (selectedMode === 'summarize' && hasSummarized) ||
              (selectedMode === 'lesson' && hasCrafted) ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {(selectedMode === 'summarize' && hasSummarized) ||
            (selectedMode === 'lesson' && hasCrafted)
              ? t.regenerate
              : t.generate}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ExtractedContentDisplay
