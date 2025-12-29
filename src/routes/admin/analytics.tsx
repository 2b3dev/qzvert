import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  GraduationCap,
  Loader2,
  Map,
  Play,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  getActivityGrowthData,
  getActivityStatusDistribution,
  getActivityTypeDistribution,
  getOverviewStats,
  getTopActivities,
  getTopCreators,
  getUserGrowthData,
  getUserRoleDistribution,
  type GrowthDataPoint,
  type OverviewStats,
  type RoleDistribution,
  type StatusDistribution,
  type TopActivity,
  type TopCreator,
  type TypeDistribution,
} from '../../server/admin-analytics'

export const Route = createFileRoute('/admin/analytics')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminAnalytics,
})

// Simple bar chart component
function MiniBarChart({
  data,
  color = 'bg-primary',
  height = 80,
}: {
  data: Array<GrowthDataPoint>
  color?: string
  height?: number
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((point) => {
        const barHeight = (point.count / maxCount) * 100
        return (
          <div
            key={point.date}
            className="flex-1 group relative"
            style={{ height: '100%' }}
          >
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 rounded-t transition-all',
                color,
                'opacity-60 group-hover:opacity-100',
              )}
              style={{ height: `${Math.max(barHeight, 2)}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-popover border border-border rounded-lg px-2 py-1 text-xs shadow-lg whitespace-nowrap">
                <p className="font-medium">{point.count}</p>
                <p className="text-muted-foreground">
                  {new Date(point.date).toLocaleDateString('th-TH', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Distribution bar component
function DistributionBar({
  items,
  colors,
}: {
  items: Array<{ label: string; value: number; percentage: number }>
  colors: Record<string, string>
}) {
  return (
    <div className="space-y-3">
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn('h-full transition-all', colors[item.label])}
            style={{ width: `${item.percentage}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', colors[item.label])} />
            <span className="text-sm text-muted-foreground capitalize">
              {item.label === 'private_group' ? 'Private' : item.label}
            </span>
            <span className="text-sm font-medium">{item.value}</span>
            <span className="text-xs text-muted-foreground">
              ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [userGrowth, setUserGrowth] = useState<Array<GrowthDataPoint>>([])
  const [activityGrowth, setActivityGrowth] = useState<Array<GrowthDataPoint>>(
    [],
  )
  const [typeDistribution, setTypeDistribution] = useState<
    Array<TypeDistribution>
  >([])
  const [statusDistribution, setStatusDistribution] = useState<
    Array<StatusDistribution>
  >([])
  const [roleDistribution, setRoleDistribution] = useState<
    Array<RoleDistribution>
  >([])
  const [topCreators, setTopCreators] = useState<Array<TopCreator>>([])
  const [topActivities, setTopActivities] = useState<Array<TopActivity>>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          overviewData,
          userGrowthData,
          activityGrowthData,
          typeData,
          statusData,
          roleData,
          creatorsData,
          activitiesData,
        ] = await Promise.all([
          getOverviewStats(),
          getUserGrowthData({ data: { days: 30 } }),
          getActivityGrowthData({ data: { days: 30 } }),
          getActivityTypeDistribution(),
          getActivityStatusDistribution(),
          getUserRoleDistribution(),
          getTopCreators({ data: { limit: 5 } }),
          getTopActivities({ data: { limit: 5 } }),
        ])

        setOverview(overviewData)
        setUserGrowth(userGrowthData)
        setActivityGrowth(activityGrowthData)
        setTypeDistribution(typeData)
        setStatusDistribution(statusData)
        setRoleDistribution(roleData)
        setTopCreators(creatorsData)
        setTopActivities(activitiesData)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        toast.error('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const typeColors: Record<string, string> = {
    quiz: 'bg-purple-500',
    quest: 'bg-blue-500',
    lesson: 'bg-green-500',
    flashcard: 'bg-amber-500',
    roleplay: 'bg-pink-500',
  }

  const statusColors: Record<string, string> = {
    public: 'bg-green-500',
    draft: 'bg-gray-500',
    private_group: 'bg-blue-500',
    link: 'bg-amber-500',
  }

  const roleColors: Record<string, string> = {
    user: 'bg-gray-500',
    plus: 'bg-blue-500',
    pro: 'bg-emerald-500',
    ultra: 'bg-purple-500',
    admin: 'bg-amber-500',
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Sparkles className="w-4 h-4" />
      case 'quest':
        return <Map className="w-4 h-4" />
      case 'lesson':
        return <BookOpen className="w-4 h-4" />
      case 'flashcard':
        return <GraduationCap className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Analytics" activeItem="analytics">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Analytics" activeItem="analytics">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 overflow-hidden hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                {overview && overview.usersThisWeek > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />+{overview.usersThisWeek}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-foreground">
                {overview?.totalUsers.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 overflow-hidden hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                {overview && overview.activitiesThisWeek > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />+{overview.activitiesThisWeek}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-foreground">
                {overview?.totalActivities.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Activities</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 overflow-hidden hover:border-amber-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Play className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {overview?.totalPlays.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Plays</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 overflow-hidden hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {overview?.avgPlaysPerActivity.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Avg Plays/Activity</p>
            </div>
          </motion.div>
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    User Growth (30 days)
                  </h3>
                </div>
                <span className="text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  +{userGrowth.reduce((sum, d) => sum + d.count, 0)} users
                </span>
              </div>
              <MiniBarChart data={userGrowth} color="bg-blue-500" height={100} />
            </div>
          </motion.div>

          {/* Activity Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    Activity Growth (30 days)
                  </h3>
                </div>
                <span className="text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  +{activityGrowth.reduce((sum, d) => sum + d.count, 0)} activities
                </span>
              </div>
              <MiniBarChart
                data={activityGrowth}
                color="bg-purple-500"
                height={100}
              />
            </div>
          </motion.div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Activity Types</h3>
            </div>
            <DistributionBar
              items={typeDistribution.map((t) => ({
                label: t.type,
                value: t.count,
                percentage: t.percentage,
              }))}
              colors={typeColors}
            />
          </motion.div>

          {/* Activity Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Activity Status</h3>
            </div>
            <DistributionBar
              items={statusDistribution.map((s) => ({
                label: s.status,
                value: s.count,
                percentage: s.percentage,
              }))}
              colors={statusColors}
            />
          </motion.div>

          {/* User Role Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">User Roles</h3>
            </div>
            <DistributionBar
              items={roleDistribution.map((r) => ({
                label: r.role,
                value: r.count,
                percentage: r.percentage,
              }))}
              colors={roleColors}
            />
          </motion.div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Creators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-amber-500/30 transition-all duration-300"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">Top Creators</h3>
              </div>
              {topCreators.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No creators yet
                </p>
              ) : (
                <div className="space-y-2">
                  {topCreators.map((creator, index) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200"
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-lg',
                          index === 0
                            ? 'bg-linear-to-br from-amber-400 to-amber-600 text-white'
                            : index === 1
                              ? 'bg-linear-to-br from-gray-300 to-gray-500 text-white'
                              : index === 2
                                ? 'bg-linear-to-br from-amber-600 to-amber-800 text-white'
                                : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </span>
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-border/50"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0 ring-2 ring-border/50">
                          <Users className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {creator.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {creator.activity_count} activities
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">
                          {creator.total_plays.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">plays</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">Top Activities</h3>
              </div>
              {topActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activities yet
                </p>
              ) : (
                <div className="space-y-2">
                  {topActivities.map((activity, index) => (
                    <a
                      key={activity.id}
                      href={`/activity/play/${activity.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200"
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-lg',
                          index === 0
                            ? 'bg-linear-to-br from-amber-400 to-amber-600 text-white'
                            : index === 1
                              ? 'bg-linear-to-br from-gray-300 to-gray-500 text-white'
                              : index === 2
                                ? 'bg-linear-to-br from-amber-600 to-amber-800 text-white'
                                : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </span>
                      {activity.thumbnail ? (
                        <img
                          src={activity.thumbnail}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-border/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0 ring-2 ring-border/50">
                          {getTypeIcon(activity.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.creator_name || 'Anonymous'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">
                          {activity.play_count.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">plays</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
