import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  EyeOff,
  Globe,
  GraduationCap,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Map,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { ConfirmModal } from '../../components/ui/confirm-modal'
import { cn } from '../../lib/utils'
import { deleteActivity, getUserActivities } from '../../server/activities'
import { useAuthStore } from '../../stores/auth-store'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'

export const Route = createFileRoute('/activity/me')({
  component: MyActivitiesPage,
})

type TabType = 'all' | 'quiz' | 'quest' | 'flashcard'

const tabs: { type: TabType; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All', icon: LayoutGrid },
  { type: 'quiz', label: 'Quiz', icon: GraduationCap },
  { type: 'quest', label: 'Quest', icon: Map },
  { type: 'flashcard', label: 'Flashcard', icon: BookOpen },
]

import type { ActivityStatus } from '../../types/database'

interface ActivityItem {
  id: string
  created_at: string
  title: string
  status: ActivityStatus
  play_count: number
  stages: { id: string; title: string }[]
}

function MyActivitiesPage() {
  const navigate = useNavigate()
  const { user, session, isLoading: isAuthLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && session) {
      loadActivities()
    }
  }, [isAuthLoading, session])

  const loadActivities = async () => {
    setIsLoading(true)
    try {
      const data = await getUserActivities()
      setActivities(data || [])
    } catch (error) {
      toast.error('Failed to load your activities')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await deleteActivity({
        data: { activityId: deleteId },
      })
      setActivities((prev) => prev.filter((c) => c.id !== deleteId))
      toast.success('Deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete')
    } finally {
      setIsDeleting(false)
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
              Please login to view your activities
            </p>
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter activities based on active tab
  const filteredActivities = activities.filter((activity) => {
    if (activeTab === 'all') return true
    // For now, all are quizzes/quests - flashcard coming soon
    if (activeTab === 'flashcard') return false
    // Determine type by number of stages
    const isQuest = activity.stages.length > 1
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

  const deletingActivity = activities.find((c) => c.id === deleteId)

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Activities</h1>
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
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
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
        ) : filteredActivities.length === 0 ? (
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
                : 'No activities yet'}
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
              {filteredActivities.map((activity, index) => {
                const isQuest = activity.stages.length > 1
                return (
                  <motion.div
                    key={activity.id}
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
                                  : 'bg-blue-500/20 text-blue-500',
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
                              activity.status === 'public'
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : activity.status === 'link'
                                  ? 'bg-blue-500/20 text-blue-500'
                                  : activity.status === 'private_group'
                                    ? 'bg-amber-500/20 text-amber-500'
                                    : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {activity.status === 'public' ? (
                              <>
                                <Globe className="w-3 h-3" />
                                Public
                              </>
                            ) : activity.status === 'link' ? (
                              <>
                                <Link2 className="w-3 h-3" />
                                Link
                              </>
                            ) : activity.status === 'private_group' ? (
                              <>
                                <Users className="w-3 h-3" />
                                Group
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Draft
                              </>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-3">
                          {activity.title}
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(activity.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {activity.play_count} plays
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
                              to="/activity/edit/$id"
                              params={{ id: activity.id }}
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button size="sm" className="flex-1" asChild>
                            <Link
                              to="/activity/play/$id"
                              params={{ id: activity.id }}
                            >
                              <Play className="w-4 h-4" />
                              Play
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(activity.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Delete Confirm Modal */}
        <ConfirmModal
          open={deleteId !== null}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Activity"
          description={`Are you sure you want to delete "${deletingActivity?.title || 'this activity'}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      </div>
    </DefaultLayout>
  )
}
