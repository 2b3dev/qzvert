import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  GraduationCap,
  Map,
  BookOpen,
  LayoutGrid,
  Loader2,
  Play,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Globe,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '../stores/auth-store'
import { getUserCreations, deleteCreation } from '../server/creations'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { cn } from '../lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/creator')({
  component: CreatorPage,
})

type TabType = 'all' | 'quiz' | 'quest' | 'flashcard'

const tabs: { type: TabType; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All', icon: LayoutGrid },
  { type: 'quiz', label: 'Quiz', icon: GraduationCap },
  { type: 'quest', label: 'Quest', icon: Map },
  { type: 'flashcard', label: 'Flashcard', icon: BookOpen },
]

interface QuestItem {
  id: string
  created_at: string
  title: string
  is_published: boolean
  play_count: number
  stages: { id: string; title: string }[]
}

function CreatorPage() {
  const navigate = useNavigate()
  const { user, session, isLoading: isAuthLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && session) {
      loadQuests()
    }
  }, [isAuthLoading, session])

  const loadQuests = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const data = await getUserCreations({ data: { accessToken: session.access_token } })
      setQuests(data || [])
    } catch (error) {
      toast.error('Failed to load your creations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (questId: string) => {
    if (!session) return

    setDeletingId(questId)
    try {
      await deleteCreation({ data: { creationId: questId, accessToken: session.access_token } })
      setQuests((prev) => prev.filter((q) => q.id !== questId))
      toast.success('Deleted successfully')
    } catch (error) {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  // Auth gate
  if (!isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Login Required
            </h2>
            <p className="text-muted-foreground mb-6">
              Please login to view your creations
            </p>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter quests based on active tab
  const filteredQuests = quests.filter((quest) => {
    if (activeTab === 'all') return true
    // For now, all are quizzes/quests - flashcard coming soon
    if (activeTab === 'flashcard') return false
    // Determine type by number of stages
    const isQuest = quest.stages.length > 1
    if (activeTab === 'quest') return isQuest
    if (activeTab === 'quiz') return !isQuest
    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Creations</h1>
            <p className="text-muted-foreground mt-1">
              Manage your quizzes, quests, and flashcards
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <Plus className="w-4 h-4" />
              Create New
            </Link>
          </Button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {tabs.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
                activeTab === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {isLoading || isAuthLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredQuests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {activeTab === 'all' ? (
                <LayoutGrid className="w-8 h-8 text-muted-foreground" />
              ) : activeTab === 'quiz' ? (
                <GraduationCap className="w-8 h-8 text-muted-foreground" />
              ) : activeTab === 'quest' ? (
                <Map className="w-8 h-8 text-muted-foreground" />
              ) : (
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activeTab === 'flashcard'
                ? 'Flashcards coming soon!'
                : 'No creations yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'flashcard'
                ? 'This feature is under development'
                : 'Start by creating your first quiz or quest'}
            </p>
            {activeTab !== 'flashcard' && (
              <Button asChild>
                <Link to="/">
                  <Plus className="w-4 h-4" />
                  Create Now
                </Link>
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredQuests.map((quest, index) => {
                const isQuest = quest.stages.length > 1
                return (
                  <motion.div
                    key={quest.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group hover:border-primary/50 transition-all duration-200">
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                isQuest
                                  ? 'bg-purple-500/20 text-purple-500'
                                  : 'bg-blue-500/20 text-blue-500'
                              )}
                            >
                              {isQuest ? (
                                <Map className="w-4 h-4" />
                              ) : (
                                <GraduationCap className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {isQuest ? 'Quest' : 'Quiz'}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                              quest.is_published
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {quest.is_published ? (
                              <>
                                <Globe className="w-3 h-3" />
                                Published
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                Draft
                              </>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-3">
                          {quest.title}
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(quest.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {quest.play_count} plays
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link
                              to="/creation/$id/edit"
                              params={{ id: quest.id }}
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button size="sm" className="flex-1" asChild>
                            <Link to="/creation/$id/preview" params={{ id: quest.id }}>
                              <Play className="w-4 h-4" />
                              Play
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(quest.id)}
                            disabled={deletingId === quest.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === quest.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
