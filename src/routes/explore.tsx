import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Search, Compass, BookOpen, Clock, Users, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { getPublishedCreations, getCreationById } from '../server/creations'
import { useCreationStore } from '../stores/creation-store'

export const Route = createFileRoute('/explore')({
  component: ExplorePage
})

interface ExploreQuest {
  id: string
  created_at: string
  user_id: string | null
  title: string
  theme_config: unknown
  play_count: number
  stages: { id: string; title: string; order_index: number }[]
}

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [quests, setQuests] = useState<ExploreQuest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingQuestId, setLoadingQuestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { setCreation, setThemeConfig } = useCreationStore()

  useEffect(() => {
    async function fetchQuests() {
      try {
        setLoading(true)
        const data = await getPublishedCreations()
        setQuests(data || [])
      } catch (err) {
        console.error('Failed to fetch quests:', err)
        setError('Failed to load quests. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchQuests()
  }, [])

  const filteredQuests = quests.filter(quest =>
    quest.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePlayQuest = async (questId: string) => {
    try {
      setLoadingQuestId(questId)
      const { generatedQuest, themeConfig } = await getCreationById({ data: { creationId: questId } })
      setCreation(generatedQuest, undefined, questId)
      setThemeConfig(themeConfig)
      navigate({ to: '/creation/$id/preview', params: { id: questId } })
    } catch (err) {
      console.error('Failed to load quest:', err)
      setError('Failed to load quest. Please try again.')
    } finally {
      setLoadingQuestId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background py-8 px-6">
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

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search quests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <Button variant="default" asChild>
              <Link to="/">
                <Sparkles className="w-4 h-4" />
                Create New Quest
              </Link>
            </Button>
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
            {filteredQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="h-full hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {quest.title}
                        </CardTitle>
                      </div>
                      <BookOpen className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <CardDescription className="line-clamp-2">
                      {quest.stages.length} stages of learning adventure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {quest.stages.length} stages
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {quest.play_count.toLocaleString()}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(quest.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePlayQuest(quest.id)}
                      disabled={loadingQuestId === quest.id}
                    >
                      {loadingQuestId === quest.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Start Quest
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredQuests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {quests.length === 0 ? 'No quests yet' : 'No quests found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {quests.length === 0
                ? 'Be the first to create and publish a quest!'
                : 'Try adjusting your search or create a new quest'
              }
            </p>
            <Button asChild>
              <Link to="/">
                <Sparkles className="w-4 h-4" />
                Create New Quest
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
