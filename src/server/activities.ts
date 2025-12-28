import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type { ActivityStatus, CanUserPlayResult, Database, GeneratedQuest, ThemeConfig } from '../types/database'
import type { User, Session } from '@supabase/supabase-js'

// Create Supabase client from cookies (SSR-compatible)
// This automatically handles auth via cookies set by @supabase/ssr
const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// Get current user session from cookies (for SSR hydration)
export const getAuthSession = createServerFn({ method: 'GET' })
  .handler(async (): Promise<{ user: User | null; session: Session | null }> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    return { user, session }
  })

interface SaveQuestInput {
  quest: GeneratedQuest
  rawContent: string
  themeConfig: ThemeConfig
}

interface SaveQuestResult {
  activityId: string
  success: boolean
}

export const saveQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveQuestInput) => data)
  .handler(async ({ data }): Promise<SaveQuestResult> => {
    const supabase = getSupabaseFromCookies()

    // Get user ID from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // 1. Insert the activity
    const { data: activityData, error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        title: data.quest.title,
        description: data.quest.description || null,
        thumbnail: data.quest.thumbnail || null,
        tags: data.quest.tags || null,
        raw_content: data.rawContent,
        theme_config: data.themeConfig as unknown as Database['public']['Tables']['activities']['Insert']['theme_config'],
        status: 'draft',
        type: data.quest.type
      })
      .select('id')
      .single()

    if (activityError || !activityData) {
      throw new Error(`Failed to save activity: ${activityError?.message}`)
    }

    const activityId = activityData.id

    // 2. Handle different quest types
    if (data.quest.type === 'quiz') {
      // Smart Quiz: Create a single stage to hold all questions
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .insert({
          activity_id: activityId,
          title: data.quest.title,
          lesson_summary: '',
          order_index: 0
        })
        .select('id')
        .single()

      if (stageError || !stageData) {
        throw new Error(`Failed to save stage: ${stageError?.message}`)
      }

      // Insert questions for this stage
      const questionInserts = data.quest.quizzes.map((quiz, quizIndex) => ({
        stage_id: stageData.id,
        question: quiz.question,
        options: quiz.type === 'multiple_choice' ? quiz.options : [],
        correct_answer: quiz.type === 'multiple_choice' ? quiz.correct_answer : 0,
        explanation: quiz.explanation,
        order_index: quizIndex
      }))

      const { error: questionError } = await supabase
        .from('questions')
        .insert(questionInserts)

      if (questionError) {
        throw new Error(`Failed to save questions: ${questionError.message}`)
      }
    } else if (data.quest.type === 'quest') {
      // Quest Course: Insert stages with their questions
      for (let stageIndex = 0; stageIndex < data.quest.stages.length; stageIndex++) {
        const stage = data.quest.stages[stageIndex]

        const { data: stageData, error: stageError } = await supabase
          .from('stages')
          .insert({
            activity_id: activityId,
            title: stage.title,
            lesson_summary: stage.lesson,
            order_index: stageIndex
          })
          .select('id')
          .single()

        if (stageError || !stageData) {
          throw new Error(`Failed to save stage: ${stageError?.message}`)
        }

        // Insert questions for this stage
        const questionInserts = stage.quizzes.map((quiz, quizIndex) => ({
          stage_id: stageData.id,
          question: quiz.question,
          options: quiz.type === 'multiple_choice' ? quiz.options : [],
          correct_answer: quiz.type === 'multiple_choice' ? quiz.correct_answer : 0,
          explanation: quiz.explanation,
          order_index: quizIndex
        }))

        const { error: questionError } = await supabase
          .from('questions')
          .insert(questionInserts)

        if (questionError) {
          throw new Error(`Failed to save questions: ${questionError.message}`)
        }
      }
    } else if (data.quest.type === 'lesson') {
      // Lesson: Insert modules as stages with content stored in lesson_summary as JSON
      for (let moduleIndex = 0; moduleIndex < data.quest.modules.length; moduleIndex++) {
        const module = data.quest.modules[moduleIndex]

        const { error: stageError } = await supabase
          .from('stages')
          .insert({
            activity_id: activityId,
            title: module.title,
            // Store content_blocks as JSON string in lesson_summary
            lesson_summary: JSON.stringify(module.content_blocks),
            order_index: moduleIndex
          })

        if (stageError) {
          throw new Error(`Failed to save lesson module: ${stageError?.message}`)
        }
      }
    }

    return { activityId, success: true }
  })

