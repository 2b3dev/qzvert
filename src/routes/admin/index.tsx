import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Flag,
  Loader2,
  Play,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  getAdminDashboardStats,
  getReportStats,
  getReports,
} from '../../server/reports'
import type {
  ReportReason,
  ReportStatus,
  ReportWithContent,
} from '../../server/reports'

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
}

export const Route = createFileRoute('/admin/')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminDashboard,
})

const reasonLabels: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate',
  spam: 'Spam',
  copyright: 'Copyright',
  misinformation: 'Misinformation',
  harassment: 'Harassment',
  other: 'Other',
}

const statusColors: Record<ReportStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-500',
  reviewed: 'bg-blue-500/20 text-blue-500',
  resolved: 'bg-green-500/20 text-green-500',
  dismissed: 'bg-gray-500/20 text-gray-400',
}

const statusIcons: Record<ReportStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  reviewed: <Eye className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  dismissed: <XCircle className="w-4 h-4" />,
}

function AdminDashboard() {
  const [reports, setReports] = useState<Array<ReportWithContent>>([])
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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  // Live mode state
  const [liveMode, setLiveMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

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

  // Fetch reports and stats function (memoized for reuse)
  const fetchReportsAndStats = useCallback(async () => {
    try {
      const statsData = await getReportStats()
      setStats(statsData.byStatus)
    } catch (error) {
      console.error('Failed to fetch report stats:', error)
    }
  }, [])

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

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
          fetchDashboardStats(false)
          fetchReportsAndStats()
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
  }, [liveMode, fetchDashboardStats, fetchReportsAndStats])

  // Fetch reports and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [reportsData, statsData] = await Promise.all([
          getReports({ data: {} }),
          getReportStats(),
        ])
        setReports(reportsData.reports)
        setStats(statsData.byStatus)
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  {dashboardStats && dashboardStats.users.thisWeek > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <TrendingUp className="w-3 h-3" />+
                      {dashboardStats.users.thisWeek}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardStats?.users.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>

              {/* Total Activities */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  {dashboardStats && dashboardStats.activities.thisWeek > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <TrendingUp className="w-3 h-3" />+
                      {dashboardStats.activities.thisWeek}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardStats?.activities.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Activities
                </p>
              </div>

              {/* Public Activities */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Sparkles className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardStats?.activities.public || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Public Activities
                </p>
              </div>

              {/* Total Plays */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Play className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {dashboardStats?.plays.total.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Plays</p>
              </div>
            </div>

            {/* Activity Types & Reports Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Types */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Activity Types
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">Quizzes</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      {dashboardStats?.activities.byType.quiz || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-foreground">Quests</span>
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      {dashboardStats?.activities.byType.quest || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Stats */}
              <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Report Status
                  </h3>
                  <Link
                    to="/admin/reports"
                    search={{}}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
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
                    },
                    {
                      label: 'Reviewed',
                      value: stats.reviewed,
                      status: 'reviewed' as ReportStatus,
                    },
                    {
                      label: 'Resolved',
                      value: stats.resolved,
                      status: 'resolved' as ReportStatus,
                    },
                    {
                      label: 'Dismissed',
                      value: stats.dismissed,
                      status: 'dismissed' as ReportStatus,
                    },
                  ].map((stat) => (
                    <Link
                      key={stat.status}
                      to="/admin/reports"
                      search={{ status: stat.status }}
                      className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-center"
                    >
                      <div
                        className={cn(
                          'p-1.5 rounded-lg mx-auto w-fit mb-2',
                          statusColors[stat.status],
                        )}
                      >
                        {statusIcons[stat.status]}
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Top & Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Activities */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Top Activities
                  </h3>
                </div>
                {dashboardStats?.topActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No activities yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.topActivities.map((activity, index) => (
                      <a
                        key={activity.id}
                        href={`/activity/play/${activity.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
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
                        {activity.thumbnail ? (
                          <img
                            src={activity.thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.profiles?.display_name || 'Anonymous'} •{' '}
                            {activity.play_count} plays
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            activity.type === 'quiz'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-orange-500/20 text-orange-500',
                          )}
                        >
                          {activity.type}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activities */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Recent Activities
                  </h3>
                </div>
                {dashboardStats?.recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No activities yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.recentActivities.map((activity) => (
                      <a
                        key={activity.id}
                        href={`/activity/play/${activity.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        {activity.thumbnail ? (
                          <img
                            src={activity.thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.profiles?.display_name || 'Anonymous'} •{' '}
                            {new Date(activity.created_at).toLocaleDateString(
                              'th-TH',
                              { day: 'numeric', month: 'short' },
                            )}{' '}
                            • {activity.play_count} plays
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              activity.status === 'public'
                                ? 'bg-green-500/20 text-green-500'
                                : activity.status === 'draft'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : 'bg-blue-500/20 text-blue-500',
                            )}
                          >
                            {activity.status}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reports Preview */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-destructive" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Recent Reports
                  </h3>
                </div>
                <Link
                  to="/admin/reports"
                  search={{}}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : reports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reports yet
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 3).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div
                        className={cn(
                          'p-1.5 rounded-lg',
                          statusColors[report.status],
                        )}
                      >
                        {statusIcons[report.status]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {report.content?.title || 'Unknown Activity'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reasonLabels[report.reason]} •{' '}
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
