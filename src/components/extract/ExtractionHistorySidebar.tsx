'use client'

import { motion } from 'framer-motion'
import {
  Clock,
  Cloud,
  FileSpreadsheet,
  FileText,
  Globe,
  Image,
  Loader2,
  Plus,
  Trash2,
  Youtube,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ExtractedContent, ExtractionInputType } from '../../types/database'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'

export interface ExtractionHistorySidebarProps {
  items: ExtractedContent[]
  currentId?: string | null
  isLoading?: boolean
  onSelect: (item: ExtractedContent) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onNewExtraction: () => void
  className?: string
  translations?: {
    title?: string
    newExtraction?: string
    noHistory?: string
    noHistoryHint?: string
    clearAll?: string
    cloudStored?: string
  }
}

// Get icon for input type
function getTypeIcon(type: ExtractionInputType) {
  switch (type) {
    case 'youtube':
      return <Youtube className="w-3.5 h-3.5" />
    case 'web':
      return <Globe className="w-3.5 h-3.5" />
    case 'pdf':
      return <FileText className="w-3.5 h-3.5" />
    case 'excel':
      return <FileSpreadsheet className="w-3.5 h-3.5" />
    case 'doc':
      return <FileText className="w-3.5 h-3.5" />
    case 'image':
      return <Image className="w-3.5 h-3.5" />
    default:
      return <FileText className="w-3.5 h-3.5" />
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

// Format date for display
function formatDate(dateString: string, locale: string = 'en-US') {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Within the last hour
  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`
  }

  // Within today
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  // Within a week
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  // Older
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export function ExtractionHistorySidebar({
  items,
  currentId,
  isLoading = false,
  onSelect,
  onDelete,
  onClearAll,
  onNewExtraction,
  className,
  translations,
}: ExtractionHistorySidebarProps) {
  const t = {
    title: translations?.title || 'History',
    newExtraction: translations?.newExtraction || 'New Extraction',
    noHistory: translations?.noHistory || 'No history yet',
    noHistoryHint: translations?.noHistoryHint || 'Extract content to save here',
    clearAll: translations?.clearAll || 'Clear All',
    cloudStored: translations?.cloudStored || 'Synced to cloud',
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* New Extraction Button */}
      <Button
        onClick={onNewExtraction}
        className="w-full gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
      >
        <Plus className="w-4 h-4" />
        {t.newExtraction}
      </Button>

      {/* History Card */}
      <Card className="border-primary/20">
        <CardHeader className="py-3 px-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm flex items-center gap-1">
                {t.title}
                <span title={t.cloudStored}>
                  <Cloud className="w-3 h-3 opacity-50 relative top-0.5" />
                </span>
              </span>
            </div>
            {items.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-muted">
                {items.length}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t.noHistory}</p>
              <p className="text-xs mt-1">{t.noHistoryHint}</p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-280px)] overflow-auto">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => onSelect(item)}
                  className={cn(
                    'p-3 border-b border-border cursor-pointer',
                    'hover:bg-accent/50 transition-colors',
                    currentId === item.id && 'bg-primary/10 border-l-2 border-l-primary',
                  )}
                >
                  {/* Title */}
                  <p className="text-sm font-medium truncate mb-1.5">
                    {item.title || item.extracted_text.slice(0, 50)}
                  </p>

                  {/* Metadata row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Time */}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.last_accessed_at || item.created_at)}
                    </span>

                    {/* Type badge */}
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded',
                        getTypeBadgeStyle(item.input_type),
                      )}
                    >
                      {getTypeIcon(item.input_type)}
                    </span>

                    {/* AI processed badges */}
                    {item.summarized_content && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">
                        Sum
                      </span>
                    )}
                    {item.crafted_content && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">
                        Craft
                      </span>
                    )}

                    {/* Word count */}
                    {item.word_count && (
                      <span className="text-xs text-muted-foreground">
                        {item.word_count.toLocaleString()} words
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.id)
                      }}
                      className="ml-auto p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Clear All Button */}
              <button
                onClick={onClearAll}
                className="w-full p-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                {t.clearAll}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ExtractionHistorySidebar
