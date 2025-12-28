import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

// Create Supabase client from cookies (SSR-compatible)
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Content types that can be reported
export type ContentType = 'activity' | 'media' | 'comment' | 'profile'

export type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'copyright'
  | 'misinformation'
  | 'harassment'
  | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  content_type: ContentType
  content_id: string
  reporter_id: string | null
  reason: ReportReason
  additional_info: string | null
  status: ReportStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

// Content info based on content type
export interface ContentInfo {
  title: string
  thumbnail: string | null
  owner_id: string | null
}

export interface ReportWithContent extends Report {
  content: ContentInfo | null
  reporter: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

// Check if current user is admin
export const checkAdminAccess = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { isAdmin: false }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return { isAdmin: profile?.role === 'admin' }
  })

// Submit a new report (polymorphic - works with any content type)
export const submitReport = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    contentType: ContentType
    contentId: string
    reason: ReportReason
    additionalInfo?: string
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Get current user (optional - allow anonymous reports too)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        content_type: data.contentType,
        content_id: data.contentId,
        reporter_id: user?.id || null,
        reason: data.reason,
        additional_info: data.additionalInfo || null,
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to submit report: ${error.message}`)
    }

    return { reportId: report.id, success: true }
  })

// Helper: Submit activity report (convenience wrapper)
export const submitActivityReport = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    activityId: string
    reason: ReportReason
    additionalInfo?: string
  }) => data)
  .handler(async ({ data }) => {
    return submitReport({
      data: {
        contentType: 'activity',
        contentId: data.activityId,
        reason: data.reason,
        additionalInfo: data.additionalInfo,
      }
    })
  })

// Helper function to fetch content info based on type
async function fetchContentInfo(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  contentType: ContentType,
  contentId: string
): Promise<ContentInfo | null> {
  switch (contentType) {
    case 'activity': {
      const { data } = await supabase
        .from('activities')
        .select('title, thumbnail, user_id')
        .eq('id', contentId)
        .single()
      if (data) {
        return { title: data.title, thumbnail: data.thumbnail, owner_id: data.user_id }
      }
      break
    }
    case 'profile': {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, id')
        .eq('id', contentId)
        .single()
      if (data) {
        return { title: data.display_name || 'Unknown User', thumbnail: data.avatar_url, owner_id: data.id }
      }
      break
    }
    // Future content types: media, comment
    default:
      return null
  }
  return null
}

// Get all reports (admin only)
export const getReports = createServerFn({ method: 'GET' })
  .inputValidator((data: {
    status?: ReportStatus
    contentType?: ContentType
    page?: number
    pageSize?: number
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const pageSize = data.pageSize || 20
    const offset = (page - 1) * pageSize

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

    // Build query - fetch reports without join
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (data.status) {
      query = query.eq('status', data.status)
    }

    if (data.contentType) {
      query = query.eq('content_type', data.contentType)
    }

    const { data: reports, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`)
    }

    // Fetch content info and reporter info for each report
    const reportsWithContent: ReportWithContent[] = await Promise.all(
      (reports || []).map(async (report) => {
        const content = await fetchContentInfo(supabase, report.content_type, report.content_id)

        // Fetch reporter info if reporter_id exists
        let reporter: { display_name: string | null; avatar_url: string | null } | null = null
        if (report.reporter_id) {
          const { data: reporterData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', report.reporter_id)
            .single()
          reporter = reporterData
        }

        return {
          ...report,
          content,
          reporter,
        } as ReportWithContent
      })
    )

    return {
      reports: reportsWithContent,
      total: count || 0,
      page,
      pageSize,
      hasMore: offset + (reports?.length || 0) < (count || 0)
    }
  })

// Update report status (admin only)
export const updateReportStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    reportId: string
    status: ReportStatus
    adminNotes?: string
  }) => data)
  .handler(async ({ data }) => {
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

    const { error } = await supabase
      .from('reports')
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', data.reportId)

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`)
    }

    return { success: true }
  })

// Get report stats (admin only)
export const getReportStats = createServerFn({ method: 'GET' })
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

    // Get counts by status
    const { count: pending } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: reviewed } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'reviewed')

    const { count: resolved } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')

    const { count: dismissed } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dismissed')

    // Get counts by content type
    const { count: activityReports } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('content_type', 'activity')

    const { count: mediaReports } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('content_type', 'media')

    const { count: commentReports } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('content_type', 'comment')

    const { count: profileReports } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('content_type', 'profile')

    return {
      byStatus: {
        pending: pending || 0,
        reviewed: reviewed || 0,
        resolved: resolved || 0,
        dismissed: dismissed || 0,
      },
      byContentType: {
        activity: activityReports || 0,
        media: mediaReports || 0,
        comment: commentReports || 0,
        profile: profileReports || 0,
      },
      total: (pending || 0) + (reviewed || 0) + (resolved || 0) + (dismissed || 0),
    }
  })

// Get admin dashboard overview stats (admin only)
export const getAdminDashboardStats = createServerFn({ method: 'GET' })
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

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    // Get total activities count
    const { count: totalActivities } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })

    // Get public activities count
    const { count: publicActivities } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'public')

    // Get total plays (sum of play_count)
    const { data: playsData } = await supabase
      .from('activities')
      .select('play_count')

    const totalPlays = playsData?.reduce((sum, a) => sum + (a.play_count || 0), 0) || 0

    // Get activities created this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const { count: activitiesThisWeek } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    // Get users created this week
    const { count: usersThisWeek } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    // Get activities by type
    const { count: quizCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'quiz')

    const { count: questCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'quest')

    // Get recent activities (last 5)
    const { data: recentActivities } = await supabase
      .from('activities')
      .select(`
        id,
        title,
        thumbnail,
        type,
        status,
        play_count,
        created_at,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get top activities by play count
    const { data: topActivities } = await supabase
      .from('activities')
      .select(`
        id,
        title,
        thumbnail,
        type,
        play_count,
        profiles (
          display_name
        )
      `)
      .eq('status', 'public')
      .order('play_count', { ascending: false })
      .limit(5)

    return {
      users: {
        total: totalUsers || 0,
        thisWeek: usersThisWeek || 0,
      },
      activities: {
        total: totalActivities || 0,
        public: publicActivities || 0,
        thisWeek: activitiesThisWeek || 0,
        byType: {
          quiz: quizCount || 0,
          quest: questCount || 0,
        },
      },
      plays: {
        total: totalPlays,
      },
      recentActivities: recentActivities || [],
      topActivities: topActivities || [],
    }
  })
