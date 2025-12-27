import { motion } from 'framer-motion'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Button } from '../../ui/button'

interface StageCompleteScreenProps {
  score: number
  onNextStage: () => void
}

export function StageCompleteScreen({
  score,
  onNextStage,
}: StageCompleteScreenProps) {
  return (
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
      <h2 className="text-4xl font-black text-foreground mb-4">
        Stage Complete!
      </h2>
      <p className="text-xl text-muted-foreground mb-2">You earned</p>
      <p className="text-5xl font-bold text-primary mb-8">{score} points</p>

      <div className="flex justify-center gap-4">
        <Button size="lg" onClick={onNextStage}>
          Next Stage
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </Button>
      </div>
    </motion.div>
  )
}
