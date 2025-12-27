import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  AlertTriangle,
  Shield,
  Ban,
  FileWarning,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Filter,
  ChevronDown,
  ExternalLink,
  Loader2,
  MessageSquare,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Menu,
  X,
  Home,
  Play,
  TrendingUp,
  Sparkles,
  BookOpen,
  Trophy,
  ArrowUpRight,
  Radio,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import {
  checkAdminAccess,
  getReports,
  getReportStats,
  getAdminDashboardStats,
  updateReportStatus,
  type ReportWithActivity,
  type ReportStatus,
  type ReportReason
} from '../server/reports'

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

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    // Check if user is admin on server side
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminDashboard,
})

// Sidebar navigation items
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'users', label: 'Users', icon: Users, disabled: true },
  { id: 'activities', label: 'Activities', icon: FileText, disabled: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, disabled: true },
  { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
]

const reasonIcons: Record<ReportReason, React.ReactNode> = {
  inappropriate: <AlertTriangle className="w-4 h-4" />,
  spam: <Ban className="w-4 h-4" />,
  copyright: <Shield className="w-4 h-4" />,
  misinformation: <FileWarning className="w-4 h-4" />,
  harassment: <Flag className="w-4 h-4" />,
  other: <AlertTriangle className="w-4 h-4" />,
}

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
  const [activeSection, setActiveSection] = useState<string>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reports, setReports] = useState<ReportWithActivity[]>([])
  const [stats, setStats] = useState<{ pending: number; reviewed: number; resolved: number; dismissed: number }>({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
  })
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportWithActivity | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

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
      setStats(statsData)
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
      // Clean up subscription when live mode is off
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    // Create realtime subscription
    const channel = supabase
      .channel('admin-dashboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log('[Live] profiles changed')
          fetchDashboardStats(false)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities' },
        () => {
          console.log('[Live] activities changed')
          fetchDashboardStats(false)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          console.log('[Live] reports changed')
          fetchDashboardStats(false)
          fetchReportsAndStats()
        }
      )
      .subscribe((status) => {
        console.log('[Live] Subscription status:', status)
      })

    channelRef.current = channel

    // Cleanup on unmount or when live mode changes
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
          getReports({ data: { status: statusFilter === 'all' ? undefined : statusFilter } }),
          getReportStats(),
        ])
        setReports(reportsData.reports)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [statusFilter])

  const handleStatusUpdate = async (reportId: string, newStatus: ReportStatus) => {
    setUpdatingStatus(reportId)
    try {
      await updateReportStatus({
        data: {
          reportId,
          status: newStatus,
          adminNotes: adminNotes || undefined,
        },
      })

      // Update local state
      setReports(prev =>
        prev.map(r =>
          r.id === reportId ? { ...r, status: newStatus, admin_notes: adminNotes || null } : r
        )
      )

      // Update stats
      setStats(prev => {
        const report = reports.find(r => r.id === reportId)
        if (!report) return prev

        return {
          ...prev,
          [report.status]: Math.max(0, prev[report.status] - 1),
          [newStatus]: prev[newStatus] + 1,
        }
      })

      setSelectedReport(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    setActiveSection(item.id)
                    setSidebarOpen(false)
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground'
                    : item.disabled
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                )}
                {item.id === 'reports' && stats.pending > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <Home className="w-5 h-5" />
              <span>Back to Site</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">
                {sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
            </div>

            {/* Live Mode Toggle & Refresh (only show on dashboard) */}
            {activeSection === 'dashboard' && (
              <div className="flex items-center gap-3">
                {/* Last Update Time */}
                {lastUpdate && (
                  <span className="hidden sm:block text-xs text-muted-foreground">
                    Updated {lastUpdate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}

                {/* Manual Refresh Button */}
                <button
                  onClick={() => fetchDashboardStats(false)}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  title="Refresh stats"
                >
                  <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                </button>

                {/* Live Mode Toggle */}
                <button
                  onClick={() => {
                    const newLiveMode = !liveMode
                    setLiveMode(newLiveMode)
                    if (newLiveMode) {
                      toast.success('Live mode enabled', {
                        description: 'Dashboard will update automatically when data changes',
                      })
                    } else {
                      toast.info('Live mode disabled')
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    liveMode
                      ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                  )}
                >
                  <Radio className={cn('w-4 h-4', liveMode && 'animate-pulse')} />
                  <span className="hidden sm:inline">Live</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {/* Dashboard View */}
          {activeSection === 'dashboard' && (
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
                            <TrendingUp className="w-3 h-3" />
                            +{dashboardStats.users.thisWeek}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-foreground">{dashboardStats?.users.total || 0}</p>
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
                            <TrendingUp className="w-3 h-3" />
                            +{dashboardStats.activities.thisWeek}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-foreground">{dashboardStats?.activities.total || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Activities</p>
                    </div>

                    {/* Public Activities */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Sparkles className="w-5 h-5 text-green-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{dashboardStats?.activities.public || 0}</p>
                      <p className="text-sm text-muted-foreground">Public Activities</p>
                    </div>

                    {/* Total Plays */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <Play className="w-5 h-5 text-amber-500" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{dashboardStats?.plays.total.toLocaleString() || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Plays</p>
                    </div>
                  </div>

                  {/* Activity Types & Reports Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Activity Types */}
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity Types</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/20">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-foreground">Quizzes</span>
                          </div>
                          <span className="text-xl font-bold text-foreground">{dashboardStats?.activities.byType.quiz || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                              <BookOpen className="w-4 h-4 text-orange-500" />
                            </div>
                            <span className="text-foreground">Quests</span>
                          </div>
                          <span className="text-xl font-bold text-foreground">{dashboardStats?.activities.byType.quest || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Report Stats */}
                    <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Report Status</h3>
                        <button
                          onClick={() => setActiveSection('reports')}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View all <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Pending', value: stats.pending, status: 'pending' as ReportStatus },
                          { label: 'Reviewed', value: stats.reviewed, status: 'reviewed' as ReportStatus },
                          { label: 'Resolved', value: stats.resolved, status: 'resolved' as ReportStatus },
                          { label: 'Dismissed', value: stats.dismissed, status: 'dismissed' as ReportStatus },
                        ].map((stat) => (
                          <button
                            key={stat.status}
                            onClick={() => {
                              setStatusFilter(stat.status)
                              setActiveSection('reports')
                            }}
                            className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-center"
                          >
                            <div className={cn('p-1.5 rounded-lg mx-auto w-fit mb-2', statusColors[stat.status])}>
                              {statusIcons[stat.status]}
                            </div>
                            <p className="text-lg font-bold text-foreground">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </button>
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
                        <h3 className="text-lg font-semibold text-foreground">Top Activities</h3>
                      </div>
                      {dashboardStats?.topActivities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No activities yet</p>
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
                              <span className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                index === 0 ? 'bg-amber-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-700 text-white' :
                                'bg-muted text-muted-foreground'
                              )}>
                                {index + 1}
                              </span>
                              {activity.thumbnail ? (
                                <img src={activity.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate text-sm">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.profiles?.display_name || 'Anonymous'} • {activity.play_count} plays
                                </p>
                              </div>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                activity.type === 'quiz' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-500'
                              )}>
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
                        <h3 className="text-lg font-semibold text-foreground">Recent Activities</h3>
                      </div>
                      {dashboardStats?.recentActivities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No activities yet</p>
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
                                <img src={activity.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate text-sm">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.profiles?.display_name || 'Anonymous'} • {new Date(activity.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  activity.status === 'public' ? 'bg-green-500/20 text-green-500' :
                                  activity.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-blue-500/20 text-blue-500'
                                )}>
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
                        <h3 className="text-lg font-semibold text-foreground">Recent Reports</h3>
                      </div>
                      <button
                        onClick={() => setActiveSection('reports')}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View all <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : reports.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No reports yet</p>
                    ) : (
                      <div className="space-y-3">
                        {reports.slice(0, 3).map((report) => (
                          <div
                            key={report.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <div className={cn('p-1.5 rounded-lg', statusColors[report.status])}>
                              {statusIcons[report.status]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {report.activities?.title || 'Unknown Activity'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {reasonLabels[report.reason]} • {formatDate(report.created_at)}
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
          )}

          {/* Reports View */}
          {activeSection === 'reports' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex items-center justify-between">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>{statusFilter === 'all' ? 'All Reports' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showFilterMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-10"
                      >
                        <button
                          onClick={() => {
                            setStatusFilter('all')
                            setShowFilterMenu(false)
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors',
                            statusFilter === 'all' && 'text-primary'
                          )}
                        >
                          All Reports
                        </button>
                        {(['pending', 'reviewed', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setStatusFilter(status)
                              setShowFilterMenu(false)
                            }}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2',
                              statusFilter === status && 'text-primary'
                            )}
                          >
                            {statusIcons[status]}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-sm text-muted-foreground">
                  {reports.length} report{reports.length !== 1 && 's'}
                </p>
              </div>

              {/* Reports List */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-16">
                  <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">No reports found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Report Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn('p-1.5 rounded-lg', statusColors[report.status])}>
                                {statusIcons[report.status]}
                              </div>
                              <span className={cn('text-sm font-medium', statusColors[report.status].split(' ')[1])}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                {reasonIcons[report.reason]}
                                <span className="text-sm">{reasonLabels[report.reason]}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                              {report.activities?.thumbnail && (
                                <img
                                  src={report.activities.thumbnail}
                                  alt=""
                                  className="w-16 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {report.activities?.title || 'Unknown Activity'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Reported {formatDate(report.created_at)}
                                </p>
                              </div>
                            </div>

                            {report.additional_info && (
                              <div className="bg-muted/30 rounded-lg p-3 mb-3">
                                <p className="text-sm text-muted-foreground flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                                  {report.additional_info}
                                </p>
                              </div>
                            )}

                            {report.admin_notes && (
                              <div className="bg-primary/10 rounded-lg p-3">
                                <p className="text-sm text-primary flex items-start gap-2">
                                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span><strong>Admin notes:</strong> {report.admin_notes}</span>
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <a
                              href={`/activity/play/${report.activity_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View
                            </a>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report)
                                setAdminNotes(report.admin_notes || '')
                              }}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Update Status Modal */}
        <AnimatePresence>
          {selectedReport && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReport(null)}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
              >
                <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden mx-4">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Update Report Status</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReport.activities?.title || 'Unknown Activity'}
                    </p>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Admin Notes (optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this report..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Set Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['pending', 'reviewed', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
                          <Button
                            key={status}
                            variant={selectedReport.status === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusUpdate(selectedReport.id, status)}
                            disabled={updatingStatus === selectedReport.id}
                            className="justify-start"
                          >
                            {updatingStatus === selectedReport.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <span className="mr-2">{statusIcons[status]}</span>
                            )}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/30">
                    <Button variant="ghost" onClick={() => setSelectedReport(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
