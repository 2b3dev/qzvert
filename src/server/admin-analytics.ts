import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Re-export checkAdminAccess from reports for convenience
export { checkAdminAccess } from './reports'

// Helper to get date range
const getDateRange = (days: number) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  return { start, end }
}

// Get overview stats
export interface OverviewStats {
  totalUsers: number
  totalActivities: number
  totalPlays: number
  publicActivities: number
  usersThisWeek: number
  usersThisMonth: number
  activitiesThisWeek: number
  activitiesThisMonth: number
  avgPlaysPerActivity: number
}

export const getOverviewStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OverviewStats> => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Get counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)

    const { count: totalActivities } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })

    const { count: publicActivities } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'public')

    // Get total plays
    const { data: playsData } = await supabase
      .from('activities')
      .select('play_count')

    const totalPlays =
      playsData?.reduce((sum, a) => sum + (a.play_count || 0), 0) || 0

    // Get this week/month counts
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const { count: usersThisWeek } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())
      .is('deleted_at', null)

    const { count: usersThisMonth } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneMonthAgo.toISOString())
      .is('deleted_at', null)

    const { count: activitiesThisWeek } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    const { count: activitiesThisMonth } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneMonthAgo.toISOString())

    const avgPlaysPerActivity =
      totalActivities && totalActivities > 0
        ? Math.round(totalPlays / totalActivities)
        : 0

    return {
      totalUsers: totalUsers || 0,
      totalActivities: totalActivities || 0,
      totalPlays,
      publicActivities: publicActivities || 0,
      usersThisWeek: usersThisWeek || 0,
      usersThisMonth: usersThisMonth || 0,
      activitiesThisWeek: activitiesThisWeek || 0,
      activitiesThisMonth: activitiesThisMonth || 0,
      avgPlaysPerActivity,
    }
  },
)

// Get user growth data (last 30 days)
export interface GrowthDataPoint {
  date: string
  count: number
}

export const getUserGrowthData = createServerFn({ method: 'GET' })
  .inputValidator((data: { days?: number }) => data)
  .handler(async ({ data }): Promise<Array<GrowthDataPoint>> => {
    const supabase = getSupabaseFromCookies()
    const days = data?.days || 30

    // Verify admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { start } = getDateRange(days)

    const { data: users } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Group by date
    const groupedData: Record<string, number> = {}

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dateStr = date.toISOString().split('T')[0]
      groupedData[dateStr] = 0
    }

    // Count users per date
    users?.forEach((u) => {
      const dateStr = new Date(u.created_at).toISOString().split('T')[0]
      if (groupedData[dateStr] !== undefined) {
        groupedData[dateStr]++
      }
    })

    return Object.entries(groupedData).map(([date, count]) => ({
      date,
      count,
    }))
  })

// Get activity growth data (last 30 days)
export const getActivityGrowthData = createServerFn({ method: 'GET' })
  .inputValidator((data: { days?: number }) => data)
  .handler(async ({ data }): Promise<Array<GrowthDataPoint>> => {
    const supabase = getSupabaseFromCookies()
    const days = data?.days || 30

    // Verify admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { start } = getDateRange(days)

    const { data: activities } = await supabase
      .from('activities')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const groupedData: Record<string, number> = {}

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dateStr = date.toISOString().split('T')[0]
      groupedData[dateStr] = 0
    }

    // Count activities per date
    activities?.forEach((a) => {
      const dateStr = new Date(a.created_at).toISOString().split('T')[0]
      if (groupedData[dateStr] !== undefined) {
        groupedData[dateStr]++
      }
    })

    return Object.entries(groupedData).map(([date, count]) => ({
      date,
      count,
    }))
  })

// Get activity type distribution
export interface TypeDistribution {
  type: string
  count: number
  percentage: number
}

export const getActivityTypeDistribution = createServerFn({
  method: 'GET',
}).handler(async (): Promise<Array<TypeDistribution>> => {
  const supabase = getSupabaseFromCookies()

  // Verify admin
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  const types = ['quiz', 'quest', 'lesson', 'flashcard', 'roleplay'] as const
  const results: Array<TypeDistribution> = []
  let total = 0

  for (const type of types) {
    const { count } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('type', type)

    if (count && count > 0) {
      results.push({ type, count, percentage: 0 })
      total += count
    }
  }

  // Calculate percentages
  return results.map((r) => ({
    ...r,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }))
})