export const publishActivity = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    const { error } = await supabase
      .from('activities')
      .update({ status: 'public' as ActivityStatus })
      .eq('id', data.activityId)

    if (error) {
      throw new Error(`Failed to publish activity: ${error.message}`)
    }

    return { success: true }
  })

export const getPublishedActivities = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        created_at,
        user_id,
        title,
        description,
        thumbnail,
        type,
        theme_config,
        play_count,
        stages (
          id,
          title,
          order_index
        ),
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw new Error(`Failed to fetch activities: ${error.message}`)
    }

    return data || []
  })

export const getActivityById = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Fetch activity with all stages and questions
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', data.activityId)
      .single()

    if (activityError || !activity) {
      throw new Error(`Activity not found: ${activityError?.message}`)
    }

    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('activity_id', data.activityId)
      .order('order_index')

    if (stagesError) {
      throw new Error(`Failed to fetch stages: ${stagesError.message}`)
    }

    // Fetch questions for all stages
    const stageIds = stages?.map(s => s.id) || []
    let questions: Database['public']['Tables']['questions']['Row'][] = []

    if (stageIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('stage_id', stageIds)
        .order('order_index')

      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`)
      }
      questions = questionsData || []
    }

    // Transform to GeneratedQuest format for compatibility with existing store
    let generatedQuest: GeneratedQuest

    if (activity.type === 'lesson') {
      // Lesson: parse content_blocks from lesson_summary JSON
      generatedQuest = {
        type: 'lesson' as const,
        title: activity.title,
        description: activity.description || undefined,
        thumbnail: activity.thumbnail || undefined,
        tags: activity.tags || undefined,
        modules: (stages || []).map(stage => ({
          title: stage.title,
          content_blocks: stage.lesson_summary ? JSON.parse(stage.lesson_summary) : []
        }))
      }
    } else if (activity.type === 'quiz' || (stages?.length === 1 && !stages[0].lesson_summary)) {
      // Smart Quiz
      generatedQuest = {
        type: 'quiz' as const,
        title: activity.title,
        description: activity.description || undefined,
        thumbnail: activity.thumbnail || undefined,
        tags: activity.tags || undefined,
        quizzes: questions.map(q => ({
          type: 'multiple_choice' as const,
          question: q.question,
          options: q.options as string[],
          correct_answer: q.correct_answer,
          explanation: q.explanation
        }))
      }
    } else {
      // Quest Course
      generatedQuest = {
        type: 'quest' as const,
        title: activity.title,
        description: activity.description || undefined,
        thumbnail: activity.thumbnail || undefined,
        tags: activity.tags || undefined,
        stages: (stages || []).map(stage => ({
          title: stage.title,
          lesson: stage.lesson_summary,
          quizzes: questions
            .filter(q => q.stage_id === stage.id)
            .map(q => ({
              type: 'multiple_choice' as const,
              question: q.question,
              options: q.options as string[],
              correct_answer: q.correct_answer,
              explanation: q.explanation
            }))
        }))
      }
    }

    return {
      activity,
      generatedQuest,
      themeConfig: activity.theme_config as ThemeConfig
    }
  })

// Authenticated version of getActivityById for editing user's own activities (including drafts)
export const getActivityByIdForEdit = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Fetch activity - RLS will ensure user can only access their own activities
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', data.activityId)
      .single()

    if (activityError || !activity) {
      throw new Error(`Activity not found: ${activityError?.message}`)
    }

    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('activity_id', data.activityId)
      .order('order_index')

    if (stagesError) {
      throw new Error(`Failed to fetch stages: ${stagesError.message}`)
    }

    // Fetch questions for all stages
    const stageIds = stages?.map(s => s.id) || []
    let questions: Database['public']['Tables']['questions']['Row'][] = []

    if (stageIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('stage_id', stageIds)
        .order('order_index')

      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`)
      }
      questions = questionsData || []
    }

    // Transform to GeneratedQuest format
    let generatedQuest: GeneratedQuest

    if (activity.type === 'lesson') {
      // Lesson: parse content_blocks from lesson_summary JSON
      generatedQuest = {
        type: 'lesson' as const,
        title: activity.title,
        description: activity.description || undefined,
        thumbnail: activity.thumbnail || undefined,
        tags: activity.tags || undefined,
        modules: (stages || []).map(stage => ({
          title: stage.title,
          content_blocks: stage.lesson_summary ? JSON.parse(stage.lesson_summary) : []
        }))
      }
    } else if (activity.type === 'quiz' || (stages?.length === 1 && !stages[0].lesson_summary)) {
      // Smart Quiz
      generatedQuest = {
        type: 'quiz' as const,
        title: activity.title,
        description: activity.description || undefined,
        thumbnail: activity.thumbnail || undefined,
        tags: activity.tags || undefined,
        quizzes: questions.map(q => ({
          type: 'multiple_choice' as const,
          question: q.question,
          options: q.options as string[],
          correct_answer: q.correct_answer,
          explanation: q.explanation
        }))
      }
    } else {
      // Quest Course
      generatedQuest = {
        type: 'quest' as const,
        title: activity.title,
        description: activity.description || undefined,
        thumbnail: activity.thumbnail || undefined,
        tags: activity.tags || undefined,
        stages: (stages || []).map(stage => ({
          title: stage.title,
          lesson: stage.lesson_summary,
          quizzes: questions
            .filter(q => q.stage_id === stage.id)
            .map(q => ({
              type: 'multiple_choice' as const,
              question: q.question,
              options: q.options as string[],
              correct_answer: q.correct_answer,
              explanation: q.explanation
            }))
        }))
      }
    }

    return {
      activity,
      generatedQuest,
      themeConfig: activity.theme_config as ThemeConfig
    }
  })

