export interface Database {
  public: {
    Tables: {
      quests: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          title: string
          raw_content: string
          theme_config: ThemeConfig
          is_published: boolean
          play_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          title: string
          raw_content: string
          theme_config?: ThemeConfig
          is_published?: boolean
          play_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          title?: string
          raw_content?: string
          theme_config?: ThemeConfig
          is_published?: boolean
          play_count?: number
        }
      }
      stages: {
        Row: {
          id: string
          quest_id: string
          title: string
          lesson_summary: string
          order_index: number
        }
        Insert: {
          id?: string
          quest_id: string
          title: string
          lesson_summary: string
          order_index: number
        }
        Update: {
          id?: string
          quest_id?: string
          title?: string
          lesson_summary?: string
          order_index?: number
        }
      }
      quizzes: {
        Row: {
          id: string
          stage_id: string
          question: string
          options: string[]
          correct_answer: number
          explanation: string
        }
        Insert: {
          id?: string
          stage_id: string
          question: string
          options: string[]
          correct_answer: number
          explanation: string
        }
        Update: {
          id?: string
          stage_id?: string
          question?: string
          options?: string[]
          correct_answer?: number
          explanation?: string
        }
      }
      embeddings: {
        Row: {
          id: string
          quest_id: string
          vector_data: number[]
        }
        Insert: {
          id?: string
          quest_id: string
          vector_data: number[]
        }
        Update: {
          id?: string
          quest_id?: string
          vector_data?: number[]
        }
      }
    }
  }
}

export interface ThemeConfig {
  timerEnabled: boolean
  timerSeconds: number
  livesEnabled: boolean
  maxLives: number
  theme: 'adventure' | 'space' | 'fantasy' | 'science'
}

export interface Quest {
  id: string
  created_at: string
  user_id: string | null
  title: string
  raw_content: string
  theme_config: ThemeConfig
  is_published: boolean
  play_count: number
  stages?: Stage[]
}

export interface Stage {
  id: string
  quest_id: string
  title: string
  lesson_summary: string
  order_index: number
  quizzes?: Quiz[]
}

export interface Quiz {
  id: string
  stage_id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

export type QuizType = 'multiple_choice' | 'subjective'

export interface GeneratedQuizBase {
  question: string
  explanation: string
  type?: QuizType
}

export interface GeneratedMultipleChoiceQuiz extends GeneratedQuizBase {
  type?: 'multiple_choice'
  options: string[]
  correct_answer: number
}

export interface GeneratedSubjectiveQuiz extends GeneratedQuizBase {
  type: 'subjective'
  model_answer: string
}

export type GeneratedQuiz = GeneratedMultipleChoiceQuiz | GeneratedSubjectiveQuiz

// Smart Quiz format (flat quizzes, no stages)
export interface GeneratedSmartQuiz {
  title: string
  type: 'smart_quiz'
  tags?: string[]
  quizzes: GeneratedQuiz[]
}

// Quest Course format (stages + lessons + quizzes)
export interface GeneratedQuestCourse {
  title: string
  type: 'quest_course'
  tags?: string[]
  stages: {
    title: string
    lesson: string
    quizzes: GeneratedQuiz[]
  }[]
}

// Union type for both formats
export type GeneratedQuest = GeneratedSmartQuiz | GeneratedQuestCourse

// Type guard helpers
export function isSmartQuiz(quest: GeneratedQuest): quest is GeneratedSmartQuiz {
  return quest.type === 'smart_quiz'
}

export function isQuestCourse(quest: GeneratedQuest): quest is GeneratedQuestCourse {
  return quest.type === 'quest_course'
}

// Profile types
export type UserRole = 'learner' | 'creator' | 'admin'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProfileUpdate {
  display_name?: string
  avatar_url?: string
  metadata?: Record<string, unknown>
}
