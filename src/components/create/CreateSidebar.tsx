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

interface SidebarItem {
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
  items: SidebarItem[]
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
}

export function CreateSidebar({
  activeCreator,
  onSelectCreator,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
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
              'w-5 h-5 flex-shrink-0',
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
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (item.available) {
                      onSelectCreator(item.id)
                      onCloseMobile()
                    }
                  }}
                  disabled={!item.available}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isCollapsed && 'justify-center px-2',
                    activeCreator === item.id
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : item.available
                        ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        : 'text-muted-foreground/50 cursor-not-allowed',
                  )}
                  title={isCollapsed ? t(item.labelKey) : undefined}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      activeCreator === item.id && 'text-primary',
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left text-sm">
                        {t(item.labelKey)}
                      </span>
                      {item.badge && (
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

export { sidebarSections }
