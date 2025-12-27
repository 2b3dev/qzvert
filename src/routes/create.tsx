import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  FileImage,
  FolderOpen,
  GitBranch,
  Image,
  LayoutTemplate,
  Menu,
  Presentation,
  School,
  Trophy,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import {
  ComingSoonCreator,
  CreateDashboard,
  CreateSidebar,
  FlashcardCreator,
  LessonCreator,
  QuestCreatorComponent,
  QuizCreator,
  RoleplayCreator,
} from '../components/create'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import { useTranslation } from '../hooks/useTranslation'

import type { CreatorType } from '../components/create'

export const Route = createFileRoute('/create')({ component: CreatePage })

function CreatePage() {
  const { t } = useTranslation()
  const [activeCreator, setActiveCreator] = useState<CreatorType | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderCreator = () => {
    if (!activeCreator) {
      return (
        <CreateDashboard
          onSelectCreator={setActiveCreator}
          userName={undefined}
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
          />
        )
    }
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-16 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
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

        <div className="flex">
          {/* Sidebar */}
          <CreateSidebar
            activeCreator={activeCreator}
            onSelectCreator={setActiveCreator}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8">
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
    </DefaultLayout>
  )
}
