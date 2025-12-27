import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BarChart3, Home, RotateCcw } from 'lucide-react'
import { Button } from '../../ui/button'

interface GameOverScreenProps {
  score: number
  onQuit: () => void
  onRetry: () => void
}

export function GameOverScreen({
  score,
  onQuit,
  onRetry,
}: GameOverScreenProps) {
  return (
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
        <Button size="lg" variant="secondary" onClick={onQuit}>
          <Home className="w-5 h-5" />
          Quit
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/activity/results">
            <BarChart3 className="w-5 h-5" />
            View Results
          </Link>
        </Button>
        <Button size="lg" onClick={onRetry}>
          <RotateCcw className="w-5 h-5" />
          Try Again
        </Button>
      </div>
    </motion.div>
  )
}
