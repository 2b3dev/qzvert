import { AnimatePresence, motion } from 'framer-motion'
import { BookOpenCheck, Lock, Map, Sparkles, Wand2, GraduationCap, Lightbulb } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { cn } from '../../../lib/utils'
import { useTranslation } from '../../../hooks/useTranslation'
import { generateQuest } from '../../../server/gemini'
import { isAIGenerationEnabled } from '../../../server/admin-settings'
import { useActivityStore } from '../../../stores/activity-store'
import { useAuthStore } from '../../../stores/auth-store'
import { useProfileStore } from '../../../stores/profile-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card'
import { Button } from '../../ui/button'
import { ContentInput } from '../shared/ContentInput'
import { AIGenerateButton } from '../shared/AIGenerateButton'

type ContentType = 'text' | 'pdf' | 'video_link'
type Language = 'th' | 'en'

interface LessonSettings {
  lessonMode: 'auto' | 'custom'
  moduleCount: 'auto' | number
  tags: string[]
  ageRange: 'auto' | string
  easyExplainEnabled?: boolean
}

const defaultLessonSettings: LessonSettings = {
  lessonMode: 'auto',
  moduleCount: 'auto',
  tags: [],
  ageRange: 'auto',
  easyExplainEnabled: false,
}

export function LessonCreator() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>('text')
  const [language, setLanguage] = useState<Language>('th')
  const [settings, setSettings] = useState<LessonSettings>(defaultLessonSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)

  const { setActivity, setTimeLimitMinutes, setAgeRange, themeConfig, setThemeConfig } = useActivityStore()
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

  // Check if user can use Easy Explain
  const canUseEasyExplain = profile?.role === 'plus' || profile?.role === 'pro' || profile?.role === 'ultra' || profile?.role === 'admin'

  useEffect(() => {
    if (user?.id && !profile) {
      fetchProfile(user.id)
    }
  }, [user?.id, profile, fetchProfile])

  useEffect(() => {
    isAIGenerationEnabled().then(setAiEnabled)
  }, [])

  // Auth gate
  if (!isAuthLoading && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card/80 to-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              {t('create.auth.loginRequired')}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              {t('create.auth.loginMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Wand2 className="w-5 h-5 text-primary" />
                <span>{t('create.auth.features.ai')}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Map className="w-5 h-5 text-primary" />
                <span>{t('create.auth.features.gamified')}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>{t('create.auth.features.quiz')}</span>
              </div>
            </div>
            <Button size="lg" className="w-full" asChild>
              <Link to="/login">
                <Sparkles className="w-5 h-5" />
                {t('create.auth.loginButton')}
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('create.auth.freeStart')}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter some content to transform')
      return
    }

    if (!user) {
      setError('Please login to create a lesson')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const stageCount =
        settings.lessonMode === 'custom' ? (settings.moduleCount as number) : 'auto'

      const lesson = await generateQuest({
        data: {
          content,
          contentType,
          language,
          outputType: 'lesson',
          stageCount: typeof stageCount === 'number' ? stageCount : undefined,
          tags: settings.tags.length > 0 ? settings.tags : undefined,
          ageRange: settings.ageRange !== 'auto' ? settings.ageRange : undefined,
          easyExplainEnabled: settings.easyExplainEnabled,
        },
      })

      setActivity(lesson, content)

      // Set age range - use AI's suggestion if user didn't select manually
      if (settings.ageRange !== 'auto') {
        setAgeRange(settings.ageRange)
      } else if (lesson.age_range) {
        setAgeRange(lesson.age_range)
      }

      setTimeLimitMinutes(null)

      const updatedThemeConfig = {
        ...themeConfig,
        easyExplainEnabled: settings.easyExplainEnabled,
      }
      setThemeConfig(updatedThemeConfig)

      navigate({ to: '/activity/upload/lesson/$id', params: { id: 'new' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate lesson')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card/80 to-card">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <BookOpenCheck className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl">
                {t('create.types.lesson.name')}
              </CardTitle>
              <CardDescription>
                {t('create.types.lesson.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <ContentInput
            content={content}
            onContentChange={setContent}
            contentType={contentType}
            onContentTypeChange={setContentType}
            language={language}
            onLanguageChange={setLanguage}
          />

          {/* Lesson Settings */}
          <div className="space-y-4 p-4 rounded-xl border border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Module Count</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      lessonMode: 'auto',
                      moduleCount: 'auto',
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.lessonMode === 'auto'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t('create.settings.auto')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      lessonMode: 'custom',
                      moduleCount: 3,
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.lessonMode === 'custom'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t('create.settings.custom')}
                </button>
              </div>
            </div>
            {settings.lessonMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.moduleCount as number}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      moduleCount: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8 text-center">
                  {settings.moduleCount}
                </span>
              </div>
            )}

            {/* Easy Explain Mode */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Easy Explain Mode</span>
                {!canUseEasyExplain && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-xs font-medium text-purple-400">
                    Plus
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (canUseEasyExplain) {
                    setSettings((prev) => ({
                      ...prev,
                      easyExplainEnabled: !prev.easyExplainEnabled,
                    }))
                  }
                }}
                disabled={!canUseEasyExplain}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-200",
                  settings.easyExplainEnabled && canUseEasyExplain
                    ? "bg-yellow-500"
                    : "bg-muted",
                  !canUseEasyExplain && "opacity-50 cursor-not-allowed"
                )}
              >
                <motion.div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{
                    left: settings.easyExplainEnabled && canUseEasyExplain ? '1.625rem' : '0.25rem'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {canUseEasyExplain
                ? 'AI จะอธิบายเนื้อหาแบบง่ายๆ ใช้การเปรียบเทียบและตัวอย่างจากชีวิตจริง'
                : 'อัปเกรดเป็น Plus หรือ Pro เพื่อใช้งาน'}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AIGenerateButton
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            disabled={!content.trim()}
            credits={profile?.ai_credits ?? null}
            isAdmin={profile?.role === 'admin'}
            showManualButton={false}
            aiDisabled={!aiEnabled}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
