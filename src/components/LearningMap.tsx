import { motion } from 'framer-motion'
import { Lock, CheckCircle2, Play, Star } from 'lucide-react'
import { useQuestStore } from '../stores/quest-store'
import { cn } from '../lib/utils'

interface LearningMapProps {
  onStageSelect: (stageIndex: number) => void
}

export function LearningMap({ onStageSelect }: LearningMapProps) {
  const { currentQuest, completedStages, currentStageIndex } = useQuestStore()

  if (!currentQuest) return null

  const stages = currentQuest.stages

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Path SVG connecting stages */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {stages.map((_, index) => {
          if (index === stages.length - 1) return null
          const isCompleted = completedStages.has(index)
          const x1 = `${((index + 0.5) / stages.length) * 100}%`
          const x2 = `${((index + 1.5) / stages.length) * 100}%`
          return (
            <line
              key={index}
              x1={x1}
              y1="50%"
              x2={x2}
              y2="50%"
              stroke={isCompleted ? '#a855f7' : '#334155'}
              strokeWidth="4"
              strokeDasharray={isCompleted ? '0' : '8 8'}
              className="transition-all duration-500"
            />
          )
        })}
      </svg>

      {/* Stage Nodes */}
      <div className="relative flex justify-around items-center min-h-[200px]">
        {stages.map((stage, index) => {
          const isCompleted = completedStages.has(index)
          const isCurrent = index === currentStageIndex
          const isLocked = index > 0 && !completedStages.has(index - 1) && !isCurrent
          const canPlay = !isLocked

          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
              className="relative flex flex-col items-center"
            >
              {/* Stage Number Badge */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  isCompleted ? "bg-purple-500 text-white" : "bg-slate-700 text-slate-300"
                )}>
                  {index + 1}
                </div>
              </div>

              {/* Stage Button */}
              <motion.button
                whileHover={canPlay ? { scale: 1.1 } : {}}
                whileTap={canPlay ? { scale: 0.95 } : {}}
                onClick={() => canPlay && onStageSelect(index)}
                disabled={isLocked}
                className={cn(
                  "relative w-24 h-24 md:w-32 md:h-32 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border-4",
                  isCompleted && "bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400 shadow-lg shadow-purple-500/30",
                  isCurrent && !isCompleted && "bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse",
                  isLocked && "bg-slate-800 border-slate-700 opacity-60 cursor-not-allowed",
                  !isCompleted && !isCurrent && !isLocked && "bg-slate-800 border-slate-600 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-10 h-10 text-white" />
                ) : isLocked ? (
                  <Lock className="w-8 h-8 text-slate-500" />
                ) : isCurrent ? (
                  <Play className="w-10 h-10 text-white" />
                ) : (
                  <Star className="w-8 h-8 text-slate-400" />
                )}
              </motion.button>

              {/* Stage Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="mt-4 text-center max-w-[120px]"
              >
                <h3 className={cn(
                  "font-semibold text-sm",
                  isCompleted ? "text-purple-300" : isCurrent ? "text-amber-300" : "text-slate-400"
                )}>
                  {stage.title}
                </h3>
              </motion.div>

              {/* Completion Stars */}
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="flex gap-1 mt-2"
                >
                  {[1, 2, 3].map((star) => (
                    <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
