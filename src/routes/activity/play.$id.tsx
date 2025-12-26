import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Trophy,
  Star,
  RotateCcw,
  Home,
  Target,
  TrendingUp,
  AlertCircle,
  GraduationCap,
  Play,
  Pencil,
  Loader2,
  Clock,
  Lock,
  User,
  LogOut,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useActivityStore } from '../../stores/activity-store'
import { useAuthStore } from '../../stores/auth-store'
import { QuizPlayer } from '../../components/QuizPlayer'
import { LearningMap } from '../../components/LearningMap'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import IconApp from '../../components/icon/icon-app'
import { checkCanUserPlay, getActivityById, recordPlay, updatePlayRecord } from '../../server/activities'
import type { CanUserPlayResult } from '../../types/database'

export const Route = createFileRoute('/activity/play/$id')({
  component: ActivityPlayPage
})

type GameState = 'intro' | 'lesson' | 'playing' | 'stage_complete' | 'game_over' | 'quest_complete' | 'quiz_complete'

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
    completedStages,
    resetGame,
    stopPlaying
  } = useActivityStore()
  const { session, user, signOut } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<GameState>('intro')
  const [canPlayResult, setCanPlayResult] = useState<CanUserPlayResult | null>(null)
  const [playRecordId, setPlayRecordId] = useState<string | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    navigate({ to: '/' })
  }

  // Load activity if not already loaded or if different id
  useEffect(() => {
    const loadActivity = async () => {
      if (currentActivityId === activityId && currentActivity) return

      setIsLoading(true)
      try {
        const data = await getActivityById({ data: { activityId } })
        if (data) {
          setActivity(data.generatedQuest, data.activity.raw_content, activityId)
          setThemeConfig(data.themeConfig)
        }

        // Check if user can play (availability & replay limits)
        const canPlay = await checkCanUserPlay({
          data: {
            activityId,
            accessToken: session?.access_token
          }
        })
        setCanPlayResult(canPlay)
      } catch (error) {
        toast.error('Failed to load content')
        navigate({ to: '/' })
      } finally {
        setIsLoading(false)
      }
    }

    loadActivity()
  }, [activityId, currentActivityId, currentActivity, setActivity, setThemeConfig, navigate, session])

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

  if (!currentActivity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Content Not Found</h2>
            <p className="text-muted-foreground mb-6">This content doesn't exist or has been removed</p>
            <Button onClick={() => navigate({ to: '/' })}>
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if activity is blocked from playing
  const isBlocked = canPlayResult && !canPlayResult.can_play

  // Render blocked state (availability or replay limit reached)
  const renderBlockedState = () => {
    if (!canPlayResult || canPlayResult.can_play) return null

    let icon = <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    let title = 'Cannot Play'
    let description = 'You cannot play this activity right now.'

    switch (canPlayResult.reason) {
      case 'not_yet_available':
        icon = <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        title = 'Not Yet Available'
        description = canPlayResult.available_from
          ? `This activity will be available on ${formatDate(canPlayResult.available_from)}`
          : 'This activity is not yet available.'
        break
      case 'expired':
        icon = <Clock className="w-12 h-12 text-destructive mx-auto mb-4" />
        title = 'Activity Expired'
        description = canPlayResult.available_until
          ? `This activity was available until ${formatDate(canPlayResult.available_until)}`
          : 'This activity is no longer available.'
        break
      case 'replay_limit_reached':
        icon = <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        title = 'Replay Limit Reached'
        description = `You have already played this activity ${canPlayResult.plays_used} time${(canPlayResult.plays_used ?? 0) > 1 ? 's' : ''} (maximum: ${canPlayResult.replay_limit}).`
        break
      case 'activity_not_found':
        icon = <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        title = 'Activity Not Found'
        description = 'This activity does not exist.'
        break
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-8 px-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            {icon}
            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground mb-6">{description}</p>
            <Button onClick={() => navigate({ to: '/' })}>
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show blocked state if cannot play
  if (isBlocked) {
    return renderBlockedState()
  }

  const isSmartQuizMode = currentActivity.type === 'quiz'
  const stage = isSmartQuizMode ? null : currentActivity.stages[currentStageIndex]
  const isLastStage = isSmartQuizMode ? true : currentStageIndex === currentActivity.stages.length - 1
  const totalQuizzes = isSmartQuizMode ? currentActivity.quizzes.length : 0

  const handleStartQuiz = async () => {
    // Record play start if user is logged in
    if (session?.access_token) {
      try {
        const result = await recordPlay({
          data: {
            activityId,
            accessToken: session.access_token,
            completed: false
          }
        })
        setPlayRecordId(result.playRecordId)
      } catch {
        // Ignore error, continue playing
      }
    }
    startPlaying()
    setGameState('playing')
  }

  const handleStartQuest = async () => {
    // Record play start if user is logged in
    if (session?.access_token) {
      try {
        const result = await recordPlay({
          data: {
            activityId,
            accessToken: session.access_token,
            completed: false
          }
        })
        setPlayRecordId(result.playRecordId)
      } catch {
        // Ignore error, continue playing
      }
    }
    setCurrentStage(0)
    startPlaying()
    setGameState('lesson')
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const handleStageSelect = (stageIndex: number) => {
    setCurrentStage(stageIndex)
    startPlaying()
    setGameState('lesson')
  }

  const handleStageComplete = async () => {
    if (isLastStage) {
      // Update play record if we have one
      if (playRecordId && session?.access_token) {
        try {
          await updatePlayRecord({
            data: {
              playRecordId,
              accessToken: session.access_token,
              score,
              durationSeconds: 0, // TODO: track actual duration
              completed: true
            }
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

  const handleQuizComplete = async () => {
    // Update play record if we have one
    if (playRecordId && session?.access_token) {
      try {
        await updatePlayRecord({
          data: {
            playRecordId,
            accessToken: session.access_token,
            score,
            durationSeconds: 0, // TODO: track actual duration
            completed: true
          }
        })
      } catch {
        // Ignore error
      }
    }
    setGameState('quiz_complete')
  }

  const handleNextStage = () => {
    setCurrentStage(currentStageIndex + 1)
    setGameState('lesson')
  }

  const handleGameOver = () => {
    setGameState('game_over')
  }

  const handleRetry = () => {
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

  const handleEdit = () => {
    navigate({ to: '/activity/edit/$id', params: { id: activityId } })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <IconApp className="w-6 h-6" color={'hsl(var(--foreground))'} />
              </motion.div>
              <span className="font-black text-xl text-foreground group-hover:text-primary transition-colors">
                QzVert
              </span>
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {session && (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              )}

              {/* User Menu */}
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 rounded-lg bg-card border border-border shadow-lg py-2"
                      >
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <User className="w-4 h-4" />
                          โปรไฟล์
                        </Link>
                        <Link
                          to="/activity/results"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                          ผลลัพธ์ทั้งหมด
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          ออกจากระบบ
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm"
                >
                  <User className="w-4 h-4" />
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Intro/Preview State */}
            {gameState === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >

              {isSmartQuizMode ? (
                // Quiz Intro
                (<div className="max-w-3xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="mb-8 bg-gradient-to-br from-card to-secondary/50">
                      <CardHeader className="text-center pb-4">
                        {currentActivity.thumbnail ? (
                          <div className="w-full max-w-xs mx-auto mb-4 rounded-xl overflow-hidden aspect-video">
                            <img
                              src={currentActivity.thumbnail}
                              alt={currentActivity.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <CardTitle className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                          {currentActivity.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
                            <span className="font-bold">{currentActivity.quizzes.length}</span>
                            <span>Questions</span>
                          </div>
                          {canPlayResult?.plays_remaining !== undefined && canPlayResult.plays_remaining > 0 && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-500">
                              <span className="font-bold">{canPlayResult.plays_remaining}</span>
                              <span>plays remaining</span>
                            </div>
                          )}
                        </div>
                        {currentActivity.description && (
                          <div
                            className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: currentActivity.description }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center"
                  >
                    <Button size="lg" onClick={handleStartQuiz} className="px-12">
                      <Play className="w-5 h-5" />
                      Start Quiz
                    </Button>
                  </motion.div>
                </div>)
              ) : (
                // Quest Intro with Learning Map
                (<div className="max-w-6xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-12"
                  >
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-4">
                      {currentActivity.title}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      {currentActivity.stages.length} Stages to Master
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="mb-8 overflow-visible bg-gradient-to-br from-card to-secondary/50">
                      <CardHeader>
                        <CardTitle className="text-center text-xl text-foreground">
                          Your Learning Journey
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-visible">
                        <LearningMap onStageSelect={handleStageSelect} />
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8"
                  >
                    {currentActivity.stages.map((stageItem, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <Card
                          className="h-full hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handleStageSelect(index)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                {index + 1}
                              </div>
                              <CardTitle className="text-lg">{stageItem.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm line-clamp-3">{stageItem.lesson}</p>
                            <div className="mt-3 text-xs text-primary">
                              {stageItem.quizzes.length} quiz{stageItem.quizzes.length !== 1 ? 'zes' : ''}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center"
                  >
                    <Button size="lg" onClick={handleStartQuest} className="px-12">
                      <Play className="w-5 h-5" />
                      Begin Quest
                    </Button>
                  </motion.div>
                </div>)
              )}
            </motion.div>
          )}

          {/* Playing States - Show header with score */}
          {gameState !== 'intro' && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
              >
                <Button variant="ghost" onClick={handleQuit}>
                  <ArrowLeft className="w-4 h-4" />
                  Quit
                </Button>
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">{score} pts</span>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-8"
              >
                {isSmartQuizMode ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm mb-4">
                      {totalQuizzes} Questions
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">{currentActivity.title}</h1>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm mb-4">
                      Stage {currentStageIndex + 1} of {currentActivity.stages.length}
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">{stage?.title}</h1>
                  </>
                )}
              </motion.div>

              <AnimatePresence mode="wait">
                {/* Lesson View */}
                {gameState === 'lesson' && !isSmartQuizMode && stage && (
                  <motion.div
                    key="lesson"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="mb-8 bg-gradient-to-br from-card to-secondary/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <BookOpen className="w-6 h-6 text-primary" />
                          Lesson Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-lg leading-relaxed">{stage.lesson}</p>
                      </CardContent>
                    </Card>

                    <div className="flex justify-center">
                      <Button size="lg" onClick={() => setGameState('playing')}>
                        Start Quiz
                        <Star className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
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
                    />
                  </motion.div>
                )}

                {/* Stage Complete */}
                {gameState === 'stage_complete' && (
                  <motion.div
                    key="stage_complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ delay: 0.3 }}
                    >
                      <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-foreground mb-4">Stage Complete!</h2>
                    <p className="text-xl text-muted-foreground mb-2">You earned</p>
                    <p className="text-5xl font-bold text-primary mb-8">{score} points</p>

                    <div className="flex justify-center gap-4">
                      <Button size="lg" onClick={handleNextStage}>
                        Next Stage
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Quiz Complete */}
                {gameState === 'quiz_complete' && (
                  <motion.div
                    key="quiz_complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="relative inline-block mb-6"
                      >
                        <Trophy className="w-24 h-24 text-yellow-400" />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute -top-2 -right-2 flex"
                        >
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.6 + i * 0.1 }}
                            >
                              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </motion.div>
                      <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                        Quiz Complete!
                      </h2>
                      <p className="text-5xl font-bold text-primary mb-2">{score} pts</p>
                      <p className="text-muted-foreground">
                        Answered {totalQuizzes} questions
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      <Button size="lg" variant="secondary" onClick={handleFinish}>
                        <Home className="w-5 h-5" />
                        Back to Home
                      </Button>
                      <Button size="lg" variant="outline" asChild>
                        <Link to="/activity/results">
                          <BarChart3 className="w-5 h-5" />
                          View Results
                        </Link>
                      </Button>
                      <Button size="lg" onClick={handleRetry}>
                        <RotateCcw className="w-5 h-5" />
                        Play Again
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Quest Complete */}
                {gameState === 'quest_complete' && (
                  <motion.div
                    key="quest_complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="relative inline-block mb-6"
                      >
                        <Trophy className="w-24 h-24 text-yellow-400" />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute -top-2 -right-2 flex"
                        >
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.6 + i * 0.1 }}
                            >
                              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </motion.div>
                      <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                        Quest Complete!
                      </h2>
                      <p className="text-5xl font-bold text-primary mb-2">{score} pts</p>
                      <p className="text-muted-foreground">
                        Completed {currentActivity.type === 'quest' ? currentActivity.stages.length : 0} stages
                      </p>
                    </div>

                    {/* AI Weakness Analysis */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="mb-6 border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Target className="w-5 h-5 text-primary" />
                            AI Weakness Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Concept Understanding</span>
                                <span className="text-emerald-400">85%</span>
                              </div>
                              <Progress value={85} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Application Skills</span>
                                <span className="text-amber-400">70%</span>
                              </div>
                              <Progress value={70} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Speed & Accuracy</span>
                                <span className="text-primary">90%</span>
                              </div>
                              <Progress value={90} className="h-2" />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-border">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              Recommended Review
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                                <div className="text-sm">
                                  <span className="text-amber-300 font-medium">Stage 2:</span>{' '}
                                  <span className="text-muted-foreground">
                                    Review application concepts for better mastery
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <div className="flex flex-wrap justify-center gap-3">
                      <Button size="lg" variant="secondary" onClick={handleFinish}>
                        <Home className="w-5 h-5" />
                        Back to Home
                      </Button>
                      <Button size="lg" variant="outline" asChild>
                        <Link to="/activity/results">
                          <BarChart3 className="w-5 h-5" />
                          View Results
                        </Link>
                      </Button>
                      <Button size="lg" onClick={handleRetry}>
                        <RotateCcw className="w-5 h-5" />
                        Play Again
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Game Over */}
                {gameState === 'game_over' && (
                  <motion.div
                    key="game_over"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <div className="text-8xl mb-6">💔</div>
                    </motion.div>
                    <h2 className="text-4xl font-black text-destructive mb-4">Game Over</h2>
                    <p className="text-xl text-muted-foreground mb-2">You scored</p>
                    <p className="text-5xl font-bold text-primary mb-8">{score} points</p>

                    <div className="flex flex-wrap justify-center gap-3">
                      <Button size="lg" variant="secondary" onClick={handleQuit}>
                        <Home className="w-5 h-5" />
                        Quit
                      </Button>
                      <Button size="lg" variant="outline" asChild>
                        <Link to="/activity/results">
                          <BarChart3 className="w-5 h-5" />
                          View Results
                        </Link>
                      </Button>
                      <Button size="lg" onClick={handleRetry}>
                        <RotateCcw className="w-5 h-5" />
                        Try Again
                      </Button>
                    </div>
                  </motion.div>
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
