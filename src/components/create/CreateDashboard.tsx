import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  FolderOpen,
  GripVertical,
  Image,
  LayoutTemplate,
  Pencil,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import {
  creatorGradients,
  getCreatorIcon,
  type CreatorType,
} from './CreateSidebar'

// Default quick start items
export const DEFAULT_QUICK_START_ITEMS: CreatorType[] = [
  'quiz',
  'quest',
  'flashcard',
  'aiTutor',
]

const MAX_QUICK_START_ITEMS = 6

// Sortable Quick Start Item
interface SortableQuickItemProps {
  id: CreatorType
  onSelect: () => void
  onRemove: () => void
  t: (key: string) => string
  isEditMode: boolean
}

function SortableQuickItem({
  id,
  onSelect,
  onRemove,
  t,
  isEditMode,
}: SortableQuickItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `quick-${id}`, disabled: !isEditMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = getCreatorIcon(id)
  const gradients = creatorGradients[id]

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={{ scale: isEditMode ? 1 : 1.03, y: isEditMode ? 0 : -2 }}
      whileTap={{ scale: isEditMode ? 1 : 0.98 }}
      className={cn(
        'group relative overflow-hidden rounded-xl p-4 bg-card border border-border hover:border-primary/50 transition-all duration-300',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary/50 z-50',
        isEditMode && 'ring-2 ring-primary/30 animate-pulse',
      )}
    >
      {/* Remove button - only show in edit mode */}
      {isEditMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-1 right-1 p-1 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-all z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Drag handle - only show in edit mode */}
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 p-1 cursor-grab active:cursor-grabbing text-primary hover:text-primary/80 transition-opacity"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      <div
        className={`absolute inset-0 bg-linear-to-br ${gradients.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />
      <button
        type="button"
        onClick={isEditMode ? undefined : onSelect}
        disabled={isEditMode}
        className={cn(
          'relative flex flex-col items-center gap-3 w-full',
          isEditMode && 'cursor-default',
        )}
      >
        <div
          className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradients.gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="font-medium text-foreground">
          {t(`create.types.${id}.name`)}
        </span>
      </button>
    </motion.div>
  )
}

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
  quickStartItems: CreatorType[]
  onQuickStartChange: (items: CreatorType[]) => void
  isDropTarget?: boolean
  isEditMode: boolean
  onToggleEditMode: () => void
}

export function CreateDashboard({
  onSelectCreator,
  userName,
  quickStartItems,
  onQuickStartChange,
  isDropTarget,
  isEditMode,
  onToggleEditMode,
}: CreateDashboardProps) {
  const { t } = useTranslation()

  const { setNodeRef, isOver } = useDroppable({
    id: 'quick-start-dropzone',
    disabled: !isEditMode,
  })

  const handleRemoveItem = (itemToRemove: CreatorType) => {
    onQuickStartChange(quickStartItems.filter((item) => item !== itemToRemove))
  }

  const canAddMore = quickStartItems.length < MAX_QUICK_START_ITEMS
  const showDropTarget = isEditMode && (isOver || isDropTarget)

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
          <span className="bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('create.dashboard.quickStart')}
          </h2>
          <button
            type="button"
            onClick={onToggleEditMode}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              isEditMode
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4" />
                {t('common.done')}
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                {t('common.edit')}
              </>
            )}
          </button>
        </div>
        {isEditMode && (
          <p className="text-sm text-muted-foreground mb-4">
            {t('create.dashboard.editHint')} ({quickStartItems.length}/{MAX_QUICK_START_ITEMS})
          </p>
        )}
        <div
          ref={setNodeRef}
          className={cn(
            'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 -m-4 rounded-xl transition-all duration-300',
            showDropTarget &&
              canAddMore &&
              'bg-primary/5 ring-2 ring-primary/30 ring-dashed',
            showDropTarget && !canAddMore && 'bg-destructive/5 ring-2 ring-destructive/30 ring-dashed',
          )}
        >
          <SortableContext
            items={quickStartItems.map((id) => `quick-${id}`)}
            strategy={rectSortingStrategy}
          >
            {quickStartItems.map((itemId) => (
              <SortableQuickItem
                key={itemId}
                id={itemId}
                onSelect={() => onSelectCreator(itemId)}
                onRemove={() => handleRemoveItem(itemId)}
                t={t}
                isEditMode={isEditMode}
              />
            ))}
          </SortableContext>

          {/* Drop hint when dragging in edit mode */}
          {showDropTarget && canAddMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-4 min-h-[120px]"
            >
              <div className="flex flex-col items-center gap-2 text-primary">
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">
                  {t('create.dashboard.dropHere')}
                </span>
              </div>
            </motion.div>
          )}

          {/* Show message when full */}
          {showDropTarget && !canAddMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full flex items-center justify-center rounded-xl border-2 border-dashed border-destructive/50 bg-destructive/5 p-4"
            >
              <span className="text-sm text-destructive font-medium">
                {t('create.dashboard.quickStartFull')}
              </span>
            </motion.div>
          )}
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
