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
          category_id: string | null
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
          category_id?: string | null
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
          category_id?: string | null
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
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string | null
          action: 'summarize' | 'craft' | 'translate' | 'generate_quiz' | 'generate_quest' | 'generate_lesson' | 'deep_lesson'
          input_tokens: number
          output_tokens: number
          total_tokens: number
          model: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: 'summarize' | 'craft' | 'translate' | 'generate_quiz' | 'generate_quest' | 'generate_lesson' | 'deep_lesson'
          input_tokens: number
          output_tokens: number
          total_tokens: number
          model?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: 'summarize' | 'craft' | 'translate' | 'generate_quiz' | 'generate_quest' | 'generate_lesson' | 'deep_lesson'
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          model?: string
          created_at?: string
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
  easyExplainEnabled?: boolean // Feynman Mode - อธิบายง่ายๆ สำหรับ Plus/Pro users
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

// AI Usage Log
export type AIAction = 'summarize' | 'craft' | 'translate' | 'generate_quiz' | 'generate_quest' | 'generate_lesson' | 'deep_lesson'

export interface AIUsageLog {
  id: string
  user_id: string | null
  action: AIAction
  input_tokens: number
  output_tokens: number
  total_tokens: number
  model: string
  created_at: string
}

export interface AIUsageStats {
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  requestsByAction: Record<AIAction, number>
  tokensByAction: Record<AIAction, number>
  dailyUsage: Array<{
    date: string
    requests: number
    tokens: number
  }>
  estimatedCost: number // in USD
}

export type AIUsageTimeRange = 'week' | 'month' | 'year'

// ============================================
// Blog/CMS Types
// ============================================

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export interface Post {
  id: string
  user_id: string | null

  // Content
  title: string
  slug: string
  excerpt: string | null
  body: string | null // TipTap JSON or HTML
  thumbnail: string | null

  // Taxonomy
  category_id: string | null
  tags: string[] | null

  // Publishing
  status: PostStatus
  published_at: string | null

  // SEO
  meta_title: string | null
  meta_description: string | null

  // Stats
  view_count: number

  // Flags
  featured: boolean
  pinned: boolean
  allow_comments: boolean

  // Timestamps
  created_at: string
  updated_at: string

  // Relations (optional, populated by joins)
  category?: Category | null
  author?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  comment_count?: number
}

export interface PostInsert {
  id?: string
  user_id?: string | null
  title: string
  slug: string
  excerpt?: string | null
  body?: string | null
  thumbnail?: string | null
  category_id?: string | null
  tags?: string[] | null
  status?: PostStatus
  published_at?: string | null
  meta_title?: string | null
  meta_description?: string | null
  view_count?: number
  featured?: boolean
  pinned?: boolean
  allow_comments?: boolean
  created_at?: string
  updated_at?: string
}

export interface PostUpdate {
  title?: string
  slug?: string
  excerpt?: string | null
  body?: string | null
  thumbnail?: string | null
  category_id?: string | null
  tags?: string[] | null
  status?: PostStatus
  published_at?: string | null
  meta_title?: string | null
  meta_description?: string | null
  featured?: boolean
  pinned?: boolean
  allow_comments?: boolean
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  order_index: number
  created_at: string

  // Relations (optional)
  parent?: Category | null
  children?: Category[]
  post_count?: number
}

export interface CategoryInsert {
  id?: string
  name: string
  slug: string
  description?: string | null
  parent_id?: string | null
  order_index?: number
  created_at?: string
}

export interface CategoryUpdate {
  name?: string
  slug?: string
  description?: string | null
  parent_id?: string | null
  order_index?: number
}

export type CommentStatus = 'pending' | 'approved' | 'spam'

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  body: string
  status: CommentStatus
  created_at: string
  updated_at: string

  // Relations (optional)
  author?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  replies?: Comment[]
  reply_count?: number
}

export interface CommentInsert {
  id?: string
  post_id: string
  user_id: string
  parent_id?: string | null
  body: string
  status?: CommentStatus
  created_at?: string
  updated_at?: string
}

