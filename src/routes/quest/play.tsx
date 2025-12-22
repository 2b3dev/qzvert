import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, Trophy, Star, RotateCcw, Home } from 'lucide-react'
import { useState } from 'react'
import { useQuestStore } from '../../stores/quest-store'
import { QuizPlayer } from '../../components/QuizPlayer'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export const Route = createFileRoute('/quest/play')({
  component: QuestPlayPage
})

type GameState = 'lesson' | 'playing' | 'stage_complete' | 'game_over' | 'quest_complete'

function QuestPlayPage() {
  const navigate = useNavigate()
  const {
    currentQuest,
    currentStageIndex,
    setCurrentStage,
    score,
    completedStages,
    resetGame,
    stopPlaying
  } = useQuestStore()

  const [gameState, setGameState] = useState<GameState>('lesson')

  if (!currentQuest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Quest Found</h2>
            <p className="text-muted-foreground mb-6">Create a new quest to get started</p>
            <Button onClick={() => navigate({ to: '/' })}>
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stage = currentQuest.stages[currentStageIndex]
  const isLastStage = currentStageIndex === currentQuest.stages.length - 1

  const handleStageComplete = () => {
    if (isLastStage) {
      setGameState('quest_complete')
    } else {
      setGameState('stage_complete')
    }
  }

  const handleNextStage = () => {
    setCurrentStage(currentStageIndex + 1)
    setGameState('lesson')
  }

  const handleGameOver = () => {
    setGameState('game_over')
  }

  const handleRetry = () => {
    setGameState('lesson')
  }

  const handleQuit = () => {
    stopPlaying()
    navigate({ to: '/quest/preview' })
  }

  const handleFinish = () => {
    stopPlaying()
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" onClick={handleQuit}>
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">{score} pts</span>
          </div>
        </motion.div>

        {/* Stage Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm mb-4">
            Stage {currentStageIndex + 1} of {currentQuest.stages.length}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{stage.title}</h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Lesson View */}
          {gameState === 'lesson' && (
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

          {/* Quest Complete */}
          {gameState === 'quest_complete' && (
            <motion.div
              key="quest_complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative inline-block mb-6"
              >
                <Trophy className="w-32 h-32 text-yellow-400" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
                Quest Complete!
              </h2>
              <p className="text-xl text-muted-foreground mb-2">Total Score</p>
              <p className="text-6xl font-bold text-primary mb-4">{score}</p>
              <p className="text-muted-foreground mb-8">
                You completed all {currentQuest.stages.length} stages!
              </p>

              <div className="flex justify-center gap-4">
                <Button size="lg" variant="secondary" onClick={handleFinish}>
                  <Home className="w-5 h-5" />
                  Back to Home
                </Button>
                <Button size="lg" onClick={() => {
                  resetGame()
                  navigate({ to: '/' })
                }}>
                  Create New Quest
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
      </div>
    </div>
  )
}
