import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Timer, CheckCircle, XCircle, ArrowRight, Trophy, Star } from 'lucide-react'
import { useQuestStore } from '../stores/quest-store'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { cn } from '../lib/utils'

interface QuizPlayerProps {
  onStageComplete: () => void
  onGameOver: () => void
}

export function QuizPlayer({ onStageComplete, onGameOver }: QuizPlayerProps) {
  const {
    currentQuest,
    currentStageIndex,
    currentQuizIndex,
    setCurrentQuiz,
    lives,
    loseLife,
    addScore,
    themeConfig,
    completeStage
  } = useQuestStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(themeConfig.timerSeconds)

  const stage = currentQuest?.stages[currentStageIndex]
  const quiz = stage?.quizzes[currentQuizIndex]
  const totalQuizzes = stage?.quizzes.length || 0
  const progress = ((currentQuizIndex + 1) / totalQuizzes) * 100

  // Timer logic
  useEffect(() => {
    if (!themeConfig.timerEnabled || showResult) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout()
          return themeConfig.timerSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [themeConfig.timerEnabled, showResult, currentQuizIndex])

  const handleTimeout = useCallback(() => {
    if (themeConfig.livesEnabled) {
      loseLife()
      if (lives <= 1) {
        onGameOver()
        return
      }
    }
    setSelectedAnswer(-1)
    setIsCorrect(false)
    setShowResult(true)
  }, [lives, loseLife, onGameOver, themeConfig.livesEnabled])

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return

    setSelectedAnswer(answerIndex)
    const correct = answerIndex === quiz?.correct_answer
    setIsCorrect(correct)

    if (correct) {
      const basePoints = 100
      const timeBonus = themeConfig.timerEnabled ? Math.floor(timeLeft * 2) : 0
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

  const handleNext = () => {
    if (currentQuizIndex < totalQuizzes - 1) {
      setCurrentQuiz(currentQuizIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(themeConfig.timerSeconds)
    } else {
      completeStage(currentStageIndex)
      onStageComplete()
    }
  }

  if (!quiz) return null

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header with Lives and Timer */}
      <div className="flex items-center justify-between mb-6">
        {/* Lives */}
        {themeConfig.livesEnabled && (
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
                    i < lives ? "text-red-500 fill-red-500" : "text-slate-700"
                  )}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Timer */}
        {themeConfig.timerEnabled && (
          <motion.div
            animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              timeLeft <= 5 ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300"
            )}
          >
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold text-lg">{timeLeft}s</span>
          </motion.div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 text-slate-400">
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
        <Card className="mb-6 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {quiz.question}
            </h2>
          </CardContent>
        </Card>

        {/* Answer Options */}
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
                  !showResult && "hover:border-purple-500 hover:bg-purple-500/10",
                  !showResult && isSelected && "border-purple-500 bg-purple-500/20",
                  !showResult && !isSelected && "border-slate-700 bg-slate-800/50",
                  showAsCorrect && "border-green-500 bg-green-500/20 text-green-300",
                  showAsWrong && "border-red-500 bg-red-500/20 text-red-300",
                  showResult && !showAsCorrect && !showAsWrong && "border-slate-700 bg-slate-800/30 opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      showAsCorrect && "bg-green-500 text-white",
                      showAsWrong && "bg-red-500 text-white",
                      !showResult && "bg-slate-700 text-slate-300"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={cn(
                      showResult ? (showAsCorrect ? "text-green-300" : showAsWrong ? "text-red-300" : "text-slate-500") : "text-slate-200"
                    )}>
                      {option}
                    </span>
                  </div>
                  {showAsCorrect && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {showAsWrong && <XCircle className="w-6 h-6 text-red-400" />}
                </div>
              </motion.button>
            )
          })}
        </div>

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
                isCorrect ? "border-green-500/50 bg-green-500/10" : "border-amber-500/50 bg-amber-500/10"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <div className="p-2 rounded-full bg-green-500/20">
                        <Trophy className="w-6 h-6 text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-amber-500/20">
                        <Star className="w-6 h-6 text-amber-400" />
                      </div>
                    )}
                    <div>
                      <h3 className={cn(
                        "font-bold text-lg mb-2",
                        isCorrect ? "text-green-300" : "text-amber-300"
                      )}>
                        {isCorrect ? "Excellent!" : "Almost there!"}
                      </h3>
                      <p className="text-slate-300">{quiz.explanation}</p>
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
