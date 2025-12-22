import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Play, ArrowLeft, Settings, BookOpen } from 'lucide-react'
import { useQuestStore } from '../../stores/quest-store'
import { LearningMap } from '../../components/LearningMap'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export const Route = createFileRoute('/quest/preview')({
  component: QuestPreviewPage
})

function QuestPreviewPage() {
  const navigate = useNavigate()
  const { currentQuest, setCurrentStage, startPlaying } = useQuestStore()

  if (!currentQuest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Quest Found</h2>
            <p className="text-muted-foreground mb-6">Create a new quest to get started</p>
            <Button onClick={() => navigate({ to: '/' })}>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleStageSelect = (stageIndex: number) => {
    setCurrentStage(stageIndex)
    startPlaying()
    navigate({ to: '/quest/play' })
  }

  const handleStartQuest = () => {
    setCurrentStage(0)
    startPlaying()
    navigate({ to: '/quest/play' })
  }

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="secondary">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </motion.div>

        {/* Quest Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-4">
            {currentQuest.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentQuest.stages.length} Stages to Master
          </p>
        </motion.div>

        {/* Learning Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 overflow-visible bg-gradient-to-br from-card to-secondary/50">
            <CardHeader>
              <CardTitle className="text-center text-xl text-foreground">
                Your Learning Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible">
              <LearningMap onStageSelect={handleStageSelect} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stage Previews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {currentQuest.stages.map((stage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleStageSelect(index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg">{stage.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-3">{stage.lesson}</p>
                  <div className="mt-3 text-xs text-primary">
                    {stage.quizzes.length} quiz{stage.quizzes.length !== 1 ? 'zes' : ''}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <Button size="lg" onClick={handleStartQuest} className="px-12">
            <Play className="w-5 h-5" />
            Begin Quest
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
