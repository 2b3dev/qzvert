import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  AIAction,
  AIUsageStats,
  TierPricingConfig,
  TokenEstimationRatios,
  CreditSettings,
  DEFAULT_TIER_PRICING_CONFIG,
  DEFAULT_TOKEN_ESTIMATION_RATIOS,
  DEFAULT_CREDIT_SETTINGS,
} from '../types/database'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Re-export checkAdminAccess from reports for convenience
export { checkAdminAccess } from './reports'

// System settings interface
export interface SystemSettings {
  // General
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  maintenanceMessage: string

  // AI
  aiCreditsPerUser: number
  aiCreditsPerGeneration: number

  // Tier Monthly Credits (credits given per month for each tier)
  tierMonthlyCredits: Record<string, number>

  // Tier Package Prices (THB per month for each tier)
  tierPackagePrice: Record<string, number>

  // Features
  enablePublicActivities: boolean
  enableUserRegistration: boolean
  enableAIGeneration: boolean
  requireEmailVerification: boolean
}

// Mapping between camelCase keys and snake_case database keys
const keyMapping: Record<keyof SystemSettings, string> = {
  siteName: 'site_name',
  siteDescription: 'site_description',
  maintenanceMode: 'maintenance_mode',
  maintenanceMessage: 'maintenance_message',
  aiCreditsPerUser: 'ai_credits_per_user',
  aiCreditsPerGeneration: 'ai_credits_per_generation',
  tierMonthlyCredits: 'tier_monthly_credits',
  tierPackagePrice: 'tier_package_price',
  enablePublicActivities: 'enable_public_activities',
  enableUserRegistration: 'enable_user_registration',
  enableAIGeneration: 'enable_ai_generation',
  requireEmailVerification: 'require_email_verification',
}

// Reverse mapping
const reverseKeyMapping: Record<string, keyof SystemSettings> = Object.entries(
  keyMapping,
).reduce(
  (acc, [camelKey, snakeKey]) => {
    acc[snakeKey] = camelKey as keyof SystemSettings
    return acc
  },
  {} as Record<string, keyof SystemSettings>,
)

// Default settings (fallback)
const defaultSettings: SystemSettings = {
  siteName: 'QzVert',
  siteDescription: 'AI-powered Learning Platform',
  maintenanceMode: false,
  maintenanceMessage:
    'We are currently performing maintenance. Please check back soon.',

  aiCreditsPerUser: 100,
  aiCreditsPerGeneration: 10,

  // Tier pricing: Plus ฿199, Pro ฿599, Ultra ฿999
  // Higher tiers = more credits = lower price per credit (more value)
  tierMonthlyCredits: {
    user: 10,      // Explorer (Free) - 10 credits/month
    plus: 300,     // Plus ฿199/month - ฿0.66/credit
    pro: 1200,     // Pro ฿599/month - ฿0.50/credit (24% cheaper)
    ultra: 2500,   // Ultra ฿999/month - ฿0.40/credit (39% cheaper)
    admin: 0,      // Unlimited
  },

  tierPackagePrice: {
    user: 0,      // Free
    plus: 199,    // Plus ฿199/month
    pro: 599,     // Pro ฿599/month
    ultra: 999,   // Ultra ฿999/month
    admin: 0,     // Free
  },

  enablePublicActivities: true,
  enableUserRegistration: true,
  enableAIGeneration: true,
  requireEmailVerification: false,
}

// Get system settings
export const getSystemSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SystemSettings> => {
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

    // Fetch all settings from database
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value')

    if (error) {
      console.error('Failed to fetch settings:', error)
      return defaultSettings
    }

    // Convert to SystemSettings object
    const result = { ...defaultSettings }

    if (settings) {
      for (const setting of settings) {
        const camelKey = reverseKeyMapping[setting.key]
        if (camelKey) {
          // Parse JSON value
          result[camelKey] = setting.value as never
        }
      }
    }

    return result
  },
)

// Update system settings
export const updateSystemSettings = createServerFn({ method: 'POST' })
  .inputValidator((data: Partial<SystemSettings>) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
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

    // Upsert each setting (creates if not exists, updates if exists)
    const updates = Object.entries(data).map(async ([key, value]) => {
      const snakeKey = keyMapping[key as keyof SystemSettings]
      if (snakeKey) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(
            {
              key: snakeKey,
              value: JSON.parse(JSON.stringify(value)),
              updated_by: user.id,
            },
            { onConflict: 'key' }
          )

        if (error) {
          console.error(`Failed to upsert ${snakeKey}:`, error)
          throw new Error(`Failed to save setting: ${snakeKey}`)
        }
      }
    })

    await Promise.all(updates)

    return { success: true }
  })

