import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Bot,
  Clock,
  FolderOpen,
  GraduationCap,
  Image,
  LayoutTemplate,
  Map,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import type { CreatorType } from './CreateSidebar'

interface QuickAction {
  id: CreatorType
  icon: React.ElementType
  gradient: string
  hoverGradient: string
}

const quickActions: QuickAction[] = [
  {
    id: 'quiz',
    icon: GraduationCap,
    gradient: 'from-purple-500 to-pink-500',
    hoverGradient: 'group-hover:from-purple-600 group-hover:to-pink-600',
  },
  {
    id: 'quest',
    icon: Map,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'group-hover:from-blue-600 group-hover:to-cyan-600',
  },
  {
    id: 'flashcard',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-green-500',
    hoverGradient: 'group-hover:from-emerald-600 group-hover:to-green-600',
  },
  {
    id: 'aiTutor',
    icon: Bot,
    gradient: 'from-amber-500 to-orange-500',
    hoverGradient: 'group-hover:from-amber-600 group-hover:to-orange-600',
  },
]

interface CategoryCard {
  id: string
  titleKey: string
  descriptionKey: string
  icon: React.ElementType
  color: string
  bgColor: string
  creators: CreatorType[]
}

const categoryCards: CategoryCard[] = [
  {
    id: 'content',
    titleKey: 'create.sidebar.learningContent',
    descriptionKey: 'create.types.quiz.description',
    icon: BookOpen,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    creators: ['quiz', 'quest', 'lesson', 'flashcard', 'roleplay'],
  },
  {
    id: 'organization',
    titleKey: 'create.sidebar.organization',
    descriptionKey: 'create.types.course.description',
    icon: FolderOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    creators: [
      'course',
      'classroom',
      'collection',
      'challenge',
      'template',
      'aiTutor',
    ],
  },
  {
    id: 'media',
    titleKey: 'create.sidebar.mediaAssets',
    descriptionKey: 'create.types.infographic.description',
    icon: Image,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    creators: ['infographic', 'diagram', 'cards', 'slides', 'cover'],
  },
]

interface CreateDashboardProps {
  onSelectCreator: (type: CreatorType) => void
  userName?: string
}

export function CreateDashboard({
  onSelectCreator,
  userName,
}: CreateDashboardProps) {
  const { t } = useTranslation()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            {t('create.dashboard.welcome')}
            {userName && `, ${userName}`}
          </span>
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('create.dashboard.welcomeMessage')}
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.div variants={item} className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t('create.dashboard.quickStart')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCreator(action.id)}
              className="group relative overflow-hidden rounded-xl p-4 bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />
              <div className="relative flex flex-col items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-foreground">
                  {t(`create.types.${action.id}.name`)}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Category Cards */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-4 mb-8">
        {categoryCards.map((category) => (
          <Card
            key={category.id}
            className="group cursor-pointer hover:border-primary/50 transition-all duration-300"
            onClick={() => onSelectCreator(category.creators[0])}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg ${category.bgColor} flex items-center justify-center`}
                >
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {t(category.titleKey)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {category.creators.length}{' '}
                    {t('create.types.template.name').toLowerCase()}s
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {category.creators.slice(0, 4).map((creatorId) => (
                  <span
                    key={creatorId}
                    className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                  >
                    {t(`create.types.${creatorId}.name`)}
                  </span>
                ))}
                {category.creators.length > 4 && (
                  <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                    +{category.creators.length - 4}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>
                  {t('common.create')} {t(category.titleKey).toLowerCase()}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Recent & Templates Row */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">
                {t('create.dashboard.recentActivities')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('create.dashboard.noRecent')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">
                {t('create.dashboard.popularTemplates')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <LayoutTemplate className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('create.dashboard.noTemplates')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
