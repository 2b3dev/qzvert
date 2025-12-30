import { AnimatePresence, motion } from 'framer-motion'
import { GraduationCap, Lock, Map, Sparkles, Wand2 } from 'lucide-react'
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
import { QuizSettings } from '../../QuizSettings'
import type { QuizSettingsData } from '../../QuizSettings'
import { ContentInput } from '../shared/ContentInput'
import { AIGenerateButton } from '../shared/AIGenerateButton'

type ContentType = 'text' | 'pdf' | 'video_link'
type Language = 'th' | 'en'

const defaultQuizSettings: QuizSettingsData = {
  quizTypeMode: 'auto',
  quizModes: ['multiple_choice'],
  questionCount: 'auto',
  multipleChoiceCount: 'auto',
  subjectiveCount: 'auto',
  choiceCount: 4,
  timerEnabled: false,
  timerSeconds: 300,
  tags: [],
  ageRange: 'auto',
}

export function QuizCreator() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>('text')
  const [language, setLanguage] = useState<Language>('th')
  const [settings, setSettings] = useState<QuizSettingsData>(defaultQuizSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)

  const { setActivity, setTimeLimitMinutes, setAgeRange, themeConfig, setThemeConfig } = useActivityStore()
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
        <Card className="border-primary/20 bg-linear-to-br from-card via-card/80 to-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent">
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

  const handleCreateManual = () => {
    const questionCount =
      settings.questionCount === 'auto' ? 5 : settings.questionCount
    const choiceCount = settings.choiceCount

    const emptyQuestions = Array.from({ length: questionCount }, () => ({
      type: 'multiple_choice' as const,
      question: '',
      options: Array.from({ length: choiceCount }, () => ''),
      correct_answer: 0,
      explanation: '',
      points: 100,
    }))

    const emptyQuiz = {
      title: 'Untitled',
      description: '',
      type: 'quiz' as const,
      tags: settings.tags,
      quizzes: emptyQuestions,
    }

    if (settings.timerEnabled) {
      setTimeLimitMinutes(Math.floor(settings.timerSeconds / 60))
    }

    if (settings.ageRange !== 'auto') {
      setAgeRange(settings.ageRange)
    }

    setActivity(emptyQuiz, '')
    navigate({ to: '/activity/upload/quiz/$id', params: { id: 'new' } })
  }

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter some content to transform')
      return
    }

    if (!user) {
      setError('Please login to create a quiz')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      let quizTypes: Array<'multiple_choice' | 'subjective'> | undefined
      let questionCount: number | undefined
      let multipleChoiceCount: number | undefined
      let subjectiveCount: number | undefined
      let choiceCount: number | undefined

      if (settings.quizTypeMode === 'auto') {
        quizTypes = undefined
        questionCount = undefined
        choiceCount = undefined
      } else {
        quizTypes = settings.quizModes
        const isBothMode = settings.quizModes.length === 2

        if (isBothMode) {
          multipleChoiceCount =
            typeof settings.multipleChoiceCount === 'number'
              ? settings.multipleChoiceCount
              : undefined
          subjectiveCount =
            typeof settings.subjectiveCount === 'number'
              ? settings.subjectiveCount
              : undefined
        } else {
          questionCount =
            typeof settings.questionCount === 'number'
              ? settings.questionCount
              : undefined
        }

        choiceCount = settings.quizModes.includes('multiple_choice')
          ? settings.choiceCount
          : undefined
      }

      const quiz = await generateQuest({
        data: {
          content,
          contentType,
          language,
          outputType: 'quiz',
          quizTypes,
          choiceCount,
          questionCount,
          multipleChoiceCount,
          subjectiveCount,
          tags: settings.tags.length > 0 ? settings.tags : undefined,
          ageRange: settings.ageRange !== 'auto' ? settings.ageRange : undefined,
        },
      })

      setActivity(quiz, content)

      // Set age range - use AI's suggestion if user didn't select manually
      if (settings.ageRange !== 'auto') {
        setAgeRange(settings.ageRange)
      } else if (quiz.age_range) {
        setAgeRange(quiz.age_range)
      }

      if (settings.timerEnabled && settings.timerSeconds > 0) {
        setTimeLimitMinutes(Math.ceil(settings.timerSeconds / 60))
      } else {
        setTimeLimitMinutes(null)
      }

      const updatedThemeConfig = {
        ...themeConfig,
        timerEnabled: settings.timerEnabled,
        timerSeconds: settings.timerSeconds,
      }
      setThemeConfig(updatedThemeConfig)

      navigate({ to: '/activity/upload/quiz/$id', params: { id: 'new' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
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
      <Card className="border-primary/20 bg-linear-to-br from-card via-card/80 to-card">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl">
                {t('create.types.quiz.name')}
              </CardTitle>
              <CardDescription>
                {t('create.types.quiz.description')}
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

          <QuizSettings
            type="quiz"
            settings={settings}
            onChange={setSettings}
          />

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
            onManualCreate={handleCreateManual}
            isGenerating={isGenerating}
            disabled={!content.trim()}
            credits={profile?.ai_credits ?? null}
            isAdmin={profile?.role === 'admin'}
            aiDisabled={!aiEnabled}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
