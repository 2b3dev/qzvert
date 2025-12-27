import { motion } from 'framer-motion'
import { Star, Trophy } from 'lucide-react'

interface CompletionTrophyProps {
  starCount?: number
}

export function CompletionTrophy({ starCount = 3 }: CompletionTrophyProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
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
        {[...Array(starCount)].map((_, i) => (
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
  )
}
