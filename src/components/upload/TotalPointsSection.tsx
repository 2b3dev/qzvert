import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface TotalPointsSectionProps {
  totalPoints: number
  setTotalPoints: (points: number) => void
  onRedistribute: () => void
  disabled?: boolean
}

export function TotalPointsSection({
  totalPoints,
  setTotalPoints,
  onRedistribute,
  disabled = false,
}: TotalPointsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.17 }}
      className="mb-6"
    >
      <label className="text-sm font-medium text-foreground mb-2 block">
        <Star className="w-4 h-4 inline-block mr-1" />
        Total Points
      </label>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={0}
          value={totalPoints || ''}
          onChange={(e) => {
            const val =
              e.target.value === '' ? 0 : parseInt(e.target.value, 10)
            if (!isNaN(val) && val >= 0) setTotalPoints(val)
          }}
          className="w-32"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRedistribute}
          disabled={disabled}
        >
          Distribute
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Click "Distribute" to evenly split points across all questions.
      </p>
    </motion.div>
  )
}
