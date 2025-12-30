import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  Lock,
  Mail,
  Play,
  Radio,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import {
  getCurrentMonthAIUsage,
  getTodayAIUsage,
} from '../../server/admin-settings'
import type { ReportStatus } from '../../server/reports'
import {
  checkAdminAccess,
  getAdminDashboardStats,
  getReportStats,
} from '../../server/reports'
import { useAuthStore } from '../../stores/auth-store'

interface DashboardStats {
  users: {
    total: number
    thisWeek: number
  }
  activities: {
    total: number
    public: number
    thisWeek: number
    byType: {
      quiz: number
      quest: number
    }
  }
  plays: {
    total: number
  }
  recentActivities: Array<{
    id: string
    title: string
    thumbnail: string | null
    type: string
    status: string
    play_count: number
    created_at: string
    profiles: {
      display_name: string | null
      avatar_url: string | null
    } | null
  }>
  topActivities: Array<{
    id: string
    title: string
    thumbnail: string | null
    type: string
    play_count: number
    profiles: {
      display_name: string | null
    } | null
  }>
  recentUsers: Array<{
    id: string
    display_name: string | null
    avatar_url: string | null
    created_at: string
  }>
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

const statusIcons: Record<ReportStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  reviewed: <Eye className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  dismissed: <XCircle className="w-4 h-4" />,
}

