import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Edit2,
  Loader2,
  LogOut,
  Play,
  Save,
  Trash2,
  Trophy,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { ImageInput } from '../components/ui/image-input'
import { Input } from '../components/ui/input'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../stores/auth-store'
import { useProfileStore } from '../stores/profile-store'
import { getUserStats, type UserStats } from '../server/activities'
import { DefaultLayout } from '../components/layouts/DefaultLayout'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, signOut, isInitialized } = useAuthStore()
  const { profile, fetchProfile, updateProfile, isLoading: profileLoading } = useProfileStore()

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Redirect if not logged in (only after auth is initialized)
  useEffect(() => {
    if (isInitialized && !user) {
      navigate({ to: '/login' })
    }
  }, [user, navigate, isInitialized])

  // Load profile and stats
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      // Load profile
      await fetchProfile(user.id)

      // Load stats
      setStatsLoading(true)
      try {
        const userStats = await getUserStats()
        setStats(userStats)
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    loadData()
  }, [user, fetchProfile])

  // Sync edit form with profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await updateProfile(user.id, {
        display_name: displayName || undefined,
        avatar_url: avatarUrl || undefined,
      })

      if (error) {
        toast.error('Failed to update profile')
      } else {
        toast.success('Profile updated!')
        setIsEditing(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile</CardTitle>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setDisplayName(profile?.display_name || '')
                        setAvatarUrl(profile?.avatar_url || '')
                      }}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Avatar
                    </label>
                    <ImageInput
                      value={avatarUrl}
                      onChange={setAvatarUrl}
                      placeholder="Add avatar"
                      aspectRatio="square"
                      className="w-24 h-24"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Display Name
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Email
                    </label>
                    <Input value={user.email || ''} disabled className="bg-muted" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {profile?.display_name || 'No name set'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {profile?.created_at ? formatDate(profile.created_at) : 'recently'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Activity Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <div className="text-2xl font-bold text-primary">
                      {stats.totalActivitiesPlayed}
                    </div>
                    <div className="text-xs text-muted-foreground">Activities Played</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                    <div className="text-2xl font-bold text-emerald-500">
                      {stats.completedActivities}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-500/10">
                    <div className="text-2xl font-bold text-amber-500">
                      {stats.totalScore.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Score</div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No activity data yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest plays</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats && stats.recentPlays.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentPlays.map((play) => (
                    <Link
                      key={play.id}
                      to="/activity/play/$id"
                      params={{ id: play.activity_id }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                        {play.activity_thumbnail ? (
                          <img
                            src={play.activity_thumbnail}
                            alt={play.activity_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Play className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {play.activity_title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(play.played_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {play.completed && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {play.score !== null && (
                          <div className="text-sm font-medium text-primary">
                            {play.score} pts
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {/* View All Results Link */}
                  <Link
                    to="/activity/results"
                    className="flex items-center justify-center gap-2 p-3 rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium"
                  >
                    View All Results
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity. Start playing to see your history!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                {t('profile.deleteAccount.title')}
              </CardTitle>
              <CardDescription>
                {t('profile.deleteAccount.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" asChild>
                <Link to="/delete-account">
                  <Trash2 className="w-4 h-4" />
                  {t('profile.deleteAccount.button')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </div>
    </DefaultLayout>
  )
}
