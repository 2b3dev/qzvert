import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import type { Database, GeneratedQuest, ThemeConfig } from '../types/database'

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
  creationId: string
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

    // 1. Insert the creation
    const { data: creationData, error: creationError } = await supabase
      .from('creations')
      .insert({
        user_id: user.id,
        title: data.quest.title,
        raw_content: data.rawContent,
        theme_config: data.themeConfig as unknown as Database['public']['Tables']['creations']['Insert']['theme_config'],
        is_published: false,
        type: data.quest.type === 'quiz' ? 'quiz' : 'quest'
      })
      .select('id')
      .single()

    if (creationError || !creationData) {
      throw new Error(`Failed to save creation: ${creationError?.message}`)
    }

    const creationId = creationData.id

    // 2. Handle different quest types
    if (data.quest.type === 'quiz') {
      // Smart Quiz: Create a single stage to hold all questions
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .insert({
          creation_id: creationId,
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
            creation_id: creationId,
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

    return { creationId, success: true }
  })

export const publishCreation = createServerFn({ method: 'POST' })
  .inputValidator((data: { creationId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    const { error } = await supabase
      .from('creations')
      .update({ is_published: true })
      .eq('id', data.creationId)

    if (error) {
      throw new Error(`Failed to publish creation: ${error.message}`)
    }

    return { success: true }
  })

export const getPublishedCreations = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabasePublic()

    const { data, error } = await supabase
      .from('creations')
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
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw new Error(`Failed to fetch creations: ${error.message}`)
    }

    return data
  })

export const getCreationById = createServerFn({ method: 'GET' })
  .inputValidator((data: { creationId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabasePublic()

    // Fetch creation with all stages and questions
    const { data: creation, error: creationError } = await supabase
      .from('creations')
      .select('*')
      .eq('id', data.creationId)
      .single()

    if (creationError || !creation) {
      throw new Error(`Creation not found: ${creationError?.message}`)
    }

    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('creation_id', data.creationId)
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
          title: creation.title,
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
          title: creation.title,
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
      creation,
      generatedQuest,
      themeConfig: creation.theme_config as ThemeConfig
    }
  })

// Authenticated version of getCreationById for editing user's own creations (including drafts)
export const getCreationByIdForEdit = createServerFn({ method: 'GET' })
  .inputValidator((data: { creationId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Fetch creation - RLS will ensure user can only access their own creations
    const { data: creation, error: creationError } = await supabase
      .from('creations')
      .select('*')
      .eq('id', data.creationId)
      .single()

    if (creationError || !creation) {
      throw new Error(`Creation not found: ${creationError?.message}`)
    }

    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('creation_id', data.creationId)
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
          title: creation.title,
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
          title: creation.title,
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
      creation,
      generatedQuest,
      themeConfig: creation.theme_config as ThemeConfig
    }
  })

export const getUserCreations = createServerFn({ method: 'GET' })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { data: creations, error } = await supabase
      .from('creations')
      .select(`
        id,
        created_at,
        title,
        is_published,
        play_count,
        stages (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user creations: ${error.message}`)
    }

    return creations
  })

export const incrementPlayCount = createServerFn({ method: 'POST' })
  .inputValidator((data: { creationId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabasePublic()

    const { error } = await supabase.rpc('increment_play_count', {
      creation_id: data.creationId
    })

    if (error) {
      throw new Error(`Failed to increment play count: ${error.message}`)
    }

    return { success: true }
  })

export const deleteCreation = createServerFn({ method: 'POST' })
  .inputValidator((data: { creationId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    const { error } = await supabase
      .from('creations')
      .delete()
      .eq('id', data.creationId)

    if (error) {
      throw new Error(`Failed to delete creation: ${error.message}`)
    }

    return { success: true }
  })