export const getUserActivities = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { data: activities, error } = await supabase
      .from('activities')
      .select(`
        id,
        created_at,
        title,
        status,
        play_count,
        type,
        stages (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user activities: ${error.message}`)
    }

    return activities
  })

export const incrementPlayCount = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Get current play_count
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('play_count')
      .eq('id', data.activityId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch activity: ${fetchError.message}`)
    }

    // Increment play_count
    const { error: updateError } = await supabase
      .from('activities')
      .update({ play_count: (activity?.play_count || 0) + 1 })
      .eq('id', data.activityId)

    if (updateError) {
      throw new Error(`Failed to increment play count: ${updateError.message}`)
    }

    return { success: true }
  })

interface UpdateQuestInput {
  activityId: string
  quest: GeneratedQuest
  rawContent: string
  themeConfig: ThemeConfig
  status?: ActivityStatus
}

export const updateQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateQuestInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // 1. Update the activity metadata
    const updateData: Database['public']['Tables']['activities']['Update'] = {
      title: data.quest.title,
      description: data.quest.description || null,
      thumbnail: data.quest.thumbnail || null,
      tags: data.quest.tags || null,
      raw_content: data.rawContent,
      theme_config: data.themeConfig as unknown as Database['public']['Tables']['activities']['Update']['theme_config'],
    }

    // Add status if provided
    if (data.status) {
      updateData.status = data.status
    }

    const { error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', data.activityId)

    if (updateError) {
      throw new Error(`Failed to update activity: ${updateError.message}`)
    }

    // 2. Delete existing stages and questions (they will be recreated)
    const { data: existingStages } = await supabase
      .from('stages')
      .select('id')
      .eq('activity_id', data.activityId)

    if (existingStages && existingStages.length > 0) {
      const stageIds = existingStages.map(s => s.id)

      // Delete questions first (foreign key constraint)
      await supabase
        .from('questions')
        .delete()
        .in('stage_id', stageIds)

      // Delete stages
      await supabase
        .from('stages')
        .delete()
        .eq('activity_id', data.activityId)
    }

    // 3. Recreate stages and questions
    if (data.quest.type === 'quiz') {
      // Smart Quiz: Create a single stage to hold all questions
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .insert({
          activity_id: data.activityId,
          title: data.quest.title,
          lesson_summary: '',
          order_index: 0
        })
        .select('id')
        .single()

      if (stageError || !stageData) {
        throw new Error(`Failed to save stage: ${stageError?.message}`)
      }

      // Insert questions for this stage
      const questionInserts = data.quest.quizzes.map((quiz, quizIndex) => ({
        stage_id: stageData.id,
        question: quiz.question,
        options: quiz.type === 'multiple_choice' ? quiz.options : [],
        correct_answer: quiz.type === 'multiple_choice' ? quiz.correct_answer : 0,
        explanation: quiz.explanation,
        order_index: quizIndex
      }))

      const { error: questionError } = await supabase
        .from('questions')
        .insert(questionInserts)

      if (questionError) {
        throw new Error(`Failed to save questions: ${questionError.message}`)
      }
    } else if (data.quest.type === 'quest') {
      // Quest Course: Insert stages with their questions
      for (let stageIndex = 0; stageIndex < data.quest.stages.length; stageIndex++) {
        const stage = data.quest.stages[stageIndex]

        const { data: stageData, error: stageError } = await supabase
          .from('stages')
          .insert({
            activity_id: data.activityId,
            title: stage.title,
            lesson_summary: stage.lesson,
            order_index: stageIndex
          })
          .select('id')
          .single()

        if (stageError || !stageData) {
          throw new Error(`Failed to save stage: ${stageError?.message}`)
        }

        // Insert questions for this stage
        const questionInserts = stage.quizzes.map((quiz, quizIndex) => ({
          stage_id: stageData.id,
          question: quiz.question,
          options: quiz.type === 'multiple_choice' ? quiz.options : [],
          correct_answer: quiz.type === 'multiple_choice' ? quiz.correct_answer : 0,
          explanation: quiz.explanation,
          order_index: quizIndex
        }))

        const { error: questionError } = await supabase
          .from('questions')
          .insert(questionInserts)

        if (questionError) {
          throw new Error(`Failed to save questions: ${questionError.message}`)
        }
      }
    } else if (data.quest.type === 'lesson') {
      // Lesson: Insert modules as stages with content stored in lesson_summary as JSON
      for (let moduleIndex = 0; moduleIndex < data.quest.modules.length; moduleIndex++) {
        const module = data.quest.modules[moduleIndex]

        const { error: stageError } = await supabase
          .from('stages')
          .insert({
            activity_id: data.activityId,
            title: module.title,
            // Store content_blocks as JSON string in lesson_summary
            lesson_summary: JSON.stringify(module.content_blocks),
            order_index: moduleIndex
          })

        if (stageError) {
          throw new Error(`Failed to save lesson module: ${stageError?.message}`)
        }
      }
    }

    return { success: true }
  })

// Get allowed emails for a private_group activity
export const getAllowedEmails = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Get pending email invites
    const { data: pendingInvites, error } = await supabase
      .from('activity_pending_invites')
      .select('email')
      .eq('activity_id', data.activityId)

    if (error) {
      throw new Error(`Failed to get allowed emails: ${error.message}`)
    }

    return (pendingInvites || []).map(inv => inv.email)
  })

// Update allowed emails for a private_group activity
export const updateAllowedEmails = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    activityId: string
    emails: string[]
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Delete existing pending invites
    await supabase
      .from('activity_pending_invites')
      .delete()
      .eq('activity_id', data.activityId)

    // Insert new email invites
    if (data.emails.length > 0) {
      const emailInserts = data.emails.map(email => ({
        activity_id: data.activityId,
        email: email.toLowerCase()
      }))

      const { error: emailError } = await supabase
        .from('activity_pending_invites')
        .insert(emailInserts)

      if (emailError) {
        throw new Error(`Failed to save allowed emails: ${emailError.message}`)
      }
    }

    return { success: true }
  })

export const deleteActivity = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Get thumbnail before deleting
    const { data: activity } = await supabase
      .from('activities')
      .select('thumbnail')
      .eq('id', data.activityId)
      .single()

    // Delete thumbnail from storage if exists
    if (activity?.thumbnail?.includes('/storage/v1/object/public/thumbnails/')) {
      const urlParts = activity.thumbnail.split('/storage/v1/object/public/thumbnails/')
      if (urlParts.length === 2) {
        const filePath = urlParts[1]
        if (filePath.startsWith(user.id)) {
          await supabase.storage.from('thumbnails').remove([filePath])
        }
      }
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', data.activityId)

    if (error) {
      throw new Error(`Failed to delete activity: ${error.message}`)
    }

    return { success: true }
  })

// ============================================================
// Replay & Availability Settings Functions
// ============================================================

// Check if user can play an activity (replay limits + availability window)
export const checkCanUserPlay = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }): Promise<CanUserPlayResult> => {
    const supabase = getSupabaseFromCookies()

    // Get user ID if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // If no user, we can still check availability window but not replay limits
    if (!userId) {
      // Check availability only
      const { data: activity } = await supabase
        .from('activities')
        .select('available_from, available_until')
        .eq('id', data.activityId)
        .single()

      if (!activity) {
        return { can_play: false, reason: 'activity_not_found' }
      }

      const now = new Date()

      if (activity.available_from && new Date(activity.available_from) > now) {
        return {
          can_play: false,
          reason: 'not_yet_available',
          available_from: activity.available_from
        }
      }

      if (activity.available_until && new Date(activity.available_until) < now) {
        return {
          can_play: false,
          reason: 'expired',
          available_until: activity.available_until
        }
      }

      // Guest can play (no replay limit check possible)
      return { can_play: true, reason: 'unlimited' }
    }

    // Use the database function for authenticated users
    const { data: result, error } = await supabase.rpc('can_user_play_activity', {
      p_activity_id: data.activityId,
      p_user_id: userId
    })

    if (error) {
      throw new Error(`Failed to check play eligibility: ${error.message}`)
    }

    return result as CanUserPlayResult
  })

// Record a play (start or complete)
export const recordPlay = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    activityId: string
    score?: number
    durationSeconds?: number
    completed?: boolean
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { data: result, error } = await supabase.rpc('record_activity_play', {
      p_activity_id: data.activityId,
      p_user_id: user.id,
      p_score: data.score ?? null,
      p_duration_seconds: data.durationSeconds ?? null,
      p_completed: data.completed ?? false
    })

    if (error) {
      throw new Error(`Failed to record play: ${error.message}`)
    }

    return { playRecordId: result, success: true }
  })

// Update play record (when completing a play)
export const updatePlayRecord = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    playRecordId: string
    score: number
    durationSeconds: number
    completed: boolean
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { error } = await supabase
      .from('activity_play_records')
      .update({
        score: data.score,
        duration_seconds: data.durationSeconds,
        completed: data.completed
      })
      .eq('id', data.playRecordId)
      .eq('user_id', user.id) // RLS double-check

    if (error) {
      throw new Error(`Failed to update play record: ${error.message}`)
    }

    return { success: true }
  })

// Get user's play history for an activity
export const getUserPlayHistory = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { data: records, error } = await supabase
      .from('activity_play_records')
      .select('*')
      .eq('activity_id', data.activityId)
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get play history: ${error.message}`)
    }

    return records
  })

