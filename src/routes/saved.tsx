import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bookmark,
  Check,
  Edit2,
  FolderPlus,
  Heart,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'
import { getActivityById } from '../server/activities'
import {
  createCollection,
  deleteCollection,
  getCollections,
  getSavedItems,
  unsaveActivity,
  updateCollection,
} from '../server/saved'
import { useActivityStore } from '../stores/activity-store'
import { useAuthStore } from '../stores/auth-store'
import type { CollectionWithCount, SavedItemWithActivity } from '../types/database'

export const Route = createFileRoute('/saved')({
  component: SavedPage,
})

type TabType = 'all' | 'collections'

function SavedPage() {
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [savedItems, setSavedItems] = useState<SavedItemWithActivity[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null)
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null)

  // Create/Edit collection modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null)
  const [collectionName, setCollectionName] = useState('')
  const [savingCollection, setSavingCollection] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { setActivity, setThemeConfig } = useActivityStore()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-options-dropdown]')) {
        setOpenOptionsId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Fetch data
  useEffect(() => {
    if (!user) return

    async function fetchData() {
      try {
        setLoading(true)
        const [collectionsData, itemsData] = await Promise.all([
          getCollections(),
          getSavedItems({ data: { collectionId: selectedCollectionId || undefined } }),
        ])
        setCollections(collectionsData)
        setSavedItems(itemsData)
      } catch (err) {
        console.error('Failed to fetch saved data:', err)
        toast.error('Failed to load saved items')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, selectedCollectionId])

  const handlePlayActivity = async (activityId: string) => {
    try {
      setLoadingActivityId(activityId)
      const { generatedQuest, themeConfig } = await getActivityById({
        data: { activityId },
      })
      setActivity(generatedQuest, undefined, activityId)
      setThemeConfig(themeConfig)
      navigate({ to: '/activity/play/$id', params: { id: activityId } })
    } catch (err) {
      console.error('Failed to load activity:', err)
      toast.error('Failed to load activity')
    } finally {
      setLoadingActivityId(null)
    }
  }

  const handleUnsaveActivity = async (activityId: string, collectionId: string) => {
    try {
      await unsaveActivity({ data: { activityId, collectionId } })
      setSavedItems(prev => prev.filter(item => item.activity_id !== activityId || item.collection_id !== collectionId))
      toast.success('Removed from saved')
    } catch (err) {
      toast.error('Failed to remove')
    }
  }

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return

    try {
      setSavingCollection(true)
      if (editingCollection) {
        await updateCollection({ data: { id: editingCollection.id, name: collectionName } })
        setCollections(prev =>
          prev.map(c => c.id === editingCollection.id ? { ...c, name: collectionName } : c)
        )
        toast.success('Collection updated')
      } else {
        const newCollection = await createCollection({ data: { name: collectionName } })
        setCollections(prev => [...prev, { ...newCollection, item_count: 0 }])
        toast.success('Collection created')
      }
      setShowCreateModal(false)
      setEditingCollection(null)
      setCollectionName('')
    } catch (err) {
      toast.error('Failed to save collection')
    } finally {
      setSavingCollection(false)
    }
  }

  const handleDeleteCollection = async (collection: CollectionWithCount) => {
    if (collection.is_default) {
      toast.error('Cannot delete default collection')
      return
    }

    try {
      await deleteCollection({ data: { id: collection.id } })
      setCollections(prev => prev.filter(c => c.id !== collection.id))
      if (selectedCollectionId === collection.id) {
        setSelectedCollectionId(null)
      }
      toast.success('Collection deleted')
    } catch (err) {
      toast.error('Failed to delete collection')
    }
  }

  // Deduplicate items by activity_id when showing "All Saved" (no collection filter)
  const uniqueItems = selectedCollectionId
    ? savedItems // Show all items in specific collection (no dedup)
    : savedItems.filter((item, index, self) =>
        self.findIndex(i => i.activity_id === item.activity_id) === index
      )

  const filteredItems = uniqueItems.filter(item =>
    item.activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Auth loading
  if (isAuthLoading) {
    return (
      <DefaultLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DefaultLayout>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <DefaultLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-4">
                Please login to view your saved activities
              </p>
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-black text-foreground">
                My Saved
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Your bookmarked activities and collections
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tab Buttons */}
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveTab('all')
                  setSelectedCollectionId(null)
                }}
              >
                <Bookmark className="w-4 h-4 mr-1" />
                All Saved
              </Button>
              <Button
                variant={activeTab === 'collections' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('collections')}
              >
                <FolderPlus className="w-4 h-4 mr-1" />
                Collections
              </Button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Search */}
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="relative">
                        <Input
                          ref={searchInputRef}
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-8 h-9"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setShowSearch(false)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!showSearch && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                )}

                {/* Create Collection Button */}
                {activeTab === 'collections' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingCollection(null)
                      setCollectionName('')
                      setShowCreateModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </motion.div>
          )}

          {/* Collections Tab */}
          {!loading && activeTab === 'collections' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card
                    className={cn(
                      'h-full transition-all duration-300 cursor-pointer hover:shadow-lg',
                      selectedCollectionId === collection.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => {
                      setSelectedCollectionId(collection.id)
                      setActiveTab('all')
                    }}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {collection.name}
                            {collection.is_default && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                Default
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                          </CardDescription>
                        </div>
                        {!collection.is_default && (
                          <div data-options-dropdown className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenOptionsId(
                                  openOptionsId === collection.id ? null : collection.id
                                )
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>

                            <AnimatePresence>
                              {openOptionsId === collection.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute top-full right-0 mt-1 z-50 min-w-[120px] p-1 rounded-lg border border-border bg-background shadow-lg"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingCollection(collection)
                                      setCollectionName(collection.name)
                                      setShowCreateModal(true)
                                      setOpenOptionsId(null)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteCollection(collection)
                                      setOpenOptionsId(null)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-secondary/50 transition-colors text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}

              {/* Empty Collections */}
              {collections.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FolderPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No collections yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first collection to organize saved activities
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Collection
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* All Saved Tab - Activity Grid */}
          {!loading && activeTab === 'all' && (
            <>
              {/* Collection filter info */}
              {selectedCollectionId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 flex items-center gap-2"
                >
                  <span className="text-sm text-muted-foreground">
                    Showing items in:{' '}
                    <span className="font-medium text-foreground">
                      {collections.find(c => c.id === selectedCollectionId)?.name}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCollectionId(null)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Card className="h-full transition-all duration-300 group relative">
                      {item.activity.thumbnail && (
                        <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
                          <img
                            src={item.activity.thumbnail}
                            alt={item.activity.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-xl transition-colors">
                          {item.activity.title}
                        </CardTitle>
                        {item.activity.description && (
                          <CardDescription className="line-clamp-2">
                            {item.activity.description.replace(/<[^>]*>/g, '')}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                              {item.activity.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {item.activity.play_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => handlePlayActivity(item.activity_id)}
                            disabled={loadingActivityId === item.activity_id}
                          >
                            {loadingActivityId === item.activity_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4" />
                                Play
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUnsaveActivity(item.activity_id, item.collection_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Empty State */}
              {filteredItems.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {savedItems.length === 0
                      ? 'No saved activities yet'
                      : 'No activities found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {savedItems.length === 0
                      ? 'Explore and save activities to find them here'
                      : 'Try adjusting your search'}
                  </p>
                  {savedItems.length === 0 && (
                    <Button asChild>
                      <Link to="/explore">Explore Activities</Link>
                    </Button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Collection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">
                {editingCollection ? 'Edit Collection' : 'Create Collection'}
              </h2>
              <Input
                placeholder="Collection name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCollection(null)
                    setCollectionName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={!collectionName.trim() || savingCollection}
                >
                  {savingCollection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingCollection ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DefaultLayout>
  )
}
