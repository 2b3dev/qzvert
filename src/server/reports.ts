import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

// Create Supabase client from cookies (SSR-compatible)
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

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
  activity_id: string
  reporter_id: string | null
  reason: ReportReason
  additional_info: string | null
  status: ReportStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface ReportWithActivity extends Report {
  activities: {
    title: string
    thumbnail: string | null
    user_id: string | null
  } | null
  reporter: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

// Submit a new report
export const submitReport = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    activityId: string
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
        activity_id: data.activityId,
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

// Get all reports (admin only)
export const getReports = createServerFn({ method: 'GET' })
  .inputValidator((data: {
    status?: ReportStatus
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

    // Build query
    let query = supabase
      .from('reports')
      .select(`
        *,
        activities (
          title,
          thumbnail,
          user_id
        ),
        reporter:profiles!reports_reporter_id_fkey (
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (data.status) {
      query = query.eq('status', data.status)
    }

    const { data: reports, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`)
    }

    return {
      reports: reports as ReportWithActivity[],
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
    const { data: pending } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { data: reviewed } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'reviewed')

    const { data: resolved } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')

    const { data: dismissed } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dismissed')

    return {
      pending: pending?.length || 0,
      reviewed: reviewed?.length || 0,
      resolved: resolved?.length || 0,
      dismissed: dismissed?.length || 0,
    }
  })