// Update a single setting
export const updateSingleSetting = createServerFn({ method: 'POST' })
  .inputValidator((data: { key: keyof SystemSettings; value: unknown }) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
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

    const snakeKey = keyMapping[data.key]
    if (!snakeKey) {
      throw new Error(`Unknown setting key: ${data.key}`)
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: snakeKey,
          value: JSON.parse(JSON.stringify(data.value)),
          updated_by: user.id,
        },
        { onConflict: 'key' }
      )

    if (error) {
      throw new Error(`Failed to save setting: ${error.message}`)
    }

    return { success: true }
  })

// Get storage stats
export interface StorageStats {
  thumbnailsCount: number
  thumbnailsSizeMB: number
  totalStorageMB: number
  storageLimitMB: number
}

export const getStorageStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StorageStats> => {
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

    let thumbnailsCount = 0
    let thumbnailsSizeMB = 0

    // List root level (user folders)
    const { data: folders } = await supabase.storage
      .from('thumbnails')
      .list('', { limit: 1000 })

    if (folders) {
      // For each folder (user_id), list files inside
      for (const folder of folders) {
        // Skip if it's a file at root level (has metadata)
        if (folder.metadata) {
          thumbnailsCount++
          thumbnailsSizeMB += (folder.metadata.size || 0) / (1024 * 1024)
          continue
        }

        // It's a folder, list files inside
        const { data: files } = await supabase.storage
          .from('thumbnails')
          .list(folder.name, { limit: 1000 })

        if (files) {
          for (const file of files) {
            if (file.metadata) {
              thumbnailsCount++
              thumbnailsSizeMB += (file.metadata.size || 0) / (1024 * 1024)
            }
          }
        }
      }
    }

    return {
      thumbnailsCount,
      thumbnailsSizeMB: Math.round(thumbnailsSizeMB * 100) / 100,
      totalStorageMB: Math.round(thumbnailsSizeMB * 100) / 100,
      storageLimitMB: 1024, // 1GB limit (example)
    }
  },
)

// Get database stats
export interface DatabaseStats {
  profilesCount: number
  activitiesCount: number
  stagesCount: number
  questionsCount: number
  reportsCount: number
  playRecordsCount: number
}

export const getDatabaseStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DatabaseStats> => {
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

    const [profiles, activities, stages, questions, reports, playRecords] =
      await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('activities')
          .select('id', { count: 'exact', head: true }),
        supabase.from('stages').select('id', { count: 'exact', head: true }),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase
          .from('activity_play_records')
          .select('id', { count: 'exact', head: true }),
      ])

    return {
      profilesCount: profiles.count || 0,
      activitiesCount: activities.count || 0,
      stagesCount: stages.count || 0,
      questionsCount: questions.count || 0,
      reportsCount: reports.count || 0,
      playRecordsCount: playRecords.count || 0,
    }
  },
)

// Danger zone actions
export const clearAllReports = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean; deletedCount: number }> => {
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

    // Get count before deleting
    const { count } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'resolved')

    // Delete only resolved reports
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('status', 'resolved')

    if (error) {
      throw new Error(`Failed to clear reports: ${error.message}`)
    }

    return { success: true, deletedCount: count || 0 }
  },
)

export const clearOldPlayRecords = createServerFn({ method: 'POST' })
  .inputValidator((data: { daysOld: number }) => data)
  .handler(
    async ({ data }): Promise<{ success: boolean; deletedCount: number }> => {
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

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - data.daysOld)

      // Get count before deleting
      const { count } = await supabase
        .from('activity_play_records')
        .select('id', { count: 'exact', head: true })
        .lt('played_at', cutoffDate.toISOString())

      // Delete old records
      const { error } = await supabase
        .from('activity_play_records')
        .delete()
        .lt('played_at', cutoffDate.toISOString())

      if (error) {
        throw new Error(`Failed to clear play records: ${error.message}`)
      }

      return { success: true, deletedCount: count || 0 }
    },
  )

