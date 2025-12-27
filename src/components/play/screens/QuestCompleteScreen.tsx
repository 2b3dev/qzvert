import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { BarChart3, Home, RotateCcw } from 'lucide-react'
import { Button } from '../../ui/button'
import { CompletionTrophy } from '../shared/CompletionTrophy'
import { WeaknessAnalysis } from '../shared/WeaknessAnalysis'

interface QuestCompleteScreenProps {
  score: number
  totalStages: number
  onFinish: () => void
  onRetry: () => void
}

export function QuestCompleteScreen({
  score,
  totalStages,
  onFinish,
  onRetry,
}: QuestCompleteScreenProps) {
  return (
    <motion.div
      key="quest_complete"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="text-center mb-8">
        <CompletionTrophy />
        <h2 className="text-4xl font-black bg-linear-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
          Quest Complete!
        </h2>
        <p className="text-5xl font-bold text-primary mb-2">{score} pts</p>
        <p className="text-muted-foreground">Completed {totalStages} stages</p>
      </div>

      <WeaknessAnalysis />

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" variant="secondary" onClick={onFinish}>
          <Home className="w-5 h-5" />
          Back to Home
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/activity/results">
            <BarChart3 className="w-5 h-5" />
            View Results
          </Link>
        </Button>
        <Button size="lg" onClick={onRetry}>
          <RotateCcw className="w-5 h-5" />
          Play Again
        </Button>
      </div>
    </motion.div>
  )
}
