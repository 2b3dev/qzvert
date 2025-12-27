import { motion } from 'framer-motion'
import { AlertCircle, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Progress } from '../../ui/progress'

interface WeaknessAnalysisProps {
  conceptScore?: number
  applicationScore?: number
  speedScore?: number
  weakStageIndex?: number
}

export function WeaknessAnalysis({
  conceptScore = 85,
  applicationScore = 70,
  speedScore = 90,
  weakStageIndex = 2,
}: WeaknessAnalysisProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="mb-6 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            AI Weakness Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  Concept Understanding
                </span>
                <span className="text-emerald-400">{conceptScore}%</span>
              </div>
              <Progress value={conceptScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Application Skills</span>
                <span className="text-amber-400">{applicationScore}%</span>
              </div>
              <Progress value={applicationScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Speed & Accuracy</span>
                <span className="text-primary">{speedScore}%</span>
              </div>
              <Progress value={speedScore} className="h-2" />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recommended Review
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <span className="text-amber-300 font-medium">
                    Stage {weakStageIndex}:
                  </span>{' '}
                  <span className="text-muted-foreground">
                    Review application concepts for better mastery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