// Get a single setting value (for use in other parts of the app)
export const getSettingValue = createServerFn({ method: 'GET' })
  .inputValidator((data: { key: string }) => data)
  .handler(async ({ data }): Promise<string | number | boolean | null> => {
    const supabase = getSupabaseFromCookies()

    const { data: setting, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', data.key)
      .single()

    if (error) {
      // Return default value if not found
      const camelKey = reverseKeyMapping[data.key]
      if (camelKey) {
        return defaultSettings[camelKey] as string | number | boolean
      }
      return null
    }

    return setting.value as string | number | boolean
  })

// Check if AI generation is enabled (public, no auth required)
export const isAIGenerationEnabled = createServerFn({ method: 'GET' }).handler(
  async (): Promise<boolean> => {
    const supabase = getSupabaseFromCookies()

    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'enable_ai_generation')
      .single()

    // Default to true if not set
    return setting?.value !== false
  },
)

// Get public site settings (no auth required) - for Header, Footer, SEO
export interface PublicSiteSettings {
  siteName: string
  siteDescription: string
}

export const getPublicSiteSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicSiteSettings> => {
    const supabase = getSupabaseFromCookies()

    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['site_name', 'site_description'])

    const result: PublicSiteSettings = {
      siteName: defaultSettings.siteName,
      siteDescription: defaultSettings.siteDescription,
    }

    if (settings) {
      for (const setting of settings) {
        if (setting.key === 'site_name' && setting.value) {
          result.siteName = setting.value as string
        }
        if (setting.key === 'site_description' && setting.value) {
          result.siteDescription = setting.value as string
        }
      }
    }

    return result
  },
)

// Check if maintenance mode is enabled (public, no auth required)
export const isMaintenanceMode = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ enabled: boolean; message: string }> => {
    const supabase = getSupabaseFromCookies()

    const { data: maintenanceSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()

    const { data: messageSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_message')
      .single()

    return {
      enabled: maintenanceSetting?.value === true,
      message:
        (messageSetting?.value as string) ||
        'We are currently performing maintenance. Please check back soon.',
    }
  },
)

// ============================================
// AI Usage Tracking
// ============================================

// Re-export pricing from types/database.ts (single source of truth)
export { GEMINI_PRICING, GEMINI_ADDITIONAL_COSTS } from '../types/database'
import { GEMINI_PRICING, type GeminiModelId } from '../types/database'

// Helper to get pricing for current model
export function getModelPricing(modelId: GeminiModelId) {
  return GEMINI_PRICING[modelId] || GEMINI_PRICING['gemini-2.0-flash']
}

// Log AI usage (called from ttl.ts and gemini.ts)
export const logAIUsage = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      action: AIAction
      inputTokens: number
      outputTokens: number
      model?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Get current user (optional - can log anonymous usage)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: user?.id || null,
      action: data.action,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      total_tokens: data.inputTokens + data.outputTokens,
      model: data.model || 'gemini-2.0-flash',
    })

    if (error) {
      console.error('Failed to log AI usage:', error)
    }

    return { success: !error }
  })

// Get AI usage stats (admin only)
export const getAIUsageStats = createServerFn({ method: 'GET' })
  .inputValidator((data?: { days?: number }) => data || {})
  .handler(async ({ data }): Promise<AIUsageStats> => {
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

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch all logs in date range
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch AI usage logs:', error)
      throw new Error('Failed to fetch usage data')
    }

    // Initialize stats
    const actions: AIAction[] = [
      'summarize',
      'craft',
      'translate',
      'generate_quiz',
      'generate_quest',
      'generate_lesson',
      'deep_lesson',
    ]

    const requestsByAction = Object.fromEntries(
      actions.map((a) => [a, 0]),
    ) as Record<AIAction, number>
    const tokensByAction = Object.fromEntries(
      actions.map((a) => [a, 0]),
    ) as Record<AIAction, number>

    let totalInputTokens = 0
    let totalOutputTokens = 0

    // Daily usage map
    const dailyMap = new Map<string, { requests: number; tokens: number }>()

    // Process logs
    for (const log of logs || []) {
      // Action stats
      requestsByAction[log.action as AIAction]++
      tokensByAction[log.action as AIAction] += log.total_tokens

      // Totals
      totalInputTokens += log.input_tokens
      totalOutputTokens += log.output_tokens

      // Daily stats
      const date = new Date(log.created_at).toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { requests: 0, tokens: 0 }
      dailyMap.set(date, {
        requests: existing.requests + 1,
        tokens: existing.tokens + log.total_tokens,
      })
    }

    // Convert daily map to array
    const dailyUsage = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      requests: stats.requests,
      tokens: stats.tokens,
    }))

    // Calculate estimated cost (using gemini-2.0-flash pricing)
    const pricing = getModelPricing('gemini-2.0-flash')
    const estimatedCost =
      (totalInputTokens / 1_000_000) * pricing.input +
      (totalOutputTokens / 1_000_000) * pricing.output

    return {
      totalRequests: logs?.length || 0,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      requestsByAction,
      tokensByAction,
      dailyUsage,
      estimatedCost: Math.round(estimatedCost * 10000) / 10000, // Round to 4 decimals
    }
  })