export interface CommentUpdate {
  body?: string
  status?: CommentStatus
  updated_at?: string
}

// ============================================
// Extract Media Types
// ============================================

export type ExtractionInputType =
  | 'youtube'
  | 'web'
  | 'pdf'
  | 'excel'
  | 'doc'
  | 'image'
  | 'text'

export interface ExtractedContent {
  id: string
  user_id: string

  // Input
  input_type: ExtractionInputType
  original_input: string // URL, filename, or raw text
  source_file_path: string | null // Path in Supabase Storage if file was uploaded

  // Extracted
  extracted_text: string

  // AI processed
  summarized_content: string | null
  crafted_content: string | null
  key_points: string[] | null

  // Metadata
  title: string | null
  author: string | null
  duration: string | null // For videos
  page_count: number | null // For PDFs/docs
  word_count: number | null
  language: string | null // Detected language code

  // Timestamps
  created_at: string
  updated_at: string
  last_accessed_at: string
}

export interface ExtractedContentInsert {
  id?: string
  user_id: string
  input_type: ExtractionInputType
  original_input: string
  source_file_path?: string | null
  extracted_text: string
  summarized_content?: string | null
  crafted_content?: string | null
  key_points?: string[] | null
  title?: string | null
  author?: string | null
  duration?: string | null
  page_count?: number | null
  word_count?: number | null
  language?: string | null
}

export interface ExtractedContentUpdate {
  summarized_content?: string | null
  crafted_content?: string | null
  key_points?: string[] | null
  last_accessed_at?: string
}

// Extraction metadata returned from extractors
export interface ExtractionMetadata {
  title?: string
  author?: string
  duration?: string
  pageCount?: number
  wordCount?: number
  language?: string
}

// ============================================
// AI Credit Calculation Types
// ============================================

export type CreditProcessMode = 'original' | 'summarize' | 'lesson' | 'translate'

export interface TokenEstimation {
  inputTokens: number
  estimatedOutputTokens: number
  totalTokens: number
  mode: CreditProcessMode
  easyExplainApplied: boolean
}

export interface CreditCalculation {
  tokens: TokenEstimation
  actualCostUSD: number       // Actual API cost in USD
  actualCostTHB: number       // Actual API cost in THB
  tierMarkup: number          // Markup % or fixed price depending on mode
  finalCostTHB: number        // Final cost after markup in THB
  creditsRequired: number     // Number of credits required
  profitMarginTHB: number     // Profit margin in THB (admin only)
  pricingMode: 'markup' | 'fixed'
}

export interface TierPricing {
  markup: number   // Markup percentage (e.g., 200 = 200%)
  fixed: number    // Fixed price per 1K tokens in THB
}

export interface TierPricingConfig {
  mode: 'markup' | 'fixed'
  tiers: Record<UserRole, TierPricing>
}

export interface TokenEstimationRatios {
  summarize: number           // 40 = 40% of input
  lesson: number              // 85 = 85% of input
  translate: number           // 100 = 100% of input
  easyExplainModifier: number // 20 = +20% additional
}

// Tier subscription pricing settings
export interface TierSubscription {
  packagePrice: number    // THB per month
  monthlyCredits: number  // Credits included per month
  pricePerCredit: number  // THB per credit (calculated: packagePrice / monthlyCredits)
}

export type TierSubscriptionSettings = Record<UserRole, TierSubscription>

// ============================================
// Gemini API Pricing (Hardcoded - Update via code)
// Reference: https://ai.google.dev/gemini-api/docs/pricing
// Last updated: 2026-01-05
// ============================================

export type GeminiModelId =
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-pro'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-preview'

