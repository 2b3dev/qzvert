import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'

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

  // Limits
  maxActivitiesPerUser: number
  maxQuestionsPerActivity: number
  maxFileUploadSizeMB: number

  // AI
  aiCreditsPerUser: number
  aiCreditsPerGeneration: number

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
  maxActivitiesPerUser: 'max_activities_per_user',
  maxQuestionsPerActivity: 'max_questions_per_activity',
  maxFileUploadSizeMB: 'max_file_upload_size_mb',
  aiCreditsPerUser: 'ai_credits_per_user',
  aiCreditsPerGeneration: 'ai_credits_per_generation',
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

  maxActivitiesPerUser: 100,
  maxQuestionsPerActivity: 50,
  maxFileUploadSizeMB: 5,

  aiCreditsPerUser: 100,
  aiCreditsPerGeneration: 10,

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

    // Update each setting
    const updates = Object.entries(data).map(async ([key, value]) => {
      const snakeKey = keyMapping[key as keyof SystemSettings]
      if (snakeKey) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: JSON.parse(JSON.stringify(value)) })
          .eq('key', snakeKey)

        if (error) {
          console.error(`Failed to update ${snakeKey}:`, error)
          throw new Error(`Failed to update setting: ${snakeKey}`)
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
      .update({ value: JSON.parse(JSON.stringify(data.value)) })
      .eq('key', snakeKey)

    if (error) {
      throw new Error(`Failed to update setting: ${error.message}`)
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
