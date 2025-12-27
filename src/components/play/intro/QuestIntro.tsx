import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { LearningMap } from '../../LearningMap'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import type { GeneratedQuestCourse } from '../../../types/database'

interface QuestIntroProps {
  activity: GeneratedQuestCourse
  onBegin: () => void
  onStageSelect: (index: number) => void
}

export function QuestIntro({
  activity,
  onBegin,
  onStageSelect,
}: QuestIntroProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-4">
          {activity.title}
        </h1>
        <p className="text-muted-foreground text-lg">
          {activity.stages.length} Stages to Master
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-8 overflow-visible bg-linear-to-br from-card to-secondary/50">
          <CardHeader>
            <CardTitle className="text-center text-xl text-foreground">
              Your Learning Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <LearningMap onStageSelect={onStageSelect} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8"
      >
        {activity.stages.map((stageItem, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card
              className="h-full hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onStageSelect(index)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{stageItem.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {stageItem.lesson}
                </p>
                <div className="mt-3 text-xs text-primary">
                  {stageItem.quizzes.length} quiz
                  {stageItem.quizzes.length !== 1 ? 'zes' : ''}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <Button size="lg" onClick={onBegin} className="px-12">
          <Play className="w-5 h-5" />
          Begin Quest
        </Button>
      </motion.div>
    </div>
  )
}
