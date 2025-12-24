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
  questId: string
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

    // 1. Insert the quest
    const { data: questData, error: questError } = await supabase
      .from('quests')
      .insert({
        user_id: user.id,
        title: data.quest.title,
        raw_content: data.rawContent,
        theme_config: data.themeConfig as unknown as Database['public']['Tables']['quests']['Insert']['theme_config'],
        is_published: false
      })
      .select('id')
      .single()

    if (questError || !questData) {
      throw new Error(`Failed to save quest: ${questError?.message}`)
    }

    const questId = questData.id

    // 2. Handle different quest types
    if (data.quest.type === 'smart_quiz') {
      // Smart Quiz: Create a single stage to hold all quizzes
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .insert({
          quest_id: questId,
          title: data.quest.title,
          lesson_summary: '',
          order_index: 0
        })
        .select('id')
        .single()

      if (stageError || !stageData) {
        throw new Error(`Failed to save stage: ${stageError?.message}`)
      }

      // Insert quizzes for this stage
      const quizInserts = data.quest.quizzes.map((quiz, quizIndex) => ({
        stage_id: stageData.id,
        question: quiz.question,
        options: quiz.type === 'multiple_choice' ? quiz.options : [],
        correct_answer: quiz.type === 'multiple_choice' ? quiz.correct_answer : 0,
        explanation: quiz.explanation,
        order_index: quizIndex
      }))

      const { error: quizError } = await supabase
        .from('quizzes')
        .insert(quizInserts)

      if (quizError) {
        throw new Error(`Failed to save quizzes: ${quizError.message}`)
      }
    } else {
      // Quest Course: Insert stages with their quizzes
      for (let stageIndex = 0; stageIndex < data.quest.stages.length; stageIndex++) {
        const stage = data.quest.stages[stageIndex]

        const { data: stageData, error: stageError } = await supabase
          .from('stages')
          .insert({
            quest_id: questId,
            title: stage.title,
            lesson_summary: stage.lesson,
            order_index: stageIndex
          })
          .select('id')
          .single()

        if (stageError || !stageData) {
          throw new Error(`Failed to save stage: ${stageError?.message}`)
        }

        // Insert quizzes for this stage
        const quizInserts = stage.quizzes.map((quiz, quizIndex) => ({
          stage_id: stageData.id,
          question: quiz.question,
          options: quiz.type === 'multiple_choice' ? quiz.options : [],
          correct_answer: quiz.type === 'multiple_choice' ? quiz.correct_answer : 0,
          explanation: quiz.explanation,
          order_index: quizIndex
        }))

        const { error: quizError } = await supabase
          .from('quizzes')
          .insert(quizInserts)

        if (quizError) {
          throw new Error(`Failed to save quizzes: ${quizError.message}`)
        }
      }
    }

    return { questId, success: true }
  })

export const publishQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: { questId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    const { error } = await supabase
      .from('quests')
      .update({ is_published: true })
      .eq('id', data.questId)

    if (error) {
      throw new Error(`Failed to publish quest: ${error.message}`)
    }

    return { success: true }
  })

export const getPublishedQuests = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabasePublic()

    const { data, error } = await supabase
      .from('quests')
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
      throw new Error(`Failed to fetch quests: ${error.message}`)
    }

    return data
  })

export const getQuestById = createServerFn({ method: 'GET' })
  .inputValidator((data: { questId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabasePublic()

    // Fetch quest with all stages and quizzes
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', data.questId)
      .single()

    if (questError || !quest) {
      throw new Error(`Quest not found: ${questError?.message}`)
    }

    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('quest_id', data.questId)
      .order('order_index')

    if (stagesError) {
      throw new Error(`Failed to fetch stages: ${stagesError.message}`)
    }

    // Fetch quizzes for all stages
    const stageIds = stages?.map(s => s.id) || []
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .in('stage_id', stageIds)
      .order('order_index')

    if (quizzesError) {
      throw new Error(`Failed to fetch quizzes: ${quizzesError.message}`)
    }

    // Transform to GeneratedQuest format for compatibility with existing store
    const generatedQuest: GeneratedQuest = {
      title: quest.title,
      stages: (stages || []).map(stage => ({
        title: stage.title,
        lesson: stage.lesson_summary,
        quizzes: (quizzes || [])
          .filter(q => q.stage_id === stage.id)
          .map(q => ({
            question: q.question,
            options: q.options as string[],
            correct_answer: q.correct_answer,
            explanation: q.explanation
          }))
      }))
    }

    return {
      quest,
      generatedQuest,
      themeConfig: quest.theme_config as ThemeConfig
    }
  })

export const getUserQuests = createServerFn({ method: 'GET' })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    const { data: quests, error } = await supabase
      .from('quests')
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
      throw new Error(`Failed to fetch user quests: ${error.message}`)
    }

    return quests
  })

export const incrementPlayCount = createServerFn({ method: 'POST' })
  .inputValidator((data: { questId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabasePublic()

    const { error } = await supabase.rpc('increment_play_count', {
      quest_id: data.questId
    })

    if (error) {
      throw new Error(`Failed to increment play count: ${error.message}`)
    }

    return { success: true }
  })

export const deleteQuest = createServerFn({ method: 'POST' })
  .inputValidator((data: { questId: string; accessToken: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseWithAuth(data.accessToken)

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', data.questId)

    if (error) {
      throw new Error(`Failed to delete quest: ${error.message}`)
    }

    return { success: true }
  })