// Admin Login Form Component
function AdminLoginForm() {
  const { signInWithEmail, signInWithGoogle } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: authError } = await signInWithEmail(email, password)
      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email or password is incorrect')
        } else {
          setError(authError.message)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error: authError } = await signInWithGoogle('/admin')
    if (authError) {
      setError(authError.message)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Login to Admin
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Access Denied Component
function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="text-muted-foreground mb-6">
          บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้า Admin
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { user, isLoading: authLoading, isInitialized } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  )
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [stats, setStats] = useState<{
    pending: number
    reviewed: number
    resolved: number
    dismissed: number
  }>({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
  })
  const [aiUsage, setAiUsage] = useState<{
    requests: number
    tokens: number
    monthName: string
  } | null>(null)
  const [todayUsage, setTodayUsage] = useState<{
    requests: number
    requestsLimit: number
    isFreeTier: boolean
  } | null>(null)

  // Live mode state
  const [liveMode, setLiveMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Check admin access when user changes
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsAdmin(null)
        return
      }
      const { isAdmin: adminStatus } = await checkAdminAccess()
      setIsAdmin(adminStatus)
    }
    checkAccess()
  }, [user])

  // Fetch dashboard stats function (memoized for reuse)
  const fetchDashboardStats = useCallback(async (showLoading = true) => {
    if (showLoading) setDashboardLoading(true)
    setIsRefreshing(true)
    try {
      const data = await getAdminDashboardStats()
      setDashboardStats(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setDashboardLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Fetch report stats function
  const fetchReportStats = useCallback(async () => {
    try {
      const statsData = await getReportStats()
      setStats(statsData.byStatus)
    } catch (error) {
      console.error('Failed to fetch report stats:', error)
    }
  }, [])

  // Fetch AI usage stats function
  const fetchAIUsage = useCallback(async () => {
    try {
      const [usage, today] = await Promise.all([
        getCurrentMonthAIUsage(),
        getTodayAIUsage(),
      ])
      setAiUsage(usage)
      setTodayUsage({
        requests: today.requests,
        requestsLimit: today.requestsLimit,
        isFreeTier: today.isFreeTier,
      })
    } catch (error) {
      console.error('Failed to fetch AI usage:', error)
    }
  }, [])

  // Fetch dashboard stats on mount (only if admin)
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats()
      fetchReportStats()
      fetchAIUsage()
    }
  }, [isAdmin, fetchDashboardStats, fetchReportStats, fetchAIUsage])

  // Live mode: Supabase Realtime subscription
  useEffect(() => {
    if (!liveMode) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    const channel = supabase
      .channel('admin-dashboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchDashboardStats(false)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          fetchDashboardStats(false)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReportStats()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [liveMode, fetchDashboardStats, fetchReportStats])

  // Show loading while auth is initializing or loading
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show login form if not logged in
  if (!user) {
    return <AdminLoginForm />
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return <AccessDenied />
  }

  // Show loading while checking admin status
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Header actions for Live mode toggle & refresh
  const headerActions = (
    <>
      {lastUpdate && (
        <span className="hidden sm:block text-xs text-muted-foreground">
          Updated{' '}
          {lastUpdate.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      )}

      <button
        onClick={() => fetchDashboardStats(false)}
        disabled={isRefreshing}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Refresh stats"
      >
        <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
      </button>

      <button
        onClick={() => {
          const newLiveMode = !liveMode
          setLiveMode(newLiveMode)
          if (newLiveMode) {
            toast.success('Live mode enabled', {
              description:
                'Dashboard will update automatically when data changes',
            })
          } else {
            toast.info('Live mode disabled')
          }
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
          liveMode
            ? 'bg-green-500/20 text-green-500 border border-green-500/30'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent',
        )}
      >
        <Radio className={cn('w-4 h-4', liveMode && 'animate-pulse')} />
        <span className="hidden sm:inline">Live</span>
      </button>
    </>
  )

  return (
    <AdminLayout
      title="Dashboard"
      activeItem="dashboard"
      pendingReportsCount={stats.pending}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        {dashboardLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  {dashboardStats && dashboardStats.users.thisWeek > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />+
                      {dashboardStats.users.thisWeek}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {dashboardStats?.users.total || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Users
                </p>
              </motion.div>

              {/* Total Activities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-500">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  {dashboardStats && dashboardStats.activities.thisWeek > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />+
                      {dashboardStats.activities.thisWeek}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {dashboardStats?.activities.total || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Activities
                </p>
              </motion.div>

              {/* Public Activities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {dashboardStats?.activities.public || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Public Activities
                </p>
              </motion.div>

              {/* Total Plays */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {dashboardStats?.plays.total.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Plays
                </p>
              </motion.div>
            </div>

            {/* Report Stats & Gemini Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Report Status
                  </h3>
                  <Link
                    to="/admin/reports"
                    search={{}}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                  >
                    View all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Pending',
                      value: stats.pending,
                      status: 'pending' as ReportStatus,
                      color: 'bg-amber-500',
                    },
                    {
                      label: 'Reviewed',
                      value: stats.reviewed,
                      status: 'reviewed' as ReportStatus,
                      color: 'bg-blue-500',
                    },
                    {
                      label: 'Resolved',
                      value: stats.resolved,
                      status: 'resolved' as ReportStatus,
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Dismissed',
                      value: stats.dismissed,
                      status: 'dismissed' as ReportStatus,
                      color: 'bg-gray-500',
                    },
                  ].map((stat) => (
                    <Link
                      key={stat.status}
                      to="/admin/reports"
                      search={{ status: stat.status }}
                      className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-center border border-transparent hover:border-border/50"
                    >
                      <div
                        className={cn(
                          'p-2 rounded-xl mx-auto w-fit mb-2',
                          stat.color,
                        )}
                      >
                        <div className="text-white">
                          {statusIcons[stat.status]}
                        </div>
                      </div>
                      <p className="text-xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* AI Usage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      AI Usage
                    </h3>
                    {aiUsage && (
                      <span className="text-xs text-muted-foreground">
                        ({aiUsage.monthName})
                      </span>
                    )}
                  </div>
                  <Link
                    to="/admin/usages"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                  >
                    View details <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xl font-bold text-foreground">
                      {aiUsage?.requests.toLocaleString() || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Requests
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xl font-bold text-foreground">
                      {aiUsage
                        ? aiUsage.tokens >= 1_000_000
                          ? `${(aiUsage.tokens / 1_000_000).toFixed(1)}M`
                          : aiUsage.tokens >= 1_000
                            ? `${(aiUsage.tokens / 1_000).toFixed(1)}K`
                            : aiUsage.tokens.toLocaleString()
                        : 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Tokens</p>
                  </div>
                </div>

                {/* Today's Quota Progress */}
                {todayUsage && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        Today's Quota
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {todayUsage.requests.toLocaleString()} /{' '}
                          {todayUsage.requestsLimit.toLocaleString()}
                        </span>
                        {todayUsage.isFreeTier && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-amber-500/20 text-amber-500">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          todayUsage.requests / todayUsage.requestsLimit > 0.9
                            ? 'bg-red-500'
                            : todayUsage.requests / todayUsage.requestsLimit >
                                0.7
                              ? 'bg-amber-500'
                              : 'bg-purple-500'
                        }`}
                        style={{
                          width: `${Math.min((todayUsage.requests / todayUsage.requestsLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Top 5 Activities, Recent Activities, Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top 5 Activities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Top 5 Activities
                    </h3>
                  </div>
                  <Link
                    to="/admin/activities"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                  >
                    View all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {dashboardStats?.topActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No activities yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboardStats?.topActivities.map((activity, index) => (
                      <a
                        key={activity.id}
                        href={`/activity/play/${activity.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <span
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                            index === 0
                              ? 'bg-amber-500 text-white'
                              : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.play_count} plays
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Activities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Recent Activities
                    </h3>
                  </div>
                  <Link
                    to="/admin/activities"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                  >
                    View all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {dashboardStats?.recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No activities yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboardStats?.recentActivities.map((activity) => (
                      <a
                        key={activity.id}
                        href={`/activity/play/${activity.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString(
                              'th-TH',
                              { day: 'numeric', month: 'short' },
                            )}{' '}
                            {new Date(activity.created_at).toLocaleTimeString(
                              'th-TH',
                              { hour: '2-digit', minute: '2-digit' },
                            )}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-lg shrink-0 font-medium',
                            activity.status === 'public'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : activity.status === 'draft'
                                ? 'bg-gray-500/20 text-gray-400'
                                : 'bg-blue-500/20 text-blue-500',
                          )}
                        >
                          {activity.status}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Recent Users
                    </h3>
                  </div>
                  <Link
                    to="/admin/users"
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                  >
                    View all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {dashboardStats?.recentUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboardStats?.recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-border/50"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 ring-2 ring-border/50">
                            <Users className="w-4 h-4 text-emerald-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {user.display_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString(
                              'th-TH',
                              { day: 'numeric', month: 'short' },
                            )}{' '}
                            {new Date(user.created_at).toLocaleTimeString(
                              'th-TH',
                              { hour: '2-digit', minute: '2-digit' },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
