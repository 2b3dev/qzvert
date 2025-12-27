import { create } from 'zustand'
import type { GeneratedQuest, ThemeConfig } from '../types/database'

interface ActivityState {
  currentActivity: GeneratedQuest | null
  currentActivityId: string | null
  currentStageIndex: number
  currentQuizIndex: number
  completedStages: Set<number>
  score: number
  lives: number
  themeConfig: ThemeConfig
  isPlaying: boolean
  rawContent: string | null
  timeLimitMinutes: number | null // Activity time limit from QuestCreator
  ageRange: string | null // Target age range from QuestCreator

  // Actions
  setActivity: (activity: GeneratedQuest, rawContent?: string, activityId?: string) => void
  setTimeLimitMinutes: (minutes: number | null) => void
  setAgeRange: (ageRange: string | null) => void
  setCurrentStage: (index: number) => void
  setCurrentQuiz: (index: number) => void
  completeStage: (stageIndex: number) => void
  addScore: (points: number) => void
  loseLife: () => void
  setThemeConfig: (config: Partial<ThemeConfig>) => void
  startPlaying: () => void
  stopPlaying: () => void
  resetGame: () => void
}

const defaultThemeConfig: ThemeConfig = {
  timerEnabled: false,
  timerSeconds: 300, // 5 minutes default total quiz time
  livesEnabled: true,
  maxLives: 3,
  theme: 'adventure'
}

export const useActivityStore = create<ActivityState>((set) => ({
  currentActivity: null,
  currentActivityId: null,
  currentStageIndex: 0,
  currentQuizIndex: 0,
  completedStages: new Set(),
  score: 0,
  lives: 3,
  themeConfig: defaultThemeConfig,
  isPlaying: false,
  rawContent: null,
  timeLimitMinutes: null,
  ageRange: null,

  setActivity: (activity, rawContent, activityId) => set({
    currentActivity: activity,
    currentActivityId: activityId ?? null,
    currentStageIndex: 0,
    currentQuizIndex: 0,
    completedStages: new Set(),
    score: 0,
    lives: defaultThemeConfig.maxLives,
    rawContent: rawContent ?? null
  }),

  setTimeLimitMinutes: (minutes) => set({ timeLimitMinutes: minutes }),

  setAgeRange: (ageRange) => set({ ageRange }),

  setCurrentStage: (index) => set({ currentStageIndex: index, currentQuizIndex: 0 }),

  setCurrentQuiz: (index) => set({ currentQuizIndex: index }),

  completeStage: (stageIndex) => set((state) => ({
    completedStages: new Set([...state.completedStages, stageIndex])
  })),

  addScore: (points) => set((state) => ({ score: state.score + points })),

  loseLife: () => set((state) => ({ lives: Math.max(0, state.lives - 1) })),

  setThemeConfig: (config) => set((state) => ({
    themeConfig: { ...state.themeConfig, ...config }
  })),

  startPlaying: () => set({ isPlaying: true }),

  stopPlaying: () => set({ isPlaying: false }),

  resetGame: () => set({
    currentActivity: null,
    currentActivityId: null,
    currentStageIndex: 0,
    currentQuizIndex: 0,
    completedStages: new Set(),
    score: 0,
    lives: defaultThemeConfig.maxLives,
    isPlaying: false,
    rawContent: null,
    timeLimitMinutes: null,
    ageRange: null
  })
}))