// Get daily AI usage chart data (admin only)
export const getDailyAIUsageChart = createServerFn({ method: 'GET' })
  .inputValidator((data: { timeRange: 'week' | 'month' | 'year' }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      data: Array<{
        date: string
        requests: number
        tokens: number
      }>
      summary: {
        totalRequests: number
        totalTokens: number
        estimatedCost: number
      }
    }> => {
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

      // Calculate date range based on timeRange
      const now = new Date()
      const startDate = new Date()
      let daysCount = 7

      switch (data.timeRange) {
        case 'week':
          daysCount = 7
          startDate.setDate(now.getDate() - 6)
          break
        case 'month':
          daysCount = 30
          startDate.setDate(now.getDate() - 29)
          break
        case 'year':
          daysCount = 365
          startDate.setDate(now.getDate() - 364)
          break
      }
      // Use UTC to match database timestamps
      startDate.setUTCHours(0, 0, 0, 0)

      // Fetch all logs
      const { data: logs, error } = await supabase
        .from('ai_usage_logs')
        .select('input_tokens, output_tokens, total_tokens, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to fetch AI usage logs:', error)
        throw new Error('Failed to fetch usage data')
      }

      // Initialize daily map
      const dailyMap = new Map<string, { requests: number; tokens: number }>()

      // Pre-fill all days in range
      for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        dailyMap.set(dateStr, { requests: 0, tokens: 0 })
      }

      // Process logs
      let totalRequests = 0
      let totalTokens = 0
      let totalInputTokens = 0
      let totalOutputTokens = 0

      for (const log of logs || []) {
        const dateStr = new Date(log.created_at).toISOString().split('T')[0]
        const existing = dailyMap.get(dateStr)
        if (!existing) continue

        existing.requests++
        existing.tokens += log.total_tokens
        totalRequests++
        totalTokens += log.total_tokens
        totalInputTokens += log.input_tokens
        totalOutputTokens += log.output_tokens
      }

      // Calculate estimated cost
      const pricing = getModelPricing('gemini-2.0-flash')
      const estimatedCost =
        (totalInputTokens / 1_000_000) * pricing.input +
        (totalOutputTokens / 1_000_000) * pricing.output

      // Convert to array (for year, aggregate to months)
      let chartData: Array<{ date: string; requests: number; tokens: number }>

      if (data.timeRange === 'year') {
        // Aggregate by month
        const monthlyMap = new Map<
          string,
          { requests: number; tokens: number }
        >()

        for (const [dateStr, stats] of dailyMap.entries()) {
          const monthKey = dateStr.substring(0, 7) // YYYY-MM
          const existing = monthlyMap.get(monthKey) || { requests: 0, tokens: 0 }
          monthlyMap.set(monthKey, {
            requests: existing.requests + stats.requests,
            tokens: existing.tokens + stats.tokens,
          })
        }

        chartData = Array.from(monthlyMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date))
      } else {
        chartData = Array.from(dailyMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }

      return {
        data: chartData,
        summary: {
          totalRequests,
          totalTokens,
          estimatedCost: Math.round(estimatedCost * 10000) / 10000,
        },
      }
    },
  )

// Get today's usage (no quota - paid tier)
export const getTodayAIUsage = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    requests: number
    tokens: number
  }> => {
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

    // Get today's start (UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const { data: logs, count } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens', { count: 'exact' })
      .gte('created_at', today.toISOString())

    const totalTokens =
      logs?.reduce((sum, log) => sum + log.total_tokens, 0) || 0

    return {
      requests: count || 0,
      tokens: totalTokens,
    }
  },
)

