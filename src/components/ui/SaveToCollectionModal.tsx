import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, Folder, Star, Loader2 } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { cn } from '../../lib/utils'
import { getCollections, createCollection, saveActivity } from '../../server/saved'
import type { CollectionWithCount } from '../../types/database'

interface SaveToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  onSaved: (collectionId: string) => void
}

export function SaveToCollectionModal({
  isOpen,
  onClose,
  activityId,
  onSaved
}: SaveToCollectionModalProps) {
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creating, setCreating] = useState(false)

  // Fetch collections when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setSelectedCollectionId(null)
      setShowCreateNew(false)
      setNewCollectionName('')

      getCollections()
        .then((data) => {
          setCollections(data)
          // Auto-select "All Saved" collection (first item with id='all')
          const allSavedCollection = data.find(c => c.id === 'all')
          if (allSavedCollection) {
            setSelectedCollectionId(allSavedCollection.id)
          }
        })
        .catch(() => {
          setCollections([])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen])

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return

    setCreating(true)
    try {
      const newCollection = await createCollection({ data: { name: newCollectionName.trim() } })
      setCollections(prev => [...prev, { ...newCollection, item_count: 0 }])
      setSelectedCollectionId(newCollection.id)
      setShowCreateNew(false)
      setNewCollectionName('')
    } catch {
      // Handle error silently
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCollectionId) return

    setSaving(true)
    try {
      await saveActivity({ data: { activityId, collectionId: selectedCollectionId } })
      onSaved(selectedCollectionId)
      onClose()
    } catch {
      // Handle error silently
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Save to Collection</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Collections list */}
                    {collections.map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => setSelectedCollectionId(collection.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                          selectedCollectionId === collection.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          collection.id === 'all' ? 'bg-amber-500/20' : 'bg-primary/20'
                        )}>
                          {collection.id === 'all' ? (
                            <Star className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Folder className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground">{collection.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        {selectedCollectionId === collection.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    ))}

                    {/* Create new collection */}
                    {showCreateNew ? (
                      <div className="p-3 rounded-lg border border-border bg-accent/30">
                        <Input
                          placeholder="Collection name..."
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateCollection()
                            if (e.key === 'Escape') {
                              setShowCreateNew(false)
                              setNewCollectionName('')
                            }
                          }}
                          autoFocus
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleCreateCollection}
                            disabled={!newCollectionName.trim() || creating}
                          >
                            {creating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Create'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowCreateNew(false)
                              setNewCollectionName('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCreateNew(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-muted-foreground">Create new collection</p>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!selectedCollectionId || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
