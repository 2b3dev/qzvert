import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type { ActivityStatus } from '../types/database'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Re-export checkAdminAccess from reports for convenience
export { checkAdminAccess } from './reports'

type ActivityType = 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'

export interface AdminActivity {
  id: string
  title: string
  thumbnail: string | null
  type: ActivityType
  status: ActivityStatus
  play_count: number
  created_at: string
  user_id: string | null
  profile: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

// Get all activities (admin only)
export const getAdminActivities = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      search?: string
      status?: ActivityStatus
      type?: ActivityType
      page?: number
      pageSize?: number
      sortBy?: 'created_at' | 'title' | 'play_count'
      sortOrder?: 'asc' | 'desc'
    }) => data,
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const pageSize = data.pageSize || 20
    const offset = (page - 1) * pageSize
    const sortBy = data.sortBy || 'created_at'
    const sortOrder = data.sortOrder || 'desc'

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

    // Build query
    let query = supabase
      .from('activities')
      .select('id, title, thumbnail, type, status, play_count, created_at, user_id', {
        count: 'exact',
      })

    // Apply search filter
    if (data.search) {
      query = query.ilike('title', `%${data.search}%`)
    }

    // Apply status filter
    if (data.status) {
      query = query.eq('status', data.status)
    }

    // Apply type filter
    if (data.type) {
      query = query.eq('type', data.type)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data: activitiesRaw, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch activities: ${error.message}`)
    }

    // Fetch profiles for activities
    const userIds = [
      ...new Set(
        (activitiesRaw || [])
          .map((a) => a.user_id)
          .filter((id): id is string => id !== null),
      ),
    ]

    const { data: profiles } =
      userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds)
        : { data: [] }

    const profilesMap = new Map(
      (profiles || []).map((p) => [p.id, p]),
    )

    const activities: Array<AdminActivity> = (activitiesRaw || []).map((a) => ({
      id: a.id,
      title: a.title,
      thumbnail: a.thumbnail,
      type: a.type,
      status: a.status,
      play_count: a.play_count,
      created_at: a.created_at,
      user_id: a.user_id,
      profile: a.user_id ? profilesMap.get(a.user_id) || null : null,
    }))

    return {
      activities,
      total: count || 0,
      page,
      pageSize,
    }
  })

// Get activity stats (admin only)
export const getAdminActivityStats = createServerFn({ method: 'GET' }).handler(
  async () => {
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
    const { count: total } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })

    const { count: publicCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'public')

    const { count: draftCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')

    const { count: privateGroupCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'private_group')

    const { count: linkCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'link')

    const { count: quizCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'quiz')

    const { count: questCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'quest')

    const { count: lessonCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'lesson')

    // Get this week count
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const { count: thisWeek } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    // Get this month count
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const { count: thisMonth } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneMonthAgo.toISOString())

    return {
      total: total || 0,
      public: publicCount || 0,
      draft: draftCount || 0,
      private_group: privateGroupCount || 0,
      link: linkCount || 0,
      quiz: quizCount || 0,
      quest: questCount || 0,
      lesson: lessonCount || 0,
      thisWeek: thisWeek || 0,
      thisMonth: thisMonth || 0,
    }
  },
)

// Update activity status (admin only)
export const updateActivityStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { activityId: string; status: ActivityStatus }) => data,
  )
  .handler(async ({ data }) => {
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

    const { error } = await supabase
      .from('activities')
      .update({ status: data.status })
      .eq('id', data.activityId)

    if (error) {
      throw new Error(`Failed to update activity status: ${error.message}`)
    }

    return { success: true }
  })

// Delete activity (admin only)
export const deleteActivityAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
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

    // Get activity info for cleanup
    const { data: activity } = await supabase
      .from('activities')
      .select('thumbnail, user_id')
      .eq('id', data.activityId)
      .single()

    // Delete thumbnail from storage if exists
    if (
      activity?.thumbnail?.includes('/storage/v1/object/public/thumbnails/') &&
      activity.user_id
    ) {
      const urlParts = activity.thumbnail.split(
        '/storage/v1/object/public/thumbnails/',
      )
      if (urlParts.length === 2) {
        const filePath = urlParts[1]
        if (filePath.startsWith(activity.user_id)) {
          await supabase.storage.from('thumbnails').remove([filePath])
        }
      }
    }

    // Delete activity (cascades to stages, questions, etc.)
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', data.activityId)

    if (error) {
      throw new Error(`Failed to delete activity: ${error.message}`)
    }

    return { success: true }
  })