// Clear old AI usage logs (admin only)
export const clearOldAIUsageLogs = createServerFn({ method: 'POST' })
  .inputValidator((data: { daysOld: number }) => data)
  .handler(
    async ({ data }): Promise<{ success: boolean; deletedCount: number }> => {
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

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - data.daysOld)

      // Get count before deleting
      const { count } = await supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString())

      // Delete old logs
      const { error } = await supabase
        .from('ai_usage_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        throw new Error(`Failed to clear AI usage logs: ${error.message}`)
      }

      return { success: true, deletedCount: count || 0 }
    },
  )

// Get current month AI usage stats (admin only) - for dashboard overview
export const getCurrentMonthAIUsage = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    requests: number
    tokens: number
    monthName: string
  }> => {
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

    // Get first day of current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDayOfMonth.setUTCHours(0, 0, 0, 0)

    // Fetch all logs from current month
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('total_tokens')
      .gte('created_at', firstDayOfMonth.toISOString())

    if (error) {
      console.error('Failed to fetch current month AI usage:', error)
      throw new Error('Failed to fetch usage data')
    }

    const totalTokens =
      logs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0

    return {
      requests: logs?.length || 0,
      tokens: totalTokens,
      monthName: now.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    }
  },
)

// ============================================
// Admin Settings (Pricing Configuration)
// ============================================

export interface GeminiPricingSettings {
  inputPrice: number
  outputPrice: number
}

// Get Gemini pricing settings from DB (admin only)
export const getGeminiPricingSettings = createServerFn({
  method: 'GET',
}).handler(async (): Promise<GeminiPricingSettings> => {
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

  // Get settings from system_settings table
  const { data: settings, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'gemini_pricing')
    .single()

  if (error || !settings) {
    // Return defaults if not found
    return {
      inputPrice: GEMINI_PRICING['gemini-2.0-flash'].input,
      outputPrice: GEMINI_PRICING['gemini-2.0-flash'].output,
    }
  }

  return settings.value as GeminiPricingSettings
})

// Save Gemini pricing settings to DB (admin only)
export const saveGeminiPricingSettings = createServerFn({ method: 'POST' })
  .inputValidator((data: GeminiPricingSettings) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
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

    // Upsert settings to system_settings table
    const { error } = await supabase.from('system_settings').upsert(
      {
        key: 'gemini_pricing',
        value: data,
        description: 'Gemini API pricing configuration for cost calculation',
      },
      { onConflict: 'key' },
    )

    if (error) {
      console.error('Failed to save pricing settings:', error)
      throw new Error('Failed to save settings')
    }

    return { success: true }
  })

// ============================================
// AI Credit Configuration Settings
// ============================================

// Get token estimation ratios (admin only)
export const getTokenEstimationRatios = createServerFn({
  method: 'GET',
}).handler(async (): Promise<TokenEstimationRatios> => {
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

  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'token_estimation_ratios')
    .single()

  if (!setting) {
    const defaults = await import('../types/database').then(
      (m) => m.DEFAULT_TOKEN_ESTIMATION_RATIOS,
    )
    return defaults
  }

  return setting.value as TokenEstimationRatios
})

// Save token estimation ratios (admin only)
export const saveTokenEstimationRatios = createServerFn({ method: 'POST' })
  .inputValidator((data: TokenEstimationRatios) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
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

    const { error } = await supabase.from('system_settings').upsert(
      {
        key: 'token_estimation_ratios',
        value: data,
        description: 'Token estimation ratios for output prediction',
        updated_by: user.id,
      },
      { onConflict: 'key' },
    )

    if (error) {
      throw new Error('Failed to save token estimation ratios')
    }

    return { success: true }
  })

// Get tier pricing configuration (admin only)
export const getTierPricingConfig = createServerFn({
  method: 'GET',
}).handler(async (): Promise<TierPricingConfig> => {
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

  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'tier_pricing_config')
    .single()

  if (!setting) {
    const defaults = await import('../types/database').then(
      (m) => m.DEFAULT_TIER_PRICING_CONFIG,
    )
    return defaults
  }

  return setting.value as TierPricingConfig
})

// Save tier pricing configuration (admin only)
export const saveTierPricingConfig = createServerFn({ method: 'POST' })
  .inputValidator((data: TierPricingConfig) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
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

    const { error } = await supabase.from('system_settings').upsert(
      {
        key: 'tier_pricing_config',
        value: data,
        description: 'Tier-based pricing configuration for credit calculation',
        updated_by: user.id,
      },
      { onConflict: 'key' },
    )

    if (error) {
      throw new Error('Failed to save tier pricing config')
    }

    return { success: true }
  })

