import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ArrowRight, ArrowLeft, Send, Lock, Check, ChevronDown } from 'lucide-react'
import { useActivityStore } from '../stores/activity-store'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { Textarea } from './ui/input'
import { cn } from '../lib/utils'
import { saveQuizProgress, clearQuizProgress, getRemainingSeconds, isQuizSessionExpired, type QuizProgress } from '../lib/quiz-progress'
import type { GeneratedQuiz, GeneratedSubjectiveQuiz, GeneratedQuest } from '../types/database'

interface QuizPlayerProps {
  onStageComplete: () => void
  onGameOver: () => void
  onQuizComplete?: () => void  // For Smart Quiz mode
  onTimeExpired?: () => void  // When time limit or availability expires
  activityId?: string  // For saving progress
  savedProgress?: QuizProgress | null  // Resume from saved progress
}

// Type guard for subjective quiz
function isSubjectiveQuiz(quiz: GeneratedQuiz): quiz is GeneratedSubjectiveQuiz {
  return quiz.type === 'subjective'
}

// Helper to get quizzes from quest (handles both formats)
function getQuizzesFromQuest(quest: GeneratedQuest | null, stageIndex: number): GeneratedQuiz[] {
  if (!quest) return []

  if (quest.type === 'quiz') {
    // Smart Quiz: flat quizzes array
    return quest.quizzes
  } else {
    // Quest Course: quizzes within stages
    return quest.stages[stageIndex]?.quizzes || []
  }
}

