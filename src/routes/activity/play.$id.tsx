import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Home, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ActivityBlockedState,
  GameOverScreen,
  LessonScreen,
  PlayHeader,
  PlayingHeader,
  QuestCompleteScreen,
  QuestIntro,
  QuizCompleteScreen,
  QuizIntro,
  StageCompleteScreen,
  TimeExpiredScreen,
} from '../../components/play'
import { QuizPlayer } from '../../components/QuizPlayer'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  clearQuizProgress,
  isQuizSessionExpired,
  loadQuizProgress,
} from '../../lib/quiz-progress'
import {
  checkCanUserPlay,
  getActivityById,
  incrementPlayCount,
  recordPlay,
  updatePlayRecord,
} from '../../server/activities'
import { useActivityStore } from '../../stores/activity-store'
import { useAuthStore } from '../../stores/auth-store'
import { isQuestCourse } from '../../types/database'
import type { Activity, CanUserPlayResult } from '../../types/database'
import type { QuizProgress } from '../../lib/quiz-progress'

export const Route = createFileRoute('/activity/play/$id')({
  component: ActivityPlayPage,
})

type GameState =
  | 'intro'
  | 'lesson'
  | 'playing'
  | 'stage_complete'
  | 'game_over'
  | 'quest_complete'
  | 'quiz_complete'
  | 'time_expired'

