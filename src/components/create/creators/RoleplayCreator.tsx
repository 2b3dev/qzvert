import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Lock, Map, MessageSquare, Sparkles, Wand2, GraduationCap, User } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../hooks/useTranslation'
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
import { Textarea } from '../../ui/input'

type ContentType = 'text' | 'pdf' | 'video_link'
type Language = 'th' | 'en'

interface RoleplaySettings {
  characterName: string
  characterPersonality: string
  scenario: string
  objectives: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const defaultRoleplaySettings: RoleplaySettings = {
  characterName: '',
  characterPersonality: '',
  scenario: '',
  objectives: [],
  difficulty: 'intermediate',
}

export function RoleplayCreator() {
  const { t } = useTranslation()

  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>('text')
  const [language, setLanguage] = useState<Language>('th')
  const [settings, setSettings] = useState<RoleplaySettings>(defaultRoleplaySettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user, isLoading: isAuthLoading } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

  useEffect(() => {
    if (user?.id && !profile) {
      fetchProfile(user.id)
    }
  }, [user?.id, profile, fetchProfile])

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
      setError('Please enter some content or scenario description')
      return
    }

    if (!user) {
      setError('Please login to create a roleplay scenario')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // TODO: Implement roleplay generation
      // For now, show a coming soon message
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setError('Roleplay generation is coming soon! Stay tuned.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roleplay')
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl">
                {t('create.types.roleplay.name')}
              </CardTitle>
              <CardDescription>
                {t('create.types.roleplay.description')}
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

          {/* Roleplay Settings */}
          <div className="space-y-4 p-4 rounded-xl border border-border bg-secondary/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              AI Character Settings
            </h3>

            {/* Character Name */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Character Name
              </label>
              <input
                type="text"
                value={settings.characterName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, characterName: e.target.value }))
                }
                placeholder="e.g., Professor Smith, Hotel Receptionist"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Character Personality */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Personality & Speaking Style
              </label>
              <Textarea
                value={settings.characterPersonality}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    characterPersonality: e.target.value,
                  }))
                }
                placeholder="e.g., Friendly and patient, uses simple language, encourages the learner..."
                className="min-h-[80px]"
              />
            </div>

            {/* Difficulty */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Difficulty Level</span>
              <div className="flex items-center gap-1">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, difficulty: level }))
                    }
                    className={`px-3 py-1 rounded-lg text-sm capitalize ${
                      settings.difficulty === level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
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
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