// Get all credit settings (admin only)
export const getAllCreditSettings = createServerFn({
  method: 'GET',
}).handler(async (): Promise<CreditSettings> => {
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

  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', [
      'token_estimation_ratios',
      'tier_pricing_config',
      'credit_conversion_rate',
      'usd_to_thb_rate',
      'gemini_model',
      'gemini_input_price',
      'gemini_output_price',
      'tokens_per_credit',
      'tier_subscriptions',
      'min_margin_threshold',
    ])

  const settingsMap: Record<string, unknown> = {}
  if (settings) {
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }
  }

  const defaults = await import('../types/database').then(
    (m) => m.DEFAULT_CREDIT_SETTINGS,
  )

  return {
    tokenEstimationRatios:
      (settingsMap['token_estimation_ratios'] as TokenEstimationRatios) ||
      defaults.tokenEstimationRatios,
    tierPricingConfig:
      (settingsMap['tier_pricing_config'] as TierPricingConfig) ||
      defaults.tierPricingConfig,
    creditConversionRate:
      (settingsMap['credit_conversion_rate'] as number) ||
      defaults.creditConversionRate,
    usdToThbRate:
      (settingsMap['usd_to_thb_rate'] as number) || defaults.usdToThbRate,
    geminiModel:
      (settingsMap['gemini_model'] as typeof defaults.geminiModel) || defaults.geminiModel,
    geminiInputPrice:
      (settingsMap['gemini_input_price'] as number) || defaults.geminiInputPrice,
    geminiOutputPrice:
      (settingsMap['gemini_output_price'] as number) || defaults.geminiOutputPrice,
    tokensPerCredit:
      (settingsMap['tokens_per_credit'] as number) || defaults.tokensPerCredit,
    tierSubscriptions:
      (settingsMap['tier_subscriptions'] as typeof defaults.tierSubscriptions) ||
      defaults.tierSubscriptions,
    minMarginThreshold:
      (settingsMap['min_margin_threshold'] as number) ?? defaults.minMarginThreshold,
  }
})

// Save all credit settings (admin only)
export const saveAllCreditSettings = createServerFn({ method: 'POST' })
  .inputValidator((data: CreditSettings) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
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

    // Upsert all settings
    const settingsToUpsert = [
      {
        key: 'token_estimation_ratios',
        value: data.tokenEstimationRatios,
        description: 'Token estimation ratios for output prediction',
        updated_by: user.id,
      },
      {
        key: 'tier_pricing_config',
        value: data.tierPricingConfig,
        description: 'Tier-based pricing configuration',
        updated_by: user.id,
      },
      {
        key: 'credit_conversion_rate',
        value: data.creditConversionRate,
        description: 'Credits per THB conversion rate',
        updated_by: user.id,
      },
      {
        key: 'usd_to_thb_rate',
        value: data.usdToThbRate,
        description: 'USD to THB exchange rate',
        updated_by: user.id,
      },
      {
        key: 'gemini_model',
        value: data.geminiModel,
        description: 'Selected Gemini model ID',
        updated_by: user.id,
      },
      {
        key: 'gemini_input_price',
        value: data.geminiInputPrice,
        description: 'Gemini API input price per 1M tokens',
        updated_by: user.id,
      },
      {
        key: 'gemini_output_price',
        value: data.geminiOutputPrice,
        description: 'Gemini API output price per 1M tokens',
        updated_by: user.id,
      },
      {
        key: 'tokens_per_credit',
        value: data.tokensPerCredit,
        description: 'Number of tokens per 1 credit',
        updated_by: user.id,
      },
      {
        key: 'tier_subscriptions',
        value: data.tierSubscriptions,
        description: 'Tier subscription pricing (package price, monthly credits, price per credit)',
        updated_by: user.id,
      },
      {
        key: 'min_margin_threshold',
        value: data.minMarginThreshold,
        description: 'Minimum margin % threshold for tier pricing warnings',
        updated_by: user.id,
      },
    ]

    for (const setting of settingsToUpsert) {
      const { error } = await supabase
        .from('system_settings')
        .upsert(setting, { onConflict: 'key' })

      if (error) {
        throw new Error(`Failed to save ${setting.key}: ${error.message}`)
      }
    }

    return { success: true }
  })