function ActivityPlayPage() {
  const navigate = useNavigate()
  const { id: activityId } = Route.useParams()
  const {
    currentActivity,
    currentActivityId,
    currentStageIndex,
    setCurrentStage,
    setActivity,
    setThemeConfig,
    startPlaying,
    score,
    resetGame,
    stopPlaying,
  } = useActivityStore()
  const { session, user, signOut } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [gameState, setGameState] = useState<GameState>('intro')
  const [canPlayResult, setCanPlayResult] = useState<CanUserPlayResult | null>(
    null,
  )
  const [playRecordId, setPlayRecordId] = useState<string | null>(null)
  const [savedProgress, setSavedProgress] = useState<QuizProgress | null>(null)
  const [activityTimeLimit, setActivityTimeLimit] = useState<number | null>(null)
  const [activityAvailableUntil, setActivityAvailableUntil] = useState<
    string | null
  >(null)

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: '/' })
  }

  // Check for saved progress on mount
  useEffect(() => {
    const progress = loadQuizProgress(activityId)
    if (progress) {
      if (isQuizSessionExpired(progress)) {
        clearQuizProgress(activityId)
        setSavedProgress(null)
      } else {
        setSavedProgress(progress)
      }
    }
  }, [activityId])

  // Load activity if not already loaded or if different id
  useEffect(() => {
    const loadActivity = async () => {
      if (currentActivityId === activityId && currentActivity) return

      setIsLoading(true)
      try {
        const data = await getActivityById({ data: { activityId } })
        const activity = data.activity as Activity
        setActivity(data.generatedQuest, activity.raw_content, activityId)
        setThemeConfig(data.themeConfig)
        setActivityTimeLimit(activity.time_limit_minutes ?? null)
        setActivityAvailableUntil(activity.available_until ?? null)

        const canPlay = await checkCanUserPlay({ data: { activityId } })
        setCanPlayResult(canPlay)
      } catch (error) {
        toast.error('Failed to load content')
        navigate({ to: '/' })
      } finally {
        setIsLoading(false)
      }
    }

    loadActivity()
  }, [
    activityId,
    currentActivityId,
    currentActivity,
    setActivity,
    setThemeConfig,
    navigate,
    session,
  ])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (!currentActivity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Content Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This content doesn't exist or has been removed
            </p>
            <Button onClick={() => navigate({ to: '/' })}>
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Blocked state
  const isBlocked = canPlayResult && !canPlayResult.can_play
  if (isBlocked) {
    return (
      <ActivityBlockedState
        canPlayResult={canPlayResult}
        onBackHome={() => navigate({ to: '/' })}
      />
    )
  }

  // Activity type helpers
  const isSmartQuizMode = currentActivity.type === 'quiz'
  const isQuestMode = isQuestCourse(currentActivity)
  const questActivity = isQuestMode ? currentActivity : null
  const quizActivity = isSmartQuizMode ? currentActivity : null
  const stage = questActivity?.stages[currentStageIndex]
  const isLastStage = questActivity
    ? currentStageIndex === questActivity.stages.length - 1
    : true
  const totalQuizzes = isSmartQuizMode ? quizActivity!.quizzes.length : 0

  // Handlers
  const handleStartQuiz = async () => {
    clearQuizProgress(activityId)
    const startedAt = new Date().toISOString()
    let recordId: string | undefined

    // Increment play count for activity
    try {
      await incrementPlayCount({ data: { activityId } })
    } catch {
      // Ignore error, continue playing
    }

    if (session) {
      try {
        const result = await recordPlay({
          data: { activityId, completed: false },
        })
        recordId = result.playRecordId
        setPlayRecordId(recordId)
      } catch {
        // Ignore error, continue playing
      }
    }

    const initialProgress: QuizProgress = {
      activityId,
      currentQuizIndex: 0,
      score: 0,
      lives: 3,
      timeLeft: activityTimeLimit ? activityTimeLimit * 60 : 300,
      answers: {},
      timestamp: Date.now(),
      startedAt,
      playRecordId: recordId,
      timeLimitMinutes: activityTimeLimit,
      availableUntil: activityAvailableUntil,
    }
    setSavedProgress(initialProgress)
    startPlaying()
    setGameState('playing')
  }

  const handleResumeQuiz = () => {
    if (!savedProgress) return
    startPlaying()
    setGameState('playing')
  }

  const handleDiscardProgress = () => {
    clearQuizProgress(activityId)
    setSavedProgress(null)
  }

  const handleStartQuest = async () => {
    // Increment play count for activity
    try {
      await incrementPlayCount({ data: { activityId } })
    } catch {
      // Ignore error, continue playing
    }

    if (session) {
      try {
        const result = await recordPlay({
          data: { activityId, completed: false },
        })
        setPlayRecordId(result.playRecordId)
      } catch {
        // Ignore error
      }
    }
    setCurrentStage(0)
    startPlaying()
    setGameState('lesson')
  }

  const handleStageSelect = (stageIndex: number) => {
    setCurrentStage(stageIndex)
    startPlaying()
    setGameState('lesson')
  }

  const handleStageComplete = async () => {
    if (isLastStage) {
      if (playRecordId && session) {
        try {
          await updatePlayRecord({
            data: {
              playRecordId,
              score,
              durationSeconds: 0,
              completed: true,
            },
          })
        } catch {
          // Ignore error
        }
      }
      setGameState('quest_complete')
    } else {
      setGameState('stage_complete')
    }
  }

  const handleQuizComplete = () => {
    setGameState('quiz_complete')
    if (playRecordId && session) {
      updatePlayRecord({
        data: {
          playRecordId,
          score,
          durationSeconds: 0,
          completed: true,
        },
      }).catch(() => {})
    }
  }

  const handleNextStage = () => {
    setCurrentStage(currentStageIndex + 1)
    setGameState('lesson')
  }

  const handleGameOver = () => setGameState('game_over')

  const handleTimeExpired = () => {
    clearQuizProgress(activityId)
    setSavedProgress(null)
    setGameState('time_expired')
  }

  const handleRetry = () => {
    clearQuizProgress(activityId)
    setSavedProgress(null)
    resetGame()
    setGameState('intro')
  }

  const handleQuit = () => {
    stopPlaying()
    navigate({ to: '/' })
  }

  const handleFinish = () => {
    stopPlaying()
    navigate({ to: '/' })
  }

  // Get header subtitle
  const getHeaderSubtitle = () => {
    if (isSmartQuizMode) {
      return `${totalQuizzes} Questions`
    }
    return `Stage ${currentStageIndex + 1} of ${questActivity?.stages.length ?? 0}`
  }

  // Get header title
  const getHeaderTitle = () => {
    if (isSmartQuizMode) {
      return currentActivity.title
    }
    return stage?.title || ''
  }

  return (
    <div className="min-h-screen bg-background">
      <PlayHeader user={user} onSignOut={handleSignOut} />

      <div className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Intro State */}
            {gameState === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {isSmartQuizMode && quizActivity ? (
                  <QuizIntro
                    activity={quizActivity}
                    savedProgress={savedProgress}
                    playsRemaining={canPlayResult?.plays_remaining}
                    onStart={handleStartQuiz}
                    onResume={handleResumeQuiz}
                    onDiscardProgress={handleDiscardProgress}
                  />
                ) : questActivity ? (
                  <QuestIntro
                    activity={questActivity}
                    onBegin={handleStartQuest}
                    onStageSelect={handleStageSelect}
                  />
                ) : null}
              </motion.div>
            )}

            {/* Playing States */}
            {gameState !== 'intro' && (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <PlayingHeader
                  score={score}
                  title={getHeaderTitle()}
                  subtitle={getHeaderSubtitle()}
                  onQuit={handleQuit}
                />

                <AnimatePresence mode="popLayout" initial={false}>
                  {/* Lesson View (Quest only) */}
                  {gameState === 'lesson' && stage && (
                    <LessonScreen
                      lesson={stage.lesson}
                      onStartQuiz={() => setGameState('playing')}
                    />
                  )}

                  {/* Quiz Playing */}
                  {gameState === 'playing' && (
                    <motion.div
                      key="playing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <QuizPlayer
                        onStageComplete={handleStageComplete}
                        onGameOver={handleGameOver}
                        onQuizComplete={handleQuizComplete}
                        onTimeExpired={handleTimeExpired}
                        activityId={activityId}
                        savedProgress={savedProgress}
                      />
                    </motion.div>
                  )}

                  {/* Stage Complete (Quest only) */}
                  {gameState === 'stage_complete' && (
                    <StageCompleteScreen
                      score={score}
                      onNextStage={handleNextStage}
                    />
                  )}

                  {/* Quiz Complete */}
                  {gameState === 'quiz_complete' && (
                    <QuizCompleteScreen
                      score={score}
                      totalQuizzes={totalQuizzes}
                      onFinish={handleFinish}
                      onRetry={handleRetry}
                    />
                  )}

                  {/* Quest Complete */}
                  {gameState === 'quest_complete' && (
                    <QuestCompleteScreen
                      score={score}
                      totalStages={questActivity?.stages.length ?? 0}
                      onFinish={handleFinish}
                      onRetry={handleRetry}
                    />
                  )}

                  {/* Game Over */}
                  {gameState === 'game_over' && (
                    <GameOverScreen
                      score={score}
                      onQuit={handleQuit}
                      onRetry={handleRetry}
                    />
                  )}

                  {/* Time Expired */}
                  {gameState === 'time_expired' && (
                    <TimeExpiredScreen score={score} onFinish={handleFinish} />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
