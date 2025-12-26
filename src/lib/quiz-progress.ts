// Quiz progress storage for resume functionality

export interface QuizProgress {
  activityId: string
  currentQuizIndex: number
  score: number
  lives: number
  timeLeft: number
  answers: Record<number, number | string> // questionIndex -> selected answer (number for MC, string for subjective)
  timestamp: number // for expiration
  startedAt: string // ISO timestamp when user started playing (from server)
  playRecordId?: string // DB record ID for tracking
  timeLimitMinutes?: number | null // Activity time limit from DB
  availableUntil?: string | null // Availability window end
}

const STORAGE_KEY = 'qzvert_quiz_progress'
const EXPIRATION_HOURS = 24 // Progress expires after 24 hours

export function saveQuizProgress(progress: QuizProgress): void {
  try {
    const data = {
      ...progress,
      timestamp: Date.now()
    }
    localStorage.setItem(`${STORAGE_KEY}_${progress.activityId}`, JSON.stringify(data))
  } catch {
    // localStorage might be unavailable or full
  }
}

export function loadQuizProgress(activityId: string): QuizProgress | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${activityId}`)
    if (!stored) return null

    const progress: QuizProgress = JSON.parse(stored)

    // Check if expired
    const hoursElapsed = (Date.now() - progress.timestamp) / (1000 * 60 * 60)
    if (hoursElapsed > EXPIRATION_HOURS) {
      clearQuizProgress(activityId)
      return null
    }

    return progress
  } catch {
    return null
  }
}

export function clearQuizProgress(activityId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${activityId}`)
  } catch {
    // Ignore errors
  }
}

export function hasQuizProgress(activityId: string): boolean {
  return loadQuizProgress(activityId) !== null
}

// Check if quiz session has expired based on time limit or availability
export function isQuizSessionExpired(progress: QuizProgress): boolean {
  const now = Date.now()

  // Check time limit expiry
  if (progress.timeLimitMinutes && progress.startedAt) {
    const startedAt = new Date(progress.startedAt).getTime()
    const timeLimitMs = progress.timeLimitMinutes * 60 * 1000
    if (now - startedAt >= timeLimitMs) {
      return true
    }
  }

  // Check availability window expiry
  if (progress.availableUntil) {
    const availableUntil = new Date(progress.availableUntil).getTime()
    if (now >= availableUntil) {
      return true
    }
  }

  return false
}

// Calculate remaining seconds based on time limit
export function getRemainingSeconds(progress: QuizProgress): number | null {
  if (!progress.timeLimitMinutes || !progress.startedAt) {
    return null
  }

  const now = Date.now()
  const startedAt = new Date(progress.startedAt).getTime()
  const timeLimitMs = progress.timeLimitMinutes * 60 * 1000
  const remainingMs = timeLimitMs - (now - startedAt)

  return Math.max(0, Math.floor(remainingMs / 1000))
}
