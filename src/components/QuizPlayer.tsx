import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Timer, CheckCircle, XCircle, ArrowRight, Trophy, Star, Send } from 'lucide-react'
import { useCreationStore } from '../stores/creation-store'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { Textarea } from './ui/input'
import { cn } from '../lib/utils'
import type { GeneratedQuiz, GeneratedSubjectiveQuiz, GeneratedQuest, isSmartQuiz } from '../types/database'

interface QuizPlayerProps {
  onStageComplete: () => void
  onGameOver: () => void
  onQuizComplete?: () => void  // For Smart Quiz mode
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

export function QuizPlayer({ onStageComplete, onGameOver, onQuizComplete }: QuizPlayerProps) {
  const {
    currentCreation,
    currentStageIndex,
    currentQuizIndex,
    setCurrentQuiz,
    lives,
    loseLife,
    addScore,
    themeConfig,
    completeStage
  } = useCreationStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(themeConfig.timerSeconds)
  const [timedOut, setTimedOut] = useState(false)

  // Handle both Quiz and Quest formats
  const isSmartQuizMode = currentCreation?.type === 'quiz'
  const quizzes = getQuizzesFromQuest(currentCreation, currentStageIndex)
  const quiz = quizzes[currentQuizIndex]
  const totalQuizzes = quizzes.length
  const progress = ((currentQuizIndex + 1) / totalQuizzes) * 100

  const isSubjective = quiz ? isSubjectiveQuiz(quiz) : false

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Timer logic - total quiz time (doesn't reset per question)
  useEffect(() => {
    if (!themeConfig.timerEnabled || timedOut) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [themeConfig.timerEnabled, timedOut])

  const handleTimeout = useCallback(() => {
    setTimedOut(true)
    // When time is up, end the quiz
    if (isSmartQuizMode) {
      onQuizComplete?.()
    } else {
      onGameOver()
    }
  }, [isSmartQuizMode, onQuizComplete, onGameOver])

  const handleAnswer = (answerIndex: number) => {
    if (showResult || !quiz || isSubjective) return

    setSelectedAnswer(answerIndex)
    const correct = answerIndex === (quiz as any).correct_answer
    setIsCorrect(correct)

    if (correct) {
      // Use custom points if set, otherwise default to 100
      const basePoints = quiz.points ?? 100
      // Time bonus based on percentage of time remaining
      const timeBonus = themeConfig.timerEnabled
        ? Math.floor((timeLeft / themeConfig.timerSeconds) * 50)
        : 0
      addScore(basePoints + timeBonus)
    } else if (themeConfig.livesEnabled) {
      loseLife()
      if (lives <= 1) {
        setShowResult(true)
        setTimeout(onGameOver, 2000)
        return
      }
    }

    setShowResult(true)
  }

  const handleSubjectiveSubmit = () => {
    if (showResult || !subjectiveAnswer.trim() || !quiz) return

    // For subjective questions, we always give points for submitting an answer
    // Use custom points if set, otherwise default to 50 for subjective
    const basePoints = quiz.points ?? 50
    addScore(basePoints)
    setIsCorrect(true)
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuizIndex < totalQuizzes - 1) {
      setCurrentQuiz(currentQuizIndex + 1)
      setSelectedAnswer(null)
      setSubjectiveAnswer('')
      setShowResult(false)
      // Don't reset timer - it's total quiz time, not per-question
    } else {
      // For Smart Quiz, call onQuizComplete; for Quest Course, complete stage
      if (isSmartQuizMode) {
        onQuizComplete?.()
      } else {
        completeStage(currentStageIndex)
        onStageComplete()
      }
    }
  }

  if (!quiz) return null

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header with Lives and Timer */}
      <div className="flex items-center justify-between mb-6">
        {/* Lives */}
        {themeConfig.livesEnabled && !isSubjective && (
          <div className="flex items-center gap-1">
            {Array.from({ length: themeConfig.maxLives }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 1 }}
                animate={{ scale: i < lives ? 1 : 0.8 }}
              >
                <Heart
                  className={cn(
                    "w-8 h-8 transition-all duration-300",
                    i < lives ? "text-destructive fill-destructive" : "text-muted-foreground/30"
                  )}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Timer */}
        {themeConfig.timerEnabled && !isSubjective && (
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
              const isCorrectAnswer = index === quiz.correct_answer
              const showAsCorrect = showResult && isCorrectAnswer
              const showAsWrong = showResult && isSelected && !isCorrect

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-300",
                    !showResult && "hover:border-primary hover:bg-primary/10",
                    !showResult && isSelected && "border-primary bg-primary/20",
                    !showResult && !isSelected && "border-border bg-secondary/50",
                    showAsCorrect && "border-emerald-500 bg-emerald-500/20 text-emerald-300",
                    showAsWrong && "border-destructive bg-destructive/20 text-destructive",
                    showResult && !showAsCorrect && !showAsWrong && "border-border bg-secondary/30 opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        showAsCorrect && "bg-emerald-500 text-white",
                        showAsWrong && "bg-destructive text-white",
                        !showResult && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>
                      <span className={cn(
                        showResult ? (showAsCorrect ? "text-emerald-300" : showAsWrong ? "text-destructive" : "text-muted-foreground") : "text-foreground"
                      )}>
                        {option}
                      </span>
                    </div>
                    {showAsCorrect && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                    {showAsWrong && <XCircle className="w-6 h-6 text-destructive" />}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Subjective Answer Input */}
        {isSubjective && !showResult && (
          <div className="space-y-4 mb-6">
            <Textarea
              placeholder="พิมพ์คำตอบของคุณที่นี่..."
              value={subjectiveAnswer}
              onChange={(e) => setSubjectiveAnswer(e.target.value)}
              className="min-h-[150px] text-base"
            />
            <Button
              size="lg"
              className="w-full"
              onClick={handleSubjectiveSubmit}
              disabled={!subjectiveAnswer.trim()}
            >
              <Send className="w-5 h-5" />
              ส่งคำตอบ
            </Button>
          </div>
        )}

        {/* Result Feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
            >
              <Card className={cn(
                "mb-6",
                isCorrect ? "border-emerald-500/50 bg-emerald-500/10" : "border-amber-500/50 bg-amber-500/10"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <div className="p-2 rounded-full bg-emerald-500/20">
                        <Trophy className="w-6 h-6 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-amber-500/20">
                        <Star className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-bold text-lg mb-2",
                        isCorrect ? "text-emerald-300" : "text-amber-300"
                      )}>
                        {isCorrect ? "Excellent!" : "Almost there!"}
                      </h3>

                      {/* Show model answer for subjective questions */}
                      {isSubjective && 'model_answer' in quiz && (
                        <div className="mb-4 p-4 bg-secondary/50 rounded-lg">
                          <p className="text-sm font-medium text-foreground mb-2">คำตอบตัวอย่าง:</p>
                          <p className="text-muted-foreground">{quiz.model_answer}</p>
                        </div>
                      )}

                      <p className="text-muted-foreground">{quiz.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full"
                variant={isCorrect ? "success" : "default"}
                onClick={handleNext}
              >
                {currentQuizIndex < totalQuizzes - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : isSmartQuizMode ? (
                  <>
                    Complete Quiz
                    <Trophy className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Complete Stage
                    <Trophy className="w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
