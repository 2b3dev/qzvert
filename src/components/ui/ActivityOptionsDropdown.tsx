import { AnimatePresence, motion } from 'framer-motion'
import {
  Bookmark,
  Flag,
  MoreVertical,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button } from './button'
import { cn } from '../../lib/utils'

export interface ActivityOptionsDropdownProps {
  activityId: string
  activityTitle?: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  // Save/Unsave
  isSaved?: boolean
  onSave?: () => void
  onUnsave?: () => void
  // Custom save label (e.g., "Save to" for saved page)
  saveLabel?: string
  // Share
  onShare?: () => void
  // Report
  onReport?: () => void
  // Remove (for saved page - different from unsave)
  showRemoveOption?: boolean
  onRemove?: () => void
  // Position
  position?: 'top' | 'bottom'
}

export function ActivityOptionsDropdown({
  isOpen,
  onToggle,
  onClose,
  isSaved,
  onSave,
  onUnsave,
  saveLabel = 'Save',
  onShare,
  onReport,
  showRemoveOption,
  onRemove,
  position = 'top',
}: ActivityOptionsDropdownProps) {
  const handleOptionClick = (callback?: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      callback?.()
      onClose()
    }
  }

  return (
    <div data-options-dropdown className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? -8 : 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? -8 : 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 z-50 min-w-[160px] p-1 rounded-lg border border-border bg-background shadow-lg',
              position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            )}
          >
            {/* Save Option */}
            {onSave && (
              <button
                type="button"
                onClick={handleOptionClick(onSave)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors"
              >
                <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
                <span>{saveLabel}</span>
              </button>
            )}

            {/* Unsave Option */}
            {onUnsave && (
              <button
                type="button"
                onClick={handleOptionClick(onUnsave)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors"
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>Unsave</span>
              </button>
            )}

            {/* Share Option */}
            {onShare && (
              <button
                type="button"
                onClick={handleOptionClick(onShare)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}

            {/* Report Option */}
            {onReport && (
              <button
                type="button"
                onClick={handleOptionClick(onReport)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors text-destructive"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </button>
            )}

            {/* Remove Option (for saved page) */}
            {showRemoveOption && onRemove && (
              <button
                type="button"
                onClick={handleOptionClick(onRemove)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
