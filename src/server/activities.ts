import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import type { ActivityStatus, Database, GeneratedQuest, ThemeConfig } from '../types/database'

// Create Supabase client with user's access token for RLS
const getSupabaseWithAuth = (accessToken: string) => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_API_KEY || process.env.SUPABASE_API_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient<Database>(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}

// Public client for read-only operations (published quests)
const getSupabasePublic = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_API_KEY || process.env.SUPABASE_API_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient<Database>(url, anonKey)
}

interface SaveQuestInput {
  quest: GeneratedQuest
  rawContent: string
  themeConfig: ThemeConfig
  accessToken: string
}

interface SaveQuestResult {
  activityId: string
  success: boolean
}

export const saveQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveQuestInput) => data)
  .handler(async ({ data }): Promise<SaveQuestResult> => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    // Get user ID from the token
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
        type: data.quest.type === 'quiz' ? 'quiz' : 'quest'
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
    } else {
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
    }

    return { activityId, success: true }
  })

export const publishActivity = createServerFn({ method: 'POST' })
  .inputValidator((data: { activityId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
    const supabase = getSupabasePublic()

    const { data, error } = await supabase
      .from('activities')
      .select(`
        id,
        created_at,
        user_id,
        title,
        theme_config,
        play_count,
        stages (
          id,
          title,
          order_index
        )
      `)
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw new Error(`Failed to fetch activities: ${error.message}`)
    }

    return data
  })

export const getActivityById = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabasePublic()

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
    // Determine if it's a quiz (single stage with empty lesson) or quest
    const isSmartQuiz = stages?.length === 1 && !stages[0].lesson_summary

    const generatedQuest: GeneratedQuest = isSmartQuiz
      ? {
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
      : {
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

    return {
      activity,
      generatedQuest,
      themeConfig: activity.theme_config as ThemeConfig
    }
  })

// Authenticated version of getActivityById for editing user's own activities (including drafts)
export const getActivityByIdForEdit = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
    const isSmartQuiz = stages?.length === 1 && !stages[0].lesson_summary

    const generatedQuest: GeneratedQuest = isSmartQuiz
      ? {
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
      : {
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

    return {
      activity,
      generatedQuest,
      themeConfig: activity.theme_config as ThemeConfig
    }
  })

export const getUserActivities = createServerFn({ method: 'GET' })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
    const supabase = getSupabasePublic()

    const { error } = await supabase.rpc('increment_play_count', {
      activity_id: data.activityId
    })

    if (error) {
      throw new Error(`Failed to increment play count: ${error.message}`)
    }

    return { success: true }
  })

interface UpdateQuestInput {
  activityId: string
  quest: GeneratedQuest
  rawContent: string
  themeConfig: ThemeConfig
  accessToken: string
  status?: ActivityStatus
}

export const updateQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateQuestInput) => data)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
    } else {
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
    }

    return { success: true }
  })

// Get allowed emails for a private_group activity
export const getAllowedEmails = createServerFn({ method: 'GET' })
  .inputValidator((data: { activityId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
    accessToken: string
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
  .inputValidator((data: { activityId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

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