export interface GeminiModelPricing {
  id: GeminiModelId
  name: string
  description: string
  // Standard pricing ($ per 1M tokens)
  input: number
  output: number
  // Extended context pricing (>200K tokens, for pro models)
  inputExtended?: number
  outputExtended?: number
  // Batch API pricing (50% discount)
  batchInput: number
  batchOutput: number
  batchInputExtended?: number
  batchOutputExtended?: number
  // Audio input pricing (different rate)
  audioInput?: number
  batchAudioInput?: number
  // Context caching ($ per 1M tokens per hour)
  contextCacheInput?: number
  contextCacheStorage?: number  // per hour
  // Model capabilities
  contextWindow: number  // in tokens
  recommended?: boolean
}

// Hardcoded Gemini pricing - updated from official docs
// To update: send the pricing page URL to Claude and ask to update
export const GEMINI_PRICING: Record<GeminiModelId, GeminiModelPricing> = {
  // Gemini 2.0 Flash - Fast and efficient (RECOMMENDED)
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and efficient, best value',
    input: 0.10,
    output: 0.40,
    batchInput: 0.05,
    batchOutput: 0.20,
    audioInput: 0.70,
    batchAudioInput: 0.35,
    contextCacheInput: 0.025,
    contextCacheStorage: 0.00,
    contextWindow: 1_000_000,
    recommended: true,
  },

  // Gemini 2.5 Flash - Balanced performance
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Balanced speed and quality',
    input: 0.30,
    output: 2.50,
    batchInput: 0.15,
    batchOutput: 1.25,
    audioInput: 1.00,
    batchAudioInput: 0.50,
    contextCacheInput: 0.075,
    contextCacheStorage: 0.0125,
    contextWindow: 1_000_000,
  },

  // Gemini 2.5 Flash-Lite - Most economical
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'Most economical option',
    input: 0.10,
    output: 0.40,
    batchInput: 0.05,
    batchOutput: 0.20,
    audioInput: 0.30,
    batchAudioInput: 0.15,
    contextCacheInput: 0.025,
    contextCacheStorage: 0.00,
    contextWindow: 1_000_000,
  },

  // Gemini 2.5 Pro - High quality with extended context
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'High quality, extended context',
    input: 1.25,
    output: 10.00,
    inputExtended: 2.50,
    outputExtended: 15.00,
    batchInput: 0.625,
    batchOutput: 5.00,
    batchInputExtended: 1.25,
    batchOutputExtended: 7.50,
    contextCacheInput: 0.3125,
    contextCacheStorage: 0.0625,
    contextWindow: 1_000_000,
  },

  // Gemini 3 Flash Preview - Latest fast model
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    description: 'Latest preview, fast',
    input: 0.50,
    output: 3.00,
    batchInput: 0.25,
    batchOutput: 1.50,
    audioInput: 1.00,
    batchAudioInput: 0.50,
    contextWindow: 1_000_000,
  },

  // Gemini 3 Pro Preview - Latest high quality
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    description: 'Latest preview, highest quality',
    input: 2.00,
    output: 12.00,
    inputExtended: 4.00,
    outputExtended: 18.00,
    batchInput: 1.00,
    batchOutput: 6.00,
    batchInputExtended: 2.00,
    batchOutputExtended: 9.00,
    contextWindow: 1_000_000,
  },
}

// Helper to get model list for UI dropdowns
export const GEMINI_MODELS: Array<{
  id: GeminiModelId
  name: string
  inputPrice: number
  outputPrice: number
  description: string
  recommended?: boolean
}> = Object.values(GEMINI_PRICING).map(m => ({
  id: m.id,
  name: m.name,
  inputPrice: m.input,
  outputPrice: m.output,
  description: m.description,
  recommended: m.recommended,
}))

// Free tier limits (for reference)
export const GEMINI_FREE_TIER = {
  requestsPerMinute: 15,
  tokensPerMinute: 1_000_000,
  requestsPerDay: 1_500,
} as const