export function QuizPlayer({ onStageComplete, onGameOver, onQuizComplete, onTimeExpired, activityId, savedProgress }: QuizPlayerProps) {
  const {
    currentActivity,
    currentStageIndex,
    currentQuizIndex,
    setCurrentQuiz,
    addScore,
    score,
    themeConfig,
    completeStage
  } = useActivityStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number | string>>(savedProgress?.answers ?? {})
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const hasInitialized = useRef(false)

  // Calculate initial time based on savedProgress or themeConfig
  const getInitialTimeLeft = () => {
    if (savedProgress?.timeLimitMinutes && savedProgress?.startedAt) {
      // Use server-based time limit
      const remaining = getRemainingSeconds(savedProgress)
      return remaining ?? themeConfig.timerSeconds
    }
    return savedProgress?.timeLeft ?? themeConfig.timerSeconds
  }

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft)

  // Handle both Quiz and Quest formats
  const isSmartQuizMode = currentActivity?.type === 'quiz'
  const quizzes = getQuizzesFromQuest(currentActivity, currentStageIndex)
  const quiz = quizzes[currentQuizIndex]
  const totalQuizzes = quizzes.length
  const progress = ((currentQuizIndex + 1) / totalQuizzes) * 100

  const isSubjective = quiz ? isSubjectiveQuiz(quiz) : false

  // Check for expiry on mount and periodically
  useEffect(() => {
    if (savedProgress && isQuizSessionExpired(savedProgress)) {
      setIsLocked(true)
      onTimeExpired?.()
      return
    }
  }, [savedProgress, onTimeExpired])

  // Restore state from saved progress on mount
  useEffect(() => {
    if (savedProgress) {
      if (savedProgress.currentQuizIndex > 0) {
        setCurrentQuiz(savedProgress.currentQuizIndex)
      }
      // Restore score by adding saved score (store starts at 0)
      if (savedProgress.score > 0) {
        addScore(savedProgress.score)
      }
    }
  }, []) // Only run once on mount

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    if (!activityId || !hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    saveQuizProgress({
      activityId,
      currentQuizIndex,
      score,
      lives: 0, // Lives no longer used, keeping for compatibility
      timeLeft,
      answers,
      timestamp: Date.now(),
      startedAt: savedProgress?.startedAt ?? new Date().toISOString(),
      playRecordId: savedProgress?.playRecordId,
      timeLimitMinutes: savedProgress?.timeLimitMinutes,
      availableUntil: savedProgress?.availableUntil
    })
  }, [activityId, currentQuizIndex, score, timeLeft, answers, savedProgress])

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle time expired - lock the quiz
  const handleTimeExpired = useCallback(() => {
    setTimedOut(true)
    setIsLocked(true)
    if (activityId) clearQuizProgress(activityId)
    onTimeExpired?.()
  }, [activityId, onTimeExpired])

  // Timer logic - total quiz time (doesn't reset per question)
  // Uses server-based startedAt if available for anti-cheat
  useEffect(() => {
    if (isLocked || timedOut) return

    // Determine if we should use timer
    const hasTimeLimit = savedProgress?.timeLimitMinutes || themeConfig.timerEnabled
    if (!hasTimeLimit) return

    const timer = setInterval(() => {
      // For server-based time limit, recalculate from startedAt
      if (savedProgress?.timeLimitMinutes && savedProgress?.startedAt) {
        const remaining = getRemainingSeconds(savedProgress)
        if (remaining !== null) {
          setTimeLeft(remaining)
          if (remaining <= 0) {
            handleTimeExpired()
          }
        }
      } else {
        // Fallback to local countdown
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeExpired()
            return 0
          }
          return prev - 1
        })
      }

      // Also check availability window
      if (savedProgress?.availableUntil) {
        const availableUntil = new Date(savedProgress.availableUntil).getTime()
        if (Date.now() >= availableUntil) {
          handleTimeExpired()
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [themeConfig.timerEnabled, timedOut, isLocked, savedProgress, handleTimeExpired])

  // Navigate to specific question
  const navigateToQuestion = (index: number) => {
    if (index < 0 || index >= totalQuizzes || isLocked) return
    setCurrentQuiz(index)
    // Load saved answer for this question if exists
    const savedAnswer = answers[index]
    if (typeof savedAnswer === 'number') {
      setSelectedAnswer(savedAnswer)
    } else if (typeof savedAnswer === 'string') {
      setSubjectiveAnswer(savedAnswer)
    } else {
      setSelectedAnswer(null)
      setSubjectiveAnswer('')
    }
  }

  const handlePrevQuestion = () => {
    navigateToQuestion(currentQuizIndex - 1)
  }

  const handleNextQuestion = () => {
    navigateToQuestion(currentQuizIndex + 1)
  }

  const handleAnswer = (answerIndex: number) => {
    if (!quiz || isSubjective || isLocked) return

    setSelectedAnswer(answerIndex)
    // Save answer (can be changed anytime)
    setAnswers(prev => ({ ...prev, [currentQuizIndex]: answerIndex }))
  }

  // Calculate and submit final score
  const handleSubmitQuiz = () => {
    // Calculate total score based on all answers
    let totalScore = 0
    let correctCount = 0

    quizzes.forEach((q, index) => {
      const userAnswer = answers[index]
      if (userAnswer === undefined) return

      if (isSubjectiveQuiz(q)) {
        // Subjective questions give points for any answer
        if (typeof userAnswer === 'string' && userAnswer.trim()) {
          totalScore += q.points ?? 50
          correctCount++
        }
      } else if ('correct_answer' in q && userAnswer === q.correct_answer) {
        const basePoints = q.points ?? 100
        totalScore += basePoints
        correctCount++
      }
    })

    // Add time bonus for timed quizzes
    if (themeConfig.timerEnabled && timeLeft > 0) {
      const timeBonus = Math.floor((timeLeft / themeConfig.timerSeconds) * 50)
      totalScore += timeBonus
    }

    // Add score to store
    addScore(totalScore)

    // Clear progress on completion
    if (activityId) clearQuizProgress(activityId)

    // For Smart Quiz, call onQuizComplete; for Quest Course, complete stage
    if (isSmartQuizMode) {
      onQuizComplete?.()
    } else {
      completeStage(currentStageIndex)
      onStageComplete()
    }
  }

  // Count answered questions
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === totalQuizzes

  if (!quiz) return null

  // Show locked overlay when time expires
  if (isLocked) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-destructive mb-2">
                หมดเวลา
              </h2>
              <p className="text-muted-foreground mb-4">
                {savedProgress?.availableUntil && new Date(savedProgress.availableUntil) < new Date()
                  ? 'หมดช่วงเวลาที่สามารถเล่นได้'
                  : 'เวลาในการทำข้อสอบหมดแล้ว'}
              </p>
              <div className="text-sm text-muted-foreground mb-6">
                <p>คะแนนที่ได้: <span className="text-primary font-bold">{score}</span> pts</p>
                <p>ตอบไปแล้ว: {currentQuizIndex} / {totalQuizzes} ข้อ</p>
              </div>
              <Button
                variant="outline"
                onClick={() => onTimeExpired?.()}
              >
                ดูผลลัพธ์
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header with Timer */}
      <div className="flex items-center justify-between mb-6">
        {/* Timer - show if themeConfig enabled OR server time limit set */}
        {(themeConfig.timerEnabled || savedProgress?.timeLimitMinutes) && !isSubjective && (
          <motion.div
            animate={{ scale: timeLeft <= 30 ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: timeLeft <= 30 ? Infinity : 0, duration: 0.5 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              timeLeft <= 30 ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"
            )}
          >
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
          </motion.div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">
            {currentQuizIndex + 1} / {totalQuizzes}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="mb-8" />

      {/* Question Card */}
      <motion.div
        key={currentQuizIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
      >
        <Card className="mb-6 bg-gradient-to-br from-card to-secondary/50">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {quiz.question}
            </h2>
            {isSubjective && (
              <p className="text-sm text-muted-foreground">
                เขียนคำตอบของคุณด้านล่าง
              </p>
            )}
          </CardContent>
        </Card>

        {/* Multiple Choice Options */}
        {!isSubjective && 'options' in quiz && (
          <div className="grid gap-3 mb-6">
            {quiz.options.map((option, index) => {
              const isSelected = selectedAnswer === index

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(index)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-300",
                    "hover:border-primary hover:bg-primary/10",
                    isSelected && "border-primary bg-primary/20",
                    !isSelected && "border-border bg-secondary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {isSelected ? <Check className="w-4 h-4" /> : index + 1}
                      </span>
                      <span className="text-foreground">
                        {option}
                      </span>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Subjective Answer Input */}
        {isSubjective && (
          <div className="space-y-4 mb-6">
            <Textarea
              placeholder="พิมพ์คำตอบของคุณที่นี่..."
              value={subjectiveAnswer}
              onChange={(e) => {
                setSubjectiveAnswer(e.target.value)
                // Auto-save on change
                if (e.target.value.trim()) {
                  setAnswers(prev => ({ ...prev, [currentQuizIndex]: e.target.value }))
                }
              }}
              className="min-h-[150px] text-base"
            />
            {subjectiveAnswer.trim() && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                บันทึกคำตอบแล้ว
              </p>
            )}
          </div>
        )}

        {/* Question Picker */}
        <div className="mb-6">
          <button
            onClick={() => setShowQuestionPicker(!showQuestionPicker)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 flex items-center gap-1"
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", showQuestionPicker && "rotate-180")} />
            {showQuestionPicker ? 'ซ่อนรายการข้อ' : 'ดูรายการข้อทั้งหมด'} ({answeredCount}/{totalQuizzes} ตอบแล้ว)
          </button>

          <AnimatePresence>
            {showQuestionPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 p-3 bg-secondary/30 rounded-xl">
                  {Array.from({ length: totalQuizzes }).map((_, index) => {
                    const isAnswered = answers[index] !== undefined
                    const isCurrent = index === currentQuizIndex

                    return (
                      <button
                        key={index}
                        onClick={() => navigateToQuestion(index)}
                        className={cn(
                          "w-7 h-7 rounded font-medium text-xs transition-all relative",
                          isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          isAnswered
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {index + 1}
                        {isAnswered && (
                          <Check className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevQuestion}
            disabled={currentQuizIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-5 h-5" />
            ย้อนกลับ
          </Button>

          {currentQuizIndex < totalQuizzes - 1 ? (
            <Button
              size="lg"
              onClick={handleNextQuestion}
              className="flex-1"
            >
              ถัดไป
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              variant={allAnswered ? "success" : "default"}
              onClick={handleSubmitQuiz}
              disabled={!allAnswered}
              className="flex-1"
            >
              {allAnswered ? (
                <>
                  ส่งคำตอบ
                  <Send className="w-5 h-5" />
                </>
              ) : (
                <>
                  ยังตอบไม่ครบ ({answeredCount}/{totalQuizzes})
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
