import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownAZ,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Flame,
  Loader2,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { ActivityOptionsDropdown } from '../components/ui/ActivityOptionsDropdown'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ReportModal } from '../components/ui/ReportModal'
import { SaveToCollectionModal } from '../components/ui/SaveToCollectionModal'
import { cn } from '../lib/utils'
import { getActivityById, getPublishedActivities } from '../server/activities'
import { unsaveActivity } from '../server/saved'
import { useActivityStore } from '../stores/activity-store'
import { useAuthStore } from '../stores/auth-store'

export const Route = createFileRoute('/explore')({
  component: ExplorePage,
})

interface ExploreActivity {
  id: string
  created_at: string
  user_id: string | null
  title: string
  description: string | null
  thumbnail: string | null
  type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
  theme_config: unknown
  play_count: number
  stages: Array<{ id: string; title: string; order_index: number }>
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

type ActivityType = 'all' | 'quiz' | 'quest' | 'lesson' | 'flashcard' | 'roleplay'
type SortOption = 'newest' | 'oldest' | 'popular' | 'alphabetical'

const sortOptions: Array<{
  value: SortOption
  label: string
  icon: React.ReactNode
}> = [
  { value: 'newest', label: 'Newest', icon: <Clock className="w-4 h-4" /> },
  { value: 'oldest', label: 'Oldest', icon: <Clock className="w-4 h-4" /> },
  {
    value: 'popular',
    label: 'Most Popular',
    icon: <Flame className="w-4 h-4" />,
  },
  {
    value: 'alphabetical',
    label: 'A-Z',
    icon: <ArrowDownAZ className="w-4 h-4" />,
  },
]

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedType, setSelectedType] = useState<ActivityType>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [activities, setActivities] = useState<Array<ExploreActivity>>([])
  const [loading, setLoading] = useState(true)
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [openOptionsId, setOpenOptionsId] = useState<string | null>(null)
  // Track saved activities: { activityId: collectionId }
  const [savedActivities, setSavedActivities] = useState<Record<string, string>>({})
  const { user } = useAuthStore()
  // Save modal state
  const [saveModalActivityId, setSaveModalActivityId] = useState<string | null>(null)
  // Report modal state
  const [reportActivity, setReportActivity] = useState<{ id: string; title: string } | null>(null)

  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { setActivity, setThemeConfig } = useActivityStore()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSortDropdown(false)
      }
      // Close options dropdown if clicking outside any options dropdown
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

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true)
        const data = await getPublishedActivities()
        setActivities(data || [])
      } catch (err) {
        console.error('Failed to fetch activities:', err)
        setError('Failed to load activities. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const filteredActivities = activities.filter((activity) => {
    // Filter by search query
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase())
    // Filter by type
    const matchesType = selectedType === 'all' || activity.type === selectedType
    return matchesSearch && matchesType
  })

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
      setError('Failed to load activity. Please try again.')
    } finally {
      setLoadingActivityId(null)
    }
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
              <Compass className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-black text-foreground">
                Explore Quests
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Discover learning adventures created by the community
            </p>
          </motion.div>

          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter Buttons */}
              {(['all', 'quiz', 'quest', 'lesson', 'flashcard', 'roleplay'] as const).map(
                (type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ),
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Search Button & Input */}
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

                {/* Sort Dropdown */}
                <div ref={sortDropdownRef} className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="gap-1"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform',
                        showSortDropdown && 'rotate-180',
                      )}
                    />
                  </Button>

                  <AnimatePresence>
                    {showSortDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 z-50 min-w-[160px] p-1 rounded-lg border border-border bg-background shadow-lg"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSortBy(option.value)
                              setShowSortDropdown(false)
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left',
                              'hover:bg-secondary/50 transition-colors',
                              sortBy === option.value && 'bg-secondary/70',
                            )}
                          >
                            {option.icon}
                            <span>{option.label}</span>
                            {sortBy === option.value && (
                              <Check className="w-4 h-4 ml-auto text-primary" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
              <p className="text-muted-foreground">Loading quests...</p>
            </motion.div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-destructive mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Quest Grid */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="h-full transition-all duration-300 group relative">
                    {activity.thumbnail && (
                      <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
                        <img
                          src={activity.thumbnail}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-xl transition-colors">
                        {activity.title}
                      </CardTitle>
                      {activity.description && (
                        <CardDescription className="line-clamp-2">
                          {activity.description.replace(/<[^>]*>/g, '')}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                            {activity.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {activity.play_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {activity.profiles && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          {activity.profiles.avatar_url ? (
                            <img
                              src={activity.profiles.avatar_url}
                              alt={activity.profiles.display_name || 'Creator'}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                              {(activity.profiles.display_name || 'A')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="truncate">
                            {activity.profiles.display_name || 'Anonymous'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => handlePlayActivity(activity.id)}
                          disabled={loadingActivityId === activity.id}
                        >
                          {loadingActivityId === activity.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4" />
                              Play
                            </>
                          )}
                        </Button>
                        {/* Options Dropdown */}
                        <ActivityOptionsDropdown
                          activityId={activity.id}
                          activityTitle={activity.title}
                          isOpen={openOptionsId === activity.id}
                          onToggle={() => setOpenOptionsId(openOptionsId === activity.id ? null : activity.id)}
                          onClose={() => setOpenOptionsId(null)}
                          isSaved={!!savedActivities[activity.id]}
                          onSave={!savedActivities[activity.id] ? () => {
                            if (!user) {
                              toast.error('Please login to save')
                              return
                            }
                            setSaveModalActivityId(activity.id)
                          } : undefined}
                          onUnsave={savedActivities[activity.id] ? async () => {
                            try {
                              await unsaveActivity({ data: { activityId: activity.id, collectionId: savedActivities[activity.id] } })
                              setSavedActivities(prev => {
                                const next = { ...prev }
                                delete next[activity.id]
                                return next
                              })
                              toast.success('Removed from saved')
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Failed')
                            }
                          } : undefined}
                          onShare={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/activity/play/${activity.id}`)
                            toast.success('Link copied!')
                          }}
                          onReport={() => setReportActivity({ id: activity.id, title: activity.title })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredActivities.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {activities.length === 0
                  ? 'No activities yet'
                  : 'No activities found'}
              </h3>
              <p className="text-muted-foreground">
                {activities.length === 0
                  ? 'Be the first to create and publish an activity!'
                  : 'Try adjusting your search filters'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Save to Collection Modal */}
      <SaveToCollectionModal
        isOpen={saveModalActivityId !== null}
        onClose={() => setSaveModalActivityId(null)}
        activityId={saveModalActivityId || ''}
        onSaved={(collectionId, collectionName) => {
          if (saveModalActivityId) {
            setSavedActivities(prev => ({ ...prev, [saveModalActivityId]: collectionId }))
            toast.success(`Saved to "${collectionName}"`)
          }
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportActivity !== null}
        onClose={() => setReportActivity(null)}
        activityId={reportActivity?.id || ''}
        activityTitle={reportActivity?.title}
        onReported={() => {
          toast.success('Report submitted')
        }}
      />
    </DefaultLayout>
  )
}