// Get status distribution
export interface StatusDistribution {
  status: string
  count: number
  percentage: number
}

export const getActivityStatusDistribution = createServerFn({
  method: 'GET',
}).handler(async (): Promise<Array<StatusDistribution>> => {
  const supabase = getSupabaseFromCookies()

  // Verify admin
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  const statuses = ['public', 'draft', 'private_group', 'link'] as const
  const results: Array<StatusDistribution> = []
  let total = 0

  for (const status of statuses) {
    const { count } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)

    results.push({ status, count: count || 0, percentage: 0 })
    total += count || 0
  }

  // Calculate percentages
  return results.map((r) => ({
    ...r,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }))
})

// Get top creators
export interface TopCreator {
  id: string
  display_name: string | null
  avatar_url: string | null
  activity_count: number
  total_plays: number
}

export const getTopCreators = createServerFn({ method: 'GET' })
  .inputValidator((data: { limit?: number }) => data)
  .handler(async ({ data }): Promise<Array<TopCreator>> => {
    const supabase = getSupabaseFromCookies()
    const limit = data?.limit || 10

    // Verify admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Get activities with user_id
    const { data: activities } = await supabase
      .from('activities')
      .select('user_id, play_count')
      .not('user_id', 'is', null)

    // Group by user_id
    const userStats: Record<
      string,
      { activity_count: number; total_plays: number }
    > = {}

    activities?.forEach((a) => {
      if (a.user_id) {
        if (!userStats[a.user_id]) {
          userStats[a.user_id] = { activity_count: 0, total_plays: 0 }
        }
        userStats[a.user_id].activity_count++
        userStats[a.user_id].total_plays += a.play_count || 0
      }
    })

    // Sort by activity_count and get top N
    const topUserIds = Object.entries(userStats)
      .sort((a, b) => b[1].activity_count - a[1].activity_count)
      .slice(0, limit)
      .map(([id]) => id)

    if (topUserIds.length === 0) {
      return []
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', topUserIds)

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    return topUserIds.map((id) => ({
      id,
      display_name: profilesMap.get(id)?.display_name || null,
      avatar_url: profilesMap.get(id)?.avatar_url || null,
      activity_count: userStats[id].activity_count,
      total_plays: userStats[id].total_plays,
    }))
  })

// Get top activities by plays
export interface TopActivity {
  id: string
  title: string
  thumbnail: string | null
  type: string
  play_count: number
  creator_name: string | null
}

export const getTopActivities = createServerFn({ method: 'GET' })
  .inputValidator((data: { limit?: number }) => data)
  .handler(async ({ data }): Promise<Array<TopActivity>> => {
    const supabase = getSupabaseFromCookies()
    const limit = data?.limit || 10

    // Verify admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { data: activities } = await supabase
      .from('activities')
      .select('id, title, thumbnail, type, play_count, user_id')
      .eq('status', 'public')
      .order('play_count', { ascending: false })
      .limit(limit)

    if (!activities || activities.length === 0) {
      return []
    }

    // Fetch creator profiles
    const userIds = [
      ...new Set(
        activities
          .map((a) => a.user_id)
          .filter((id): id is string => id !== null),
      ),
    ]

    const { data: profiles } =
      userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds)
        : { data: [] }

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      thumbnail: a.thumbnail,
      type: a.type,
      play_count: a.play_count,
      creator_name: a.user_id
        ? profilesMap.get(a.user_id)?.display_name || null
        : null,
    }))
  })

// Get user role distribution
export interface RoleDistribution {
  role: string
  count: number
  percentage: number
}

export const getUserRoleDistribution = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<RoleDistribution>> => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const roles = ['user', 'plus', 'pro', 'ultra', 'admin'] as const
    const results: Array<RoleDistribution> = []
    let total = 0

    for (const role of roles) {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', role)
        .is('deleted_at', null)

      results.push({ role, count: count || 0, percentage: 0 })
      total += count || 0
    }

    // Calculate percentages
    return results.map((r) => ({
      ...r,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }))
  },
)