// Get active play session with time limit info
export interface ActivePlaySession {
  playRecordId: string
  startedAt: string
  timeLimitMinutes: number | null
  availableUntil: string | null
  isExpired: boolean
  remainingSeconds: number | null
}

export const getActivePlaySession = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string; playRecordId?: string }) => data)
  .handler(async ({ data }): Promise<ActivePlaySession | null> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return null // Guest users don't have tracked sessions
    }

    // Get the most recent uncompleted play record or specific record
    let query = supabase
      .from('activity_play_records')
      .select('id, started_at')
      .eq('activity_id', data.activityId)
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('started_at', { ascending: false })
      .limit(1)

    if (data.playRecordId) {
      query = supabase
        .from('activity_play_records')
        .select('id, started_at')
        .eq('id', data.playRecordId)
        .eq('user_id', user.id)
    }

    const { data: playRecord, error: playError } = await query.single()

    if (playError || !playRecord) {
      return null
    }

    // Get activity time settings
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('time_limit_minutes, available_until')
      .eq('id', data.activityId)
      .single()

    if (activityError || !activity) {
      return null
    }

    const now = new Date()
    const startedAt = new Date(playRecord.started_at)
    let isExpired = false
    let remainingSeconds: number | null = null

    // Check time limit expiry
    if (activity.time_limit_minutes) {
      const timeLimitMs = activity.time_limit_minutes * 60 * 1000
      const elapsedMs = now.getTime() - startedAt.getTime()
      remainingSeconds = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000))
      if (remainingSeconds <= 0) {
        isExpired = true
      }
    }

    // Check availability window expiry
    if (activity.available_until && new Date(activity.available_until) < now) {
      isExpired = true
    }

    return {
      playRecordId: playRecord.id,
      startedAt: playRecord.started_at,
      timeLimitMinutes: activity.time_limit_minutes,
      availableUntil: activity.available_until,
      isExpired,
      remainingSeconds
    }
  })

