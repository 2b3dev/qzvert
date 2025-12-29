// Activity visibility status (must be defined before Database interface)
export type ActivityStatus = 'draft' | 'private_group' | 'link' | 'public'

// Profile types (must be defined before Database interface)
export type UserRole = 'user' | 'plus' | 'pro' | 'ultra' | 'admin'

// JSON types for metadata fields
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

// Can User Play Result (from Supabase function) - must be defined before Database interface
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
          type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
          status: ActivityStatus
          replay_limit: number | null
          available_from: string | null
          available_until: string | null
          time_limit_minutes: number | null
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
          type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
          status?: ActivityStatus
          replay_limit?: number | null
          available_from?: string | null
          available_until?: string | null
          time_limit_minutes?: number | null
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
          type?: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
          status?: ActivityStatus
          replay_limit?: number | null
          available_from?: string | null
          available_until?: string | null
          time_limit_minutes?: number | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          role: UserRole
          ai_credits: number
          metadata: JsonObject
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          ai_credits?: number
          metadata?: JsonObject
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          ai_credits?: number
          metadata?: JsonObject
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      activity_pending_invites: {
        Row: {
          id: string
          activity_id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      activity_play_records: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          played_at: string
          started_at: string
          score: number | null
          duration_seconds: number | null
          completed: boolean
          activities?: {
            title: string
            thumbnail: string | null
            type: string
          } | null
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          played_at?: string
          started_at?: string
          score?: number | null
          duration_seconds?: number | null
          completed?: boolean
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          played_at?: string
          started_at?: string
          score?: number | null
          duration_seconds?: number | null
          completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'activity_play_records_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          }
        ]
      }
      reports: {
        Row: {
          id: string
          content_type: 'activity' | 'media' | 'comment' | 'profile'
          content_id: string
          reporter_id: string | null
          reason: 'inappropriate' | 'spam' | 'copyright' | 'misinformation' | 'harassment' | 'other'
          additional_info: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_type: 'activity' | 'media' | 'comment' | 'profile'
          content_id: string
          reporter_id?: string | null
          reason: 'inappropriate' | 'spam' | 'copyright' | 'misinformation' | 'harassment' | 'other'
          additional_info?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_type?: 'activity' | 'media' | 'comment' | 'profile'
          content_id?: string
          reporter_id?: string | null
          reason?: 'inappropriate' | 'spam' | 'copyright' | 'misinformation' | 'harassment' | 'other'
          additional_info?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          collection_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_id: string
          collection_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_id?: string
          collection_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saved_items_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saved_items_collection_id_fkey'
            columns: ['collection_id']
            isOneToOne: false
            referencedRelation: 'collections'
            referencedColumns: ['id']
          }
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: JsonValue
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          value: JsonValue
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: JsonValue
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      soft_delete_account: {
        Args: { user_id: string }
        Returns: undefined
      }
      restore_account: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      can_user_play_activity: {
        Args: { p_activity_id: string; p_user_id: string }
        Returns: CanUserPlayResult
      }
      record_activity_play: {
        Args: {
          p_activity_id: string
          p_user_id: string
          p_score: number | null
          p_duration_seconds: number | null
          p_completed: boolean
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
  type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
  stages?: Stage[]
  // Replay & Availability settings
  replay_limit: number | null // null = unlimited, 1 = once, n = max n times
  available_from: string | null // ISO 8601 timestamp (UTC)
  available_until: string | null // ISO 8601 timestamp (UTC)
  time_limit_minutes: number | null // null = unlimited, number = max minutes to complete
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

// Lesson format (content modules without quizzes)
export interface LessonContentBlock {
  type: 'text' | 'image' | 'video' | 'heading' | 'list'
  content: string
  metadata?: {
    url?: string // for image/video
    level?: number // for heading (1-3)
    items?: string[] // for list
  }
}

export interface GeneratedLesson {
  title: string
  description?: string
  thumbnail?: string
  type: 'lesson'
  tags?: string[]
  age_range?: string
  modules: {
    title: string
    content_blocks: LessonContentBlock[]
  }[]
}

// Union type for all formats
export type GeneratedQuest = GeneratedSmartQuiz | GeneratedQuestCourse | GeneratedLesson

// Type guard helpers
export function isSmartQuiz(quest: GeneratedQuest): quest is GeneratedSmartQuiz {
  return quest.type === 'quiz'
}

export function isQuestCourse(quest: GeneratedQuest): quest is GeneratedQuestCourse {
  return quest.type === 'quest'
}

export function isLesson(quest: GeneratedQuest): quest is GeneratedLesson {
  return quest.type === 'lesson'
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  ai_credits: number
  metadata: JsonObject
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProfileUpdate {
  display_name?: string
  avatar_url?: string
  metadata?: JsonObject
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

// Collections & Saved Items
export interface Collection {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface SavedItem {
  id: string
  user_id: string
  activity_id: string
  collection_id: string | null // null = "All Saved" (no specific collection)
  created_at: string
}

export interface SavedItemWithActivity extends SavedItem {
  activity: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
    play_count: number
  }
}

export interface CollectionWithCount extends Collection {
  item_count: number
}
