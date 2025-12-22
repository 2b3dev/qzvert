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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Quest Found</h2>
            <p className="text-slate-400 mb-6">Create a new quest to get started</p>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-6">
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
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {currentQuest.title}
          </h1>
          <p className="text-slate-400 text-lg">
            {currentQuest.stages.length} Stages to Master
          </p>
        </motion.div>

        {/* Learning Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 overflow-visible bg-gradient-to-br from-slate-900/80 to-slate-800/80">
            <CardHeader>
              <CardTitle className="text-center text-xl text-slate-200">
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
              <Card className="h-full hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => handleStageSelect(index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg">{stage.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm line-clamp-3">{stage.lesson}</p>
                  <div className="mt-3 text-xs text-purple-400">
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
