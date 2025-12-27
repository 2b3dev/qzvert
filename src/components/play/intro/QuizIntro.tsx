import { motion } from 'framer-motion'
import { GraduationCap, Play, RefreshCw } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import type { QuizProgress } from '../../../lib/quiz-progress'
import type { GeneratedSmartQuiz } from '../../../types/database'

interface QuizIntroProps {
  activity: GeneratedSmartQuiz
  savedProgress: QuizProgress | null
  playsRemaining?: number
  onStart: () => void
  onResume: () => void
  onDiscardProgress: () => void
}

export function QuizIntro({
  activity,
  savedProgress,
  playsRemaining,
  onStart,
  onResume,
  onDiscardProgress,
}: QuizIntroProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-8 bg-linear-to-br from-card to-secondary/50">
          <CardHeader className="text-center pb-4">
            {activity.thumbnail ? (
              <div className="w-full max-w-xs mx-auto mb-4 rounded-xl overflow-hidden aspect-video">
                <img
                  src={activity.thumbnail}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
            )}
            <CardTitle className="text-3xl md:text-4xl font-black bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              {activity.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
                <span className="font-bold">{activity.quizzes.length}</span>
                <span>Questions</span>
              </div>
              {playsRemaining !== undefined && playsRemaining > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-500">
                  <span className="font-bold">{playsRemaining}</span>
                  <span>plays remaining</span>
                </div>
              )}
            </div>
            {activity.description && (
              <div
                className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: activity.description,
                }}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Resume Progress Card */}
      {savedProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Continue where you left off?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Question {savedProgress.currentQuizIndex + 1} of{' '}
                      {activity.quizzes.length} • {savedProgress.score} pts
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={onDiscardProgress}>
                    Start Over
                  </Button>
                  <Button size="sm" onClick={onResume}>
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <Button size="lg" onClick={onStart} className="px-12">
          <Play className="w-5 h-5" />
          {savedProgress ? 'Start Over' : 'Start Quiz'}
        </Button>
      </motion.div>
    </div>
  )
}
