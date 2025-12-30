import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { arrayMove } from '@dnd-kit/sortable'
import { setTheme, type Theme } from '@/server/theme'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  FileImage,
  FolderOpen,
  GitBranch,
  Globe,
  Image,
  LayoutTemplate,
  Menu,
  Moon,
  Presentation,
  School,
  Sun,
  Trophy,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  ComingSoonCreator,
  CreateDashboard,
  CreateSidebar,
  DEFAULT_QUICK_START_ITEMS,
  FlashcardCreator,
  getCreatorIcon,
  LessonCreator,
  QuestCreatorComponent,
  QuizCreator,
  RoleplayCreator,
  creatorGradients,
} from '../components/create'
import { Button } from '../components/ui/button'
import { useTranslation } from '../hooks/useTranslation'
import { Route as RootRoute } from './__root'

import type { CreatorType } from '../components/create'

const QUICK_START_STORAGE_KEY = 'qzvert-quick-start-items'
const MAX_QUICK_START_ITEMS = 12

export const Route = createFileRoute('/create')({ component: CreatePage })

function CreatePage() {
  const { t, language, toggleLanguage } = useTranslation()
  const { theme } = RootRoute.useLoaderData()
  const router = useRouter()
  const [activeCreator, setActiveCreator] = useState<CreatorType | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [isQuickStartEditMode, setIsQuickStartEditMode] = useState(false)

  // Quick Start items with localStorage persistence
  const [quickStartItems, setQuickStartItems] = useState<CreatorType[]>(DEFAULT_QUICK_START_ITEMS)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(QUICK_START_STORAGE_KEY)
    if (stored) {
      try {
        setQuickStartItems(JSON.parse(stored))
      } catch {
        // Keep default items on parse error
      }
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when quickStartItems changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        QUICK_START_STORAGE_KEY,
        JSON.stringify(quickStartItems),
      )
    }
  }, [quickStartItems, isHydrated])

  // Drag sensors - use multiple sensors for better UX
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag start (only for quick start reordering)
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }, [])

  // Handle drag end (only for quick start reordering)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveDragId(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Reordering within quick start
      if (activeId.startsWith('quick-') && overId.startsWith('quick-')) {
        const activeIndex = quickStartItems.findIndex(
          (item) => `quick-${item}` === activeId,
        )
        const overIndex = quickStartItems.findIndex(
          (item) => `quick-${item}` === overId,
        )

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          setQuickStartItems((prev) => arrayMove(prev, activeIndex, overIndex))
        }
      }
    },
    [quickStartItems],
  )

  // Add item to quick start (from sidebar + button)
  const handleAddToQuickStart = useCallback(
    (type: CreatorType) => {
      if (!quickStartItems.includes(type) && quickStartItems.length < MAX_QUICK_START_ITEMS) {
        setQuickStartItems((prev) => [...prev, type])
      }
    },
    [quickStartItems],
  )

  // Remove item from quick start (from sidebar - button or quick start X button)
  const handleRemoveFromQuickStart = useCallback(
    (type: CreatorType) => {
      setQuickStartItems((prev) => prev.filter((item) => item !== type))
    },
    [],
  )

  // Get drag overlay content (only for quick start items)
  const getDragOverlayContent = () => {
    if (!activeDragId || !activeDragId.startsWith('quick-')) return null

    const creatorType = activeDragId.replace('quick-', '') as CreatorType
    const Icon = getCreatorIcon(creatorType)
    const gradients = creatorGradients[creatorType]

    return (
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-primary shadow-lg">
        <div
          className={`w-12 h-12 rounded-xl bg-linear-to-br ${gradients.gradient} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="font-medium text-sm">
          {t(`create.types.${creatorType}.name`)}
        </span>
      </div>
    )
  }

  const renderCreator = () => {
    if (!activeCreator) {
      return (
        <CreateDashboard
          onSelectCreator={setActiveCreator}
          userName={undefined}
          quickStartItems={quickStartItems}
          onQuickStartChange={setQuickStartItems}
          isEditMode={isQuickStartEditMode}
          onToggleEditMode={() => setIsQuickStartEditMode((prev) => !prev)}
        />
      )
    }

    switch (activeCreator) {
      // Content Creators
      case 'quiz':
        return <QuizCreator />
      case 'quest':
        return <QuestCreatorComponent />
      case 'lesson':
        return <LessonCreator />
      case 'flashcard':
        return <FlashcardCreator />
      case 'roleplay':
        return <RoleplayCreator />

      // Organization - Coming Soon with planned features
      case 'course':
        return (
          <ComingSoonCreator
            type="course"
            icon={School}
            gradient="from-blue-500 to-indigo-500"
            features={[
              'Combine multiple Quests and activities',
              'Set learning objectives and prerequisites',
              'Track student progress across activities',
              'Issue certificates on completion',
            ]}
          />
        )
      case 'classroom':
        return (
          <ComingSoonCreator
            type="classroom"
            icon={Users}
            gradient="from-cyan-500 to-blue-500"
            features={[
              'Create virtual classrooms with join codes',
              'Assign activities with due dates',
              'Track student progress and grades',
              'Send announcements and feedback',
            ]}
          />
        )
      case 'collection':
        return (
          <ComingSoonCreator
            type="collection"
            icon={FolderOpen}
            gradient="from-teal-500 to-emerald-500"
            features={[
              'Create curated learning paths',
              'Share collections publicly or privately',
              'Add activities from explore page',
              'Reorder and organize content',
            ]}
          />
        )
      case 'challenge':
        return (
          <ComingSoonCreator
            type="challenge"
            icon={Trophy}
            gradient="from-amber-500 to-orange-500"
            features={[
              'Set start and end times',
              'Real-time leaderboards',
              'Prizes and rewards',
              'Team vs individual modes',
            ]}
          />
        )
      case 'template':
        return (
          <ComingSoonCreator
            type="template"
            icon={LayoutTemplate}
            gradient="from-slate-500 to-gray-500"
            features={[
              'Save activity settings as templates',
              'Share templates with others',
              'Quick-start from templates',
              'Customize and override settings',
            ]}
          />
        )
      case 'aiTutor':
        return (
          <ComingSoonCreator
            type="aiTutor"
            icon={Bot}
            gradient="from-violet-500 to-purple-500"
            features={[
              'Create custom AI teaching characters',
              'Define personality and teaching style',
              'Link to specific topics and content',
              'Track tutoring sessions and progress',
            ]}
          />
        )

      // Media - Coming Soon
      case 'infographic':
        return (
          <ComingSoonCreator
            type="infographic"
            icon={FileImage}
            gradient="from-rose-500 to-pink-500"
            features={[
              'AI-generated visual summaries',
              'Multiple layout templates',
              'Export as PNG, PDF, or SVG',
              'Customizable colors and styles',
            ]}
          />
        )
      case 'diagram':
        return (
          <ComingSoonCreator
            type="diagram"
            icon={GitBranch}
            gradient="from-indigo-500 to-violet-500"
            features={[
              'Flowcharts and process diagrams',
              'Mind maps and concept maps',
              'AI-generated from content',
              'Interactive and editable',
            ]}
          />
        )
      case 'cards':
        return (
          <ComingSoonCreator
            type="cards"
            icon={Image}
            gradient="from-pink-500 to-rose-500"
            features={[
              'Illustrated vocabulary cards',
              'AI-generated images',
              'Print-ready formats',
              'Multiple card styles',
            ]}
          />
        )
      case 'slides':
        return (
          <ComingSoonCreator
            type="slides"
            icon={Presentation}
            gradient="from-orange-500 to-red-500"
            features={[
              'Auto-generated presentation slides',
              'Multiple themes and layouts',
              'Export to PowerPoint/PDF',
              'Speaker notes included',
            ]}
          />
        )
      case 'cover':
        return (
          <ComingSoonCreator
            type="cover"
            icon={FileImage}
            gradient="from-fuchsia-500 to-pink-500"
            features={[
              'AI-generated cover art',
              'Thumbnails for activities',
              'Multiple aspect ratios',
              'Brand consistency options',
            ]}
          />
        )

      default:
        return (
          <CreateDashboard
            onSelectCreator={setActiveCreator}
            userName={undefined}
            quickStartItems={quickStartItems}
            onQuickStartChange={setQuickStartItems}
            isEditMode={isQuickStartEditMode}
            onToggleEditMode={() => setIsQuickStartEditMode((prev) => !prev)}
          />
        )
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-linear-to-b from-background via-muted/30 to-background">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2"
          >
            <Menu className="w-5 h-5" />
            <span>{t('create.title')}</span>
          </Button>
        </div>

        <div className="flex min-h-screen">
          {/* Sidebar */}
          <CreateSidebar
            activeCreator={activeCreator}
            onSelectCreator={setActiveCreator}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            isQuickStartEditMode={isQuickStartEditMode}
            quickStartItems={quickStartItems}
            onAddToQuickStart={handleAddToQuickStart}
            onRemoveFromQuickStart={handleRemoveFromQuickStart}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 relative">
            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 z-10">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1"
                aria-label="Toggle language"
                title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'th' ? 'TH' : 'EN'}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={async () => {
                  const newTheme: Theme = theme === 'dark' ? 'light' : 'dark'
                  await setTheme({ data: { theme: newTheme } })
                  router.invalidate()
                }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </motion.div>
              </button>
            </div>

            {/* Back Button when creator is active */}
            <AnimatePresence>
              {activeCreator && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="mb-4"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCreator(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Back to Dashboard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Creator Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCreator || 'dashboard'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCreator()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>{getDragOverlayContent()}</DragOverlay>
    </DndContext>
  )
}