// Update activity replay & availability settings
export const updateActivitySettings = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    activityId: string
    replayLimit?: number | null
    timeLimitMinutes?: number | null
    availableFrom?: string | null
    availableUntil?: string | null
    ageRange?: string | null
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const updateData: Record<string, unknown> = {}

    if (data.replayLimit !== undefined) {
      updateData.replay_limit = data.replayLimit
    }
    if (data.timeLimitMinutes !== undefined) {
      updateData.time_limit_minutes = data.timeLimitMinutes
    }
    if (data.availableFrom !== undefined) {
      updateData.available_from = data.availableFrom
    }
    if (data.availableUntil !== undefined) {
      updateData.available_until = data.availableUntil
    }
    if (data.ageRange !== undefined) {
      updateData.age_range = data.ageRange
    }

    const { error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', data.activityId)

    if (error) {
      throw new Error(`Failed to update activity settings: ${error.message}`)
    }

    return { success: true }
  })

// User stats for profile page
export interface UserStats {
  totalActivitiesPlayed: number
  totalScore: number
  completedActivities: number
  recentPlays: Array<{
    id: string
    activity_id: string
    activity_title: string
    activity_thumbnail: string | null
    played_at: string
    score: number | null
    completed: boolean
  }>
}

export const getUserStats = createServerFn({ method: 'GET' })
  .handler(async (): Promise<UserStats> => {
    const supabase = getSupabaseFromCookies()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Get all play records with activity info
    const { data: records, error } = await supabase
      .from('activity_play_records')
      .select(`
        id,
        activity_id,
        played_at,
        score,
        completed,
        activities (
          title,
          thumbnail
        )
      `)
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get user stats: ${error.message}`)
    }

    // Calculate stats
    const totalActivitiesPlayed = new Set(records?.map(r => r.activity_id) || []).size
    const totalScore = records?.reduce((sum, r) => sum + (r.score || 0), 0) || 0
    const completedActivities = new Set(
      records?.filter(r => r.completed).map(r => r.activity_id) || []
    ).size

    // Get recent 5 plays
    const recentPlays = (records || []).slice(0, 5).map(r => ({
      id: r.id,
      activity_id: r.activity_id,
      activity_title: (r.activities as { title: string } | null)?.title || 'Unknown',
      activity_thumbnail: (r.activities as { thumbnail: string | null } | null)?.thumbnail || null,
      played_at: r.played_at,
      score: r.score,
      completed: r.completed
    }))

    return {
      totalActivitiesPlayed,
      totalScore,
      completedActivities,
      recentPlays
    }
  })

// Get all activity results with pagination
export interface ActivityResult {
  id: string
  activity_id: string
  activity_title: string
  activity_thumbnail: string | null
  activity_type: string
  played_at: string
  score: number | null
  completed: boolean
  time_spent: number | null // seconds
}

export interface ActivityResultsResponse {
  results: ActivityResult[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export const getActivityResults = createServerFn({ method: 'GET' })
  .inputValidator((data: { page?: number; pageSize?: number }) => data)
  .handler(async ({ data }): Promise<ActivityResultsResponse> => {
    const supabase = getSupabaseFromCookies()
    const page = data.page || 1
    const pageSize = data.pageSize || 20
    const offset = (page - 1) * pageSize

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Get total count
    const { count } = await supabase
      .from('activity_play_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get paginated results
    const { data: records, error } = await supabase
      .from('activity_play_records')
      .select(`
        id,
        activity_id,
        played_at,
        score,
        completed,
        duration_seconds,
        activities (
          title,
          thumbnail,
          type
        )
      `)
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw new Error(`Failed to get activity results: ${error.message}`)
    }

    const results: ActivityResult[] = (records || []).map(r => ({
      id: r.id,
      activity_id: r.activity_id,
      activity_title: (r.activities as { title: string } | null)?.title || 'Unknown',
      activity_thumbnail: (r.activities as { thumbnail: string | null } | null)?.thumbnail || null,
      activity_type: (r.activities as { type: string } | null)?.type || 'quiz',
      played_at: r.played_at,
      score: r.score,
      completed: r.completed,
      time_spent: r.duration_seconds
    }))

    return {
      results,
      total: count || 0,
      page,
      pageSize,
      hasMore: offset + results.length < (count || 0)
    }
  })

// Get suggested activities based on content/keywords
interface SuggestedActivity {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
  play_count: number
  tags: string[] | null
}

export const getSuggestedActivities = createServerFn({ method: 'POST' })
  .inputValidator((data: { content: string; limit?: number }) => data)
  .handler(async ({ data }): Promise<SuggestedActivity[]> => {
    const supabase = getSupabaseFromCookies()
    const limit = data.limit || 5

    // Extract keywords from content (simple approach: take significant words)
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'and', 'or', 'but', 'if', 'then', 'else', 'when', 'up', 'down',
      'out', 'off', 'over', 'under', 'again', 'further', 'once',
      'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
      'he', 'she', 'it', 'they', 'we', 'you', 'i', 'me', 'him', 'her',
      'ที่', 'และ', 'ใน', 'ของ', 'เป็น', 'ได้', 'มี', 'จะ', 'ให้', 'กับ',
      'ไม่', 'ว่า', 'นี้', 'ก็', 'แต่', 'หรือ', 'จาก', 'โดย', 'เมื่อ', 'ถ้า'
    ])

    // Extract significant words
    const words = data.content
      .toLowerCase()
      .replace(/[^\w\sก-ฮะ-ู]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))

    // Get word frequency
    const wordFreq: Record<string, number> = {}
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })

    // Get top keywords
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    if (keywords.length === 0) {
      // Fallback: return most popular activities
      const { data: popularActivities } = await supabase
        .from('activities')
        .select('id, title, description, thumbnail, type, play_count, tags')
        .eq('status', 'public')
        .order('play_count', { ascending: false })
        .limit(limit)

      return (popularActivities || []) as SuggestedActivity[]
    }

    // Try to find activities with matching keywords in title or tags
    // Build search query for title matching
    const searchPattern = keywords.slice(0, 5).join(' | ')

    // First, try full-text search on title
    const { data: searchResults } = await supabase
      .from('activities')
      .select('id, title, description, thumbnail, type, play_count, tags')
      .eq('status', 'public')
      .or(`title.ilike.%${keywords[0]}%,title.ilike.%${keywords[1] || keywords[0]}%`)
      .order('play_count', { ascending: false })
      .limit(limit)

    if (searchResults && searchResults.length >= limit) {
      return searchResults as SuggestedActivity[]
    }

    // If not enough results, also check for tag overlap
    const { data: tagResults } = await supabase
      .from('activities')
      .select('id, title, description, thumbnail, type, play_count, tags')
      .eq('status', 'public')
      .overlaps('tags', keywords.slice(0, 5))
      .order('play_count', { ascending: false })
      .limit(limit)

    // Combine and dedupe results
    const combined = [...(searchResults || []), ...(tagResults || [])]
    const seen = new Set<string>()
    const unique = combined.filter(activity => {
      if (seen.has(activity.id)) return false
      seen.add(activity.id)
      return true
    }).slice(0, limit)

    if (unique.length > 0) {
      return unique as SuggestedActivity[]
    }

    // Final fallback: return popular activities
    const { data: popularActivities } = await supabase
      .from('activities')
      .select('id, title, description, thumbnail, type, play_count, tags')
      .eq('status', 'public')
      .order('play_count', { ascending: false })
      .limit(limit)

    return (popularActivities || []) as SuggestedActivity[]
  })
