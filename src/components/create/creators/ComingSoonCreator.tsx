import { motion } from 'framer-motion'
import { Clock, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '../../../hooks/useTranslation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card'
import { Button } from '../../ui/button'
import type { CreatorType } from '../CreateSidebar'

interface ComingSoonCreatorProps {
  type: CreatorType
  icon: LucideIcon
  gradient: string
  features?: string[]
}

export function ComingSoonCreator({
  type,
  icon: Icon,
  gradient,
  features = [],
}: ComingSoonCreatorProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card/80 to-card">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl">
                {t(`create.types.${type}.name`)}
              </CardTitle>
              <CardDescription>
                {t(`create.types.${type}.description`)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Coming Soon Banner */}
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
            >
              <Clock className="w-10 h-10 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {t('common.comingSoon')}
            </h3>
            <p className="text-muted-foreground max-w-md">
              We're working hard to bring you this feature. Stay tuned for
              updates!
            </p>
          </div>

          {/* Feature Preview */}
          {features.length > 0 && (
            <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/30">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Planned Features
              </h4>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notify Button */}
          <Button variant="outline" className="w-full" disabled>
            <Clock className="w-4 h-4 mr-2" />
            Notify Me When Available
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
