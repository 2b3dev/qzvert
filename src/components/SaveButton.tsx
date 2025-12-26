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
  const [defaultCollectionId, setDefaultCollectionId] = useState<string | null>(null)

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
          setDefaultCollectionId(result.collectionIds[0])
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
        // Unsave
        if (defaultCollectionId) {
          await unsaveActivity({ data: { activityId, collectionId: defaultCollectionId } })
        }
        setSaved(false)
        onSaveChange?.(false)
        toast.success('Removed from saved')
      } else {
        // Save to default collection
        const result = await saveActivity({ data: { activityId } })
        setDefaultCollectionId(result.collectionId)
        setSaved(true)
        onSaveChange?.(true)
        toast.success('Saved to collection')
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
