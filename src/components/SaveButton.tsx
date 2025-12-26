import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { isActivitySaved, saveActivity, unsaveActivity } from '../server/saved'
import { useAuthStore } from '../stores/auth-store'
import { toast } from 'sonner'

interface SaveButtonProps {
  activityId: string
  size?: 'sm' | 'default' | 'icon'
  className?: string
  onSaveChange?: (saved: boolean) => void
}

export function SaveButton({ activityId, size = 'icon', className, onSaveChange }: SaveButtonProps) {
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  // collection_id can be null (for "All Saved" / no specific collection)
  const [savedCollectionId, setSavedCollectionId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!user) {
      setSaved(false)
      return
    }

    // Check if activity is saved
    isActivitySaved({ data: { activityId } })
      .then(result => {
        setSaved(result.saved)
        if (result.collectionIds.length > 0) {
          // First collection_id (can be null for "All Saved")
          setSavedCollectionId(result.collectionIds[0])
        }
      })
      .catch(() => {
        setSaved(false)
      })
  }, [activityId, user])

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Please login to save activities')
      return
    }

    setLoading(true)

    try {
      if (saved) {
        // Unsave - pass collection_id (can be null for "All Saved")
        await unsaveActivity({ data: { activityId, collectionId: savedCollectionId } })
        setSaved(false)
        setSavedCollectionId(undefined)
        onSaveChange?.(false)
        toast.success('Removed from saved')
      } else {
        // Save without collection (null = "All Saved")
        const result = await saveActivity({ data: { activityId } })
        setSavedCollectionId(result.collectionId)
        setSaved(true)
        onSaveChange?.(true)
        toast.success('Saved')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        'relative',
        saved && 'text-red-500 hover:text-red-600',
        className
      )}
      onClick={handleToggleSave}
      disabled={loading}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={saved ? 'saved' : 'unsaved'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              saved ? 'fill-current' : ''
            )}
          />
        </motion.div>
      </AnimatePresence>
    </Button>
  )
}
