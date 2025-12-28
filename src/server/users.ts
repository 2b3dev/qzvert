import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

export type UserRole = 'learner' | 'creator' | 'admin'

export interface UserProfile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
  activity_count: number
}

// Get all users (admin only)
export const getUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: {
    search?: string
    role?: UserRole
    page?: number
    pageSize?: number
    sortBy?: 'created_at' | 'display_name' | 'activity_count'
    sortOrder?: 'asc' | 'desc'
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const pageSize = data.pageSize || 20
    const offset = (page - 1) * pageSize
    const sortBy = data.sortBy || 'created_at'
    const sortOrder = data.sortOrder || 'desc'

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
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

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (data.search) {
      query = query.or(`display_name.ilike.%${data.search}%,email.ilike.%${data.search}%`)
    }

    // Apply role filter
    if (data.role) {
      query = query.eq('role', data.role)
    }

    // Apply sorting
    if (sortBy === 'activity_count') {
      // For activity_count, we'll sort after fetching
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data: profiles, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    // Get activity counts for each user
    const usersWithActivityCount: UserProfile[] = await Promise.all(
      (profiles || []).map(async (p) => {
        const { count: activityCount } = await supabase
          .from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', p.id)

        return {
          ...p,
          activity_count: activityCount || 0,
        } as UserProfile
      })
    )

    // Sort by activity_count if needed
    if (sortBy === 'activity_count') {
      usersWithActivityCount.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.activity_count - b.activity_count
          : b.activity_count - a.activity_count
      })
    }

    return {
      users: usersWithActivityCount,
      total: count || 0,
      page,
      pageSize,
      hasMore: offset + (profiles?.length || 0) < (count || 0)
    }
  })

// Get single user details (admin only)
export const getUserDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.userId)
      .single()

    if (profileError || !profile) {
      throw new Error('User not found')
    }

    // Get user's activities
    const { data: activities, count: activityCount } = await supabase
      .from('activities')
      .select('id, title, thumbnail, type, status, play_count, created_at', { count: 'exact' })
      .eq('user_id', data.userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user's reports count (reports made by this user)
    const { count: reportsCount } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', data.userId)

    // Get reports against this user's content
    const { count: reportsAgainstCount } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .in('content_id', (activities || []).map(a => a.id))

    return {
      profile,
      activities: activities || [],
      stats: {
        activityCount: activityCount || 0,
        reportsCount: reportsCount || 0,
        reportsAgainstCount: reportsAgainstCount || 0,
      }
    }
  })

// Update user role (admin only)
export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; role: UserRole }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Prevent admin from removing their own admin role
    if (user.id === data.userId && data.role !== 'admin') {
      throw new Error('Cannot remove your own admin role')
    }

    // Validate role value
    if (!['learner', 'creator', 'admin'].includes(data.role)) {
      throw new Error('Invalid role value')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: data.role, updated_at: new Date().toISOString() })
      .eq('id', data.userId)

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`)
    }

    return { success: true }
  })

// Get user stats summary (admin only)
export const getUserStats = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
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

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    // Get admin count
    const { count: adminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')

    // Get creator count
    const { count: creatorCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'creator')

    // Get learner count
    const { count: learnerCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'learner')

    // Get users this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const { count: usersThisWeek } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    // Get users this month
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const { count: usersThisMonth } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneMonthAgo.toISOString())

    return {
      total: totalUsers || 0,
      admins: adminCount || 0,
      creators: creatorCount || 0,
      learners: learnerCount || 0,
      thisWeek: usersThisWeek || 0,
      thisMonth: usersThisMonth || 0,
    }
  })
