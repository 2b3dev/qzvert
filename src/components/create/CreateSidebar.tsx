import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  BookOpenCheck,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileImage,
  FolderOpen,
  GitBranch,
  GraduationCap,
  Home,
  Image,
  Languages,
  LayoutTemplate,
  Map,
  MessageSquare,
  Minus,
  Plus,
  Presentation,
  School,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/utils'

export type CreatorType =
  // Content
  | 'quiz'
  | 'quest'
  | 'lesson'
  | 'flashcard'
  | 'roleplay'
  // Organization
  | 'course'
  | 'classroom'
  | 'collection'
  | 'challenge'
  | 'template'
  | 'aiTutor'
  // Media
  | 'infographic'
  | 'diagram'
  | 'cards'
  | 'slides'
  | 'cover'

interface SidebarItemType {
  id: CreatorType
  labelKey: string
  icon: LucideIcon
  available: boolean
  badge?: 'new' | 'beta' | 'coming'
}

interface SidebarSection {
  id: string
  titleKey: string
  icon: LucideIcon
  color: string
  items: SidebarItemType[]
}

const sidebarSections: SidebarSection[] = [
  {
    id: 'content',
    titleKey: 'create.sidebar.learningContent',
    icon: BookOpen,
    color: 'text-purple-500',
    items: [
      {
        id: 'quiz',
        labelKey: 'create.types.quiz.name',
        icon: GraduationCap,
        available: true,
      },
      {
        id: 'quest',
        labelKey: 'create.types.quest.name',
        icon: Map,
        available: true,
      },
      {
        id: 'lesson',
        labelKey: 'create.types.lesson.name',
        icon: BookOpenCheck,
        available: true,
      },
      {
        id: 'flashcard',
        labelKey: 'create.types.flashcard.name',
        icon: Languages,
        available: true,
        badge: 'new',
      },
      {
        id: 'roleplay',
        labelKey: 'create.types.roleplay.name',
        icon: MessageSquare,
        available: true,
        badge: 'new',
      },
    ],
  },
  {
    id: 'organization',
    titleKey: 'create.sidebar.organization',
    icon: FolderOpen,
    color: 'text-blue-500',
    items: [
      {
        id: 'course',
        labelKey: 'create.types.course.name',
        icon: School,
        available: true,
        badge: 'new',
      },
      {
        id: 'classroom',
        labelKey: 'create.types.classroom.name',
        icon: Users,
        available: true,
        badge: 'new',
      },
      {
        id: 'collection',
        labelKey: 'create.types.collection.name',
        icon: FolderOpen,
        available: true,
        badge: 'new',
      },
      {
        id: 'challenge',
        labelKey: 'create.types.challenge.name',
        icon: Trophy,
        available: true,
        badge: 'new',
      },
      {
        id: 'template',
        labelKey: 'create.types.template.name',
        icon: LayoutTemplate,
        available: true,
        badge: 'new',
      },
      {
        id: 'aiTutor',
        labelKey: 'create.types.aiTutor.name',
        icon: Bot,
        available: true,
        badge: 'beta',
      },
    ],
  },
  {
    id: 'media',
    titleKey: 'create.sidebar.mediaAssets',
    icon: Image,
    color: 'text-pink-500',
    items: [
      {
        id: 'infographic',
        labelKey: 'create.types.infographic.name',
        icon: FileImage,
        available: true,
        badge: 'new',
      },
      {
        id: 'diagram',
        labelKey: 'create.types.diagram.name',
        icon: GitBranch,
        available: true,
        badge: 'new',
      },
      {
        id: 'cards',
        labelKey: 'create.types.cards.name',
        icon: Image,
        available: true,
        badge: 'new',
      },
      {
        id: 'slides',
        labelKey: 'create.types.slides.name',
        icon: Presentation,
        available: true,
        badge: 'new',
      },
      {
        id: 'cover',
        labelKey: 'create.types.cover.name',
        icon: FileImage,
        available: true,
        badge: 'new',
      },
    ],
  },
]

interface CreateSidebarProps {
  activeCreator: CreatorType | null
  onSelectCreator: (type: CreatorType | null) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
  isQuickStartEditMode?: boolean
  quickStartItems?: CreatorType[]
  onAddToQuickStart?: (type: CreatorType) => void
  onRemoveFromQuickStart?: (type: CreatorType) => void
}

