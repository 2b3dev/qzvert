import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Lock, Map, Sparkles, Wand2, GraduationCap, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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

interface FlashcardSettings {
  mode: 'auto' | 'custom'
  cardCount: 'auto' | number
  includeImages: boolean
  spacedRepetition: boolean
  tags: string[]
}

const defaultFlashcardSettings: FlashcardSettings = {
  mode: 'auto',
  cardCount: 'auto',
  includeImages: false,
  spacedRepetition: true,
  tags: [],
}

export function FlashcardCreator() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>('text')
  const [language, setLanguage] = useState<Language>('th')
  const [settings, setSettings] = useState<FlashcardSettings>(defaultFlashcardSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)

  const { setActivity } = useActivityStore()
  const { user, isLoading: isAuthLoading } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

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
      setError('Please login to create flashcards')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // For now, generate as quiz and convert to flashcard format
      // TODO: Add dedicated flashcard generation in gemini.ts
      const flashcards = await generateQuest({
        data: {
          content,
          contentType,
          language,
          outputType: 'flashcard' as any,
          questionCount: typeof settings.cardCount === 'number' ? settings.cardCount : undefined,
          tags: settings.tags.length > 0 ? settings.tags : undefined,
        },
      })

      setActivity(flashcards, content)
      navigate({ to: '/activity/upload/quiz/$id', params: { id: 'new' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
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
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl">
                {t('create.types.flashcard.name')}
              </CardTitle>
              <CardDescription>
                {t('create.types.flashcard.description')}
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

          {/* Flashcard Settings */}
          <div className="space-y-4 p-4 rounded-xl border border-border bg-secondary/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Flashcard Settings
            </h3>

            {/* Card Count */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Card Count</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, mode: 'auto', cardCount: 'auto' }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.mode === 'auto'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t('create.settings.auto')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, mode: 'custom', cardCount: 10 }))
                  }
                  className={`px-3 py-1 rounded-lg text-sm ${
                    settings.mode === 'custom'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t('create.settings.custom')}
                </button>
              </div>
            </div>
            {settings.mode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={settings.cardCount as number}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      cardCount: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-center">
                  {settings.cardCount} cards
                </span>
              </div>
            )}

            {/* Spaced Repetition Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Spaced Repetition</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    spacedRepetition: !prev.spacedRepetition,
                  }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.spacedRepetition ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.spacedRepetition ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
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
