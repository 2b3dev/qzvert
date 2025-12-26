// Activity visibility status (must be defined before Database interface)
export type ActivityStatus = 'draft' | 'private_group' | 'link' | 'public'

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          title: string
          description: string | null
          thumbnail: string | null
          tags: string[] | null
          raw_content: string
          theme_config: ThemeConfig
          play_count: number
          type: 'quiz' | 'quest' | 'flashcard' | 'roleplay'
          status: ActivityStatus
          replay_limit: number | null
          available_from: string | null
          available_until: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          title: string
          description?: string | null
          thumbnail?: string | null
          tags?: string[] | null
          raw_content: string
          theme_config?: ThemeConfig
          play_count?: number
          type: 'quiz' | 'quest' | 'flashcard' | 'roleplay'
          status?: ActivityStatus
          replay_limit?: number | null
          available_from?: string | null
          available_until?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          title?: string
          description?: string | null
          thumbnail?: string | null
          tags?: string[] | null
          raw_content?: string
          theme_config?: ThemeConfig
          play_count?: number
          type?: 'quiz' | 'quest' | 'flashcard'
          status?: ActivityStatus
          replay_limit?: number | null
          available_from?: string | null
          available_until?: string | null
        }
      }
      stages: {
        Row: {
          id: string
          activity_id: string
          title: string
          lesson_summary: string
          order_index: number
        }
        Insert: {
          id?: string
          activity_id: string
          title: string
          lesson_summary: string
          order_index: number
        }
        Update: {
          id?: string
          activity_id?: string
          title?: string
          lesson_summary?: string
          order_index?: number
        }
      }
      questions: {
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
          activity_id: string
          vector_data: number[]
        }
        Insert: {
          id?: string
          activity_id: string
          vector_data: number[]
        }
        Update: {
          id?: string
          activity_id?: string
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

export const ACTIVITY_STATUS_OPTIONS: { value: ActivityStatus; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Only you can see this' },
  { value: 'private_group', label: 'Private Group', description: 'Share with specific users' },
  { value: 'link', label: 'Link', description: 'Anyone with the link can access' },
  { value: 'public', label: 'Public', description: 'Visible to everyone' },
]

export interface Activity {
  id: string
  created_at: string
  user_id: string | null
  title: string
  description: string | null
  thumbnail: string | null
  tags: string[] | null
  raw_content: string
  theme_config: ThemeConfig
  status: ActivityStatus
  play_count: number
  type: 'quiz' | 'quest' | 'flashcard' | 'roleplay'
  stages?: Stage[]
  // Replay & Availability settings
  replay_limit: number | null // null = unlimited, 1 = once, n = max n times
  available_from: string | null // ISO 8601 timestamp (UTC)
  available_until: string | null // ISO 8601 timestamp (UTC)
}

export interface Stage {
  id: string
  activity_id: string
  title: string
  lesson_summary: string
  order_index: number
  questions?: Question[]
}

export interface Question {
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
  points?: number // Custom points for this question (default: 100)
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

// Quiz format (flat quizzes, no stages)
export interface GeneratedSmartQuiz {
  title: string
  description?: string
  thumbnail?: string
  type: 'quiz'
  tags?: string[]
  age_range?: string
  quizzes: GeneratedQuiz[]
}

// Quest format (stages + lessons + quizzes)
export interface GeneratedQuestCourse {
  title: string
  description?: string
  thumbnail?: string
  type: 'quest'
  tags?: string[]
  age_range?: string
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
  return quest.type === 'quiz'
}

export function isQuestCourse(quest: GeneratedQuest): quest is GeneratedQuestCourse {
  return quest.type === 'quest'
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

// Activity Play Records
export interface ActivityPlayRecord {
  id: string
  activity_id: string
  user_id: string
  played_at: string
  score: number | null
  duration_seconds: number | null
  completed: boolean
}

// Can User Play Result (from Supabase function)
export type CanPlayReason =
  | 'unlimited'
  | 'within_limit'
  | 'activity_not_found'
  | 'not_yet_available'
  | 'expired'
  | 'replay_limit_reached'

export interface CanUserPlayResult {
  can_play: boolean
  reason: CanPlayReason
  available_from?: string
  available_until?: string
  plays_used?: number
  plays_remaining?: number
  replay_limit?: number
}