// Additional API costs
export const GEMINI_ADDITIONAL_COSTS = {
  // Google Search Grounding
  searchGrounding: {
    freeRequestsPerDay: 500,  // Free tier
    paidRequestsPerDay: 1500, // Paid tier free
    pricePerThousandQueries: 35,  // $ per 1000 queries after free
  },
  // Image generation (Imagen)
  imagen4: {
    fast: 0.02,     // $ per image
    standard: 0.04,
    ultra: 0.06,
  },
  imagen3: {
    standard: 0.03, // $ per image
  },
  // Video generation (Veo)
  veo: {
    perSecond: 0.15, // $ per second (720p)
    perSecondHD: 0.40, // $ per second (1080p)
  },
  // Embeddings
  embedding: {
    standard: 0.15, // $ per 1M tokens
    batch: 0.075,
  },
} as const

// Legacy type for backward compatibility
export interface GeminiModelConfig {
  id: GeminiModelId
  name: string
  inputPrice: number
  outputPrice: number
  description: string
}

export interface CreditSettings {
  tokenEstimationRatios: TokenEstimationRatios
  tierPricingConfig: TierPricingConfig
  creditConversionRate: number  // Credits per THB (e.g., 100 = 1 THB = 100 credits)
  usdToThbRate: number          // USD to THB exchange rate
  geminiModel: GeminiModelId    // Selected Gemini model
  geminiInputPrice: number      // $ per 1M input tokens
  geminiOutputPrice: number     // $ per 1M output tokens
  tokensPerCredit: number       // How many tokens = 1 credit (e.g., 50 = 50 tokens per credit)
  tierSubscriptions: TierSubscriptionSettings  // Tier subscription settings
  minMarginThreshold: number    // Minimum margin % threshold for warnings
}

// Default values for credit settings
export const DEFAULT_TOKEN_ESTIMATION_RATIOS: TokenEstimationRatios = {
  summarize: 40,        // 40% of input (shorter output)
  lesson: 100,          // 100% of input (full content expansion)
  translate: 100,       // 100% of input (same length)
  easyExplainModifier: 20, // +20% additional (for simpler explanations)
}

export const DEFAULT_TIER_PRICING_CONFIG: TierPricingConfig = {
  mode: 'markup',
  tiers: {
    user: { markup: 200, fixed: 0.50 },
    plus: { markup: 150, fixed: 0.30 },
    pro: { markup: 100, fixed: 0.20 },
    ultra: { markup: 80, fixed: 0.15 },
    admin: { markup: 0, fixed: 0 },
  },
}

// Default tier subscription settings
// Pricing: Plus ฿199, Pro ฿599, Ultra ฿999
// Higher tiers = lower price per credit (more value)
export const DEFAULT_TIER_SUBSCRIPTIONS: TierSubscriptionSettings = {
  user: { packagePrice: 0, monthlyCredits: 10, pricePerCredit: 0 },        // Free tier
  plus: { packagePrice: 199, monthlyCredits: 300, pricePerCredit: 0.66 },  // ฿0.66/credit
  pro: { packagePrice: 599, monthlyCredits: 1200, pricePerCredit: 0.50 }, // ฿0.50/credit (24% cheaper)
  ultra: { packagePrice: 999, monthlyCredits: 2500, pricePerCredit: 0.40 }, // ฿0.40/credit (39% cheaper)
  admin: { packagePrice: 0, monthlyCredits: 0, pricePerCredit: 0 },        // Unlimited
}

export const DEFAULT_CREDIT_SETTINGS: CreditSettings = {
  tokenEstimationRatios: DEFAULT_TOKEN_ESTIMATION_RATIOS,
  tierPricingConfig: DEFAULT_TIER_PRICING_CONFIG,
  creditConversionRate: 100,  // 1 THB = 100 credits (legacy, calculated now)
  usdToThbRate: 35,           // 1 USD = 35 THB
  geminiModel: 'gemini-2.0-flash',  // Default model
  geminiInputPrice: 0.10,     // $0.10 per 1M input tokens
  geminiOutputPrice: 0.40,    // $0.40 per 1M output tokens
  tokensPerCredit: 2000,      // 1 credit ≈ 1 typical AI request (~2000 tokens)
  tierSubscriptions: DEFAULT_TIER_SUBSCRIPTIONS,
  minMarginThreshold: 50,     // Default 50% minimum margin threshold
}
