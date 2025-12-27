import { motion } from 'framer-motion'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Button } from '../../ui/button'

interface PlayingHeaderProps {
  score: number
  title: string
  subtitle: string
  onQuit: () => void
}

export function PlayingHeader({
  score,
  title,
  subtitle,
  onQuit,
}: PlayingHeaderProps) {
  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <Button variant="ghost" onClick={onQuit}>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm mb-4">
          {subtitle}
        </div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </motion.div>
    </>
  )
}
