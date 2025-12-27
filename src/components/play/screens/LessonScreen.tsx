import { motion } from 'framer-motion'
import { BookOpen, Star } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'

interface LessonScreenProps {
  lesson: string
  onStartQuiz: () => void
}

export function LessonScreen({ lesson, onStartQuiz }: LessonScreenProps) {
  return (
    <motion.div
      key="lesson"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="mb-8 bg-linear-to-br from-card to-secondary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Lesson Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {lesson}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onStartQuiz}>
          Start Quiz
          <Star className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  )
}
