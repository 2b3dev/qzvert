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
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          title: string
          raw_content: string
          theme_config?: ThemeConfig
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          title?: string
          raw_content?: string
          theme_config?: ThemeConfig
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

export interface GeneratedQuest {
  title: string
  stages: {
    title: string
    lesson: string
    quizzes: {
      question: string
      options: string[]
      answer: number
      explanation: string
    }[]
  }[]
}