export function CreateSidebar({
  activeCreator,
  onSelectCreator,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  isQuickStartEditMode = false,
  quickStartItems = [],
  onAddToQuickStart,
  onRemoveFromQuickStart,
}: CreateSidebarProps) {
  const { t } = useTranslation()

  const getBadgeStyle = (badge?: 'new' | 'beta' | 'coming') => {
    switch (badge) {
      case 'new':
        return 'bg-emerald-500/20 text-emerald-500'
      case 'beta':
        return 'bg-amber-500/20 text-amber-500'
      case 'coming':
        return 'bg-muted text-muted-foreground'
      default:
        return ''
    }
  }

  const getBadgeText = (badge?: 'new' | 'beta' | 'coming') => {
    switch (badge) {
      case 'new':
        return t('common.new')
      case 'beta':
        return t('common.beta')
      case 'coming':
        return t('common.comingSoon')
      default:
        return ''
    }
  }

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">
              {t('create.title')}
            </span>
          </div>
        )}
        {/* Desktop collapse button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Home Button */}
      <div className="px-2 pt-4 pb-2">
        <motion.button
          whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onSelectCreator(null)
            onCloseMobile()
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            isCollapsed && 'justify-center px-2',
            activeCreator === null
              ? 'bg-primary/10 text-primary border-l-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
          title={isCollapsed ? t('create.sidebar.home') : undefined}
        >
          <Home
            className={cn(
              'w-5 h-5 shrink-0',
              activeCreator === null && 'text-primary',
            )}
          />
          {!isCollapsed && (
            <span className="flex-1 text-left text-sm font-medium">
              {t('create.sidebar.home')}
            </span>
          )}
        </motion.button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {sidebarSections.map((section) => (
          <div key={section.id} className="mb-6">
            {/* Section title */}
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-2">
                <section.icon className={cn('w-4 h-4', section.color)} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t(section.titleKey)}
                </span>
              </div>
            )}

            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={activeCreator === item.id}
                  onSelect={() => {
                    if (item.available && !isQuickStartEditMode) {
                      onSelectCreator(item.id)
                      onCloseMobile()
                    }
                  }}
                  getBadgeStyle={getBadgeStyle}
                  getBadgeText={getBadgeText}
                  t={t}
                  isQuickStartEditMode={isQuickStartEditMode}
                  isInQuickStart={quickStartItems.includes(item.id)}
                  onAddToQuickStart={onAddToQuickStart}
                  onRemoveFromQuickStart={onRemoveFromQuickStart}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Recent & Templates */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">{t('create.sidebar.recent')}</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-sm">{t('create.sidebar.templates')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 64 : 280,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden md:flex flex-col bg-card border-r border-border h-[calc(100vh-64px)] sticky top-16"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 w-[280px] h-full bg-card border-r border-border z-50 shadow-lg"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// Gradient mapping for each creator type
export const creatorGradients: Record<
  CreatorType,
  { gradient: string; hoverGradient: string }
> = {
  quiz: {
    gradient: 'from-purple-500 to-pink-500',
    hoverGradient: 'group-hover:from-purple-600 group-hover:to-pink-600',
  },
  quest: {
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'group-hover:from-blue-600 group-hover:to-cyan-600',
  },
  lesson: {
    gradient: 'from-teal-500 to-emerald-500',
    hoverGradient: 'group-hover:from-teal-600 group-hover:to-emerald-600',
  },
  flashcard: {
    gradient: 'from-emerald-500 to-green-500',
    hoverGradient: 'group-hover:from-emerald-600 group-hover:to-green-600',
  },
  roleplay: {
    gradient: 'from-rose-500 to-pink-500',
    hoverGradient: 'group-hover:from-rose-600 group-hover:to-pink-600',
  },
  course: {
    gradient: 'from-blue-500 to-indigo-500',
    hoverGradient: 'group-hover:from-blue-600 group-hover:to-indigo-600',
  },
  classroom: {
    gradient: 'from-cyan-500 to-blue-500',
    hoverGradient: 'group-hover:from-cyan-600 group-hover:to-blue-600',
  },
  collection: {
    gradient: 'from-teal-500 to-emerald-500',
    hoverGradient: 'group-hover:from-teal-600 group-hover:to-emerald-600',
  },
  challenge: {
    gradient: 'from-amber-500 to-orange-500',
    hoverGradient: 'group-hover:from-amber-600 group-hover:to-orange-600',
  },
  template: {
    gradient: 'from-slate-500 to-gray-500',
    hoverGradient: 'group-hover:from-slate-600 group-hover:to-gray-600',
  },
  aiTutor: {
    gradient: 'from-violet-500 to-purple-500',
    hoverGradient: 'group-hover:from-violet-600 group-hover:to-purple-600',
  },
  infographic: {
    gradient: 'from-rose-500 to-pink-500',
    hoverGradient: 'group-hover:from-rose-600 group-hover:to-pink-600',
  },
  diagram: {
    gradient: 'from-indigo-500 to-violet-500',
    hoverGradient: 'group-hover:from-indigo-600 group-hover:to-violet-600',
  },
  cards: {
    gradient: 'from-pink-500 to-rose-500',
    hoverGradient: 'group-hover:from-pink-600 group-hover:to-rose-600',
  },
  slides: {
    gradient: 'from-orange-500 to-red-500',
    hoverGradient: 'group-hover:from-orange-600 group-hover:to-red-600',
  },
  cover: {
    gradient: 'from-fuchsia-500 to-pink-500',
    hoverGradient: 'group-hover:from-fuchsia-600 group-hover:to-pink-600',
  },
}

// Get icon for a creator type
export function getCreatorIcon(type: CreatorType): LucideIcon {
  for (const section of sidebarSections) {
    const item = section.items.find((i) => i.id === type)
    if (item) return item.icon
  }
  return GraduationCap
}

// Sidebar item component with +/- buttons for edit mode
interface SidebarItemComponentProps {
  item: SidebarItemType
  isCollapsed: boolean
  isActive: boolean
  onSelect: () => void
  getBadgeStyle: (badge?: 'new' | 'beta' | 'coming') => string
  getBadgeText: (badge?: 'new' | 'beta' | 'coming') => string
  t: (key: string) => string
  isQuickStartEditMode?: boolean
  isInQuickStart?: boolean
  onAddToQuickStart?: (type: CreatorType) => void
  onRemoveFromQuickStart?: (type: CreatorType) => void
}

function SidebarItem({
  item,
  isCollapsed,
  isActive,
  onSelect,
  getBadgeStyle,
  getBadgeText,
  t,
  isQuickStartEditMode = false,
  isInQuickStart = false,
  onAddToQuickStart,
  onRemoveFromQuickStart,
}: SidebarItemComponentProps) {
  const isClickDisabled = !item.available || isQuickStartEditMode
  const canModifyQuickStart = item.available && isQuickStartEditMode

  return (
    <div className="relative flex items-center gap-1">
      <motion.button
        whileHover={isClickDisabled ? {} : { scale: 1.02, x: isCollapsed ? 0 : 4 }}
        whileTap={isClickDisabled ? {} : { scale: 0.98 }}
        onClick={onSelect}
        disabled={isClickDisabled}
        className={cn(
          'flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isCollapsed && 'justify-center px-2',
          isActive && !isQuickStartEditMode
            ? 'bg-primary/10 text-primary border-l-2 border-primary'
            : isClickDisabled
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        )}
        title={isCollapsed ? t(item.labelKey) : undefined}
      >
        <item.icon
          className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-sm">{t(item.labelKey)}</span>
            {item.badge && !isQuickStartEditMode && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  getBadgeStyle(item.badge),
                )}
              >
                {getBadgeText(item.badge)}
              </span>
            )}
          </>
        )}
      </motion.button>

      {/* Add/Remove button in edit mode */}
      {!isCollapsed && canModifyQuickStart && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (isInQuickStart) {
              onRemoveFromQuickStart?.(item.id)
            } else {
              onAddToQuickStart?.(item.id)
            }
          }}
          className={cn(
            'p-0.5 rounded-full transition-all cursor-pointer',
            isInQuickStart
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/80',
          )}
          title={isInQuickStart ? t('common.remove') : t('common.add')}
        >
          {isInQuickStart ? (
            <Minus className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </motion.button>
      )}
    </div>
  )
}

export { sidebarSections }
export type { SidebarItemType as SidebarItem }
