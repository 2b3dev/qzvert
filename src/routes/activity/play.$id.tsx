import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useActivityStore } from '../../stores/activity-store'
import { useAuthStore } from '../../stores/auth-store'
import { QuizPlayer } from '../../components/QuizPlayer'
import { LearningMap } from '../../components/LearningMap'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { getActivityById } from '../../server/activities'

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
  const { session } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<GameState>('intro')

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
      } catch (error) {
        toast.error('Failed to load content')
        navigate({ to: '/' })
      } finally {
        setIsLoading(false)
      }
    }

    loadActivity()
  }, [activityId, currentActivityId, currentActivity, setActivity, setThemeConfig, navigate])

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

  const isSmartQuizMode = currentActivity.type === 'quiz'
  const stage = isSmartQuizMode ? null : currentActivity.stages[currentStageIndex]
  const isLastStage = isSmartQuizMode ? true : currentStageIndex === currentActivity.stages.length - 1
  const totalQuizzes = isSmartQuizMode ? currentActivity.quizzes.length : 0

  const handleStartQuiz = () => {
    startPlaying()
    setGameState('playing')
  }

  const handleStartQuest = () => {
    setCurrentStage(0)
    startPlaying()
    setGameState('lesson')
  }

  const handleStageSelect = (stageIndex: number) => {
    setCurrentStage(stageIndex)
    startPlaying()
    setGameState('lesson')
  }

  const handleStageComplete = () => {
    if (isLastStage) {
      setGameState('quest_complete')
    } else {
      setGameState('stage_complete')
    }
  }

  const handleQuizComplete = () => {
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
    <div className="min-h-screen bg-background py-8 px-6">
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
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
              >
                <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                {session && (
                  <Button variant="ghost" onClick={handleEdit}>
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </motion.div>

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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
                          <span className="font-bold">{currentActivity.quizzes.length}</span>
                          <span>Questions</span>
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

                    <div className="flex justify-center gap-4">
                      <Button size="lg" variant="secondary" onClick={handleFinish}>
                        <Home className="w-5 h-5" />
                        Back to Home
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

                    <div className="flex justify-center gap-4">
                      <Button size="lg" variant="secondary" onClick={handleFinish}>
                        <Home className="w-5 h-5" />
                        Back to Home
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

                    <div className="flex justify-center gap-4">
                      <Button size="lg" variant="secondary" onClick={handleQuit}>
                        <Home className="w-5 h-5" />
                        Quit
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
  )
}
