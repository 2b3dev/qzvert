import { Link, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  FileText,
  Globe,
  GraduationCap,
  Loader2,
  Lock,
  Map,
  MessageSquare,
  Sparkles,
  Type,
  Video,
  Wand2,
} from 'lucide-react'
import { useState } from 'react'
import { generateQuest } from '../server/gemini'
import { saveQuest } from '../server/quests'
import { useAuthStore } from '../stores/auth-store'
import { useQuestStore } from '../stores/quest-store'
import IconApp from './icon/icon-app'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Textarea } from './ui/input'

type ContentType = 'text' | 'pdf' | 'video_link'
type OutputType = 'quiz' | 'quest' | 'flashcard' | 'roleplay'
type Language = 'th' | 'en'
type QuizType = 'multiple_choice' | 'subjective'

const quizTypeOptions = [
  {
    type: 'multiple_choice' as QuizType,
    label: 'Multiple Choice',
    description: 'เลือกตอบ',
  },
  {
    type: 'subjective' as QuizType,
    label: 'Subjective',
    description: 'เขียนตอบ',
  },
]

const choiceCountOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const questionCountOptions = [5, 10, 15, 20, 25, 30]

const languages = [
  { code: 'th' as Language, label: 'ไทย', flag: '🇹🇭' },
  { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
]

const contentTypes = [
  {
    type: 'text' as ContentType,
    icon: Type,
    label: 'Text',
    description: 'Paste content',
  },
  {
    type: 'pdf' as ContentType,
    icon: FileText,
    label: 'PDF',
    description: 'Coming soon',
  },
  {
    type: 'video_link' as ContentType,
    icon: Video,
    label: 'YouTube',
    description: 'Coming soon',
  },
]

const outputTypes = [
  {
    type: 'quiz' as OutputType,
    icon: GraduationCap,
    label: 'Smart Quiz',
    description: 'Multiple choice, T/F, Fill-blank',
    available: true,
  },
  {
    type: 'quest' as OutputType,
    icon: Map,
    label: 'Quest Course',
    description: 'Stages + Learning Map',
    available: true,
  },
  {
    type: 'flashcard' as OutputType,
    icon: BookOpen,
    label: 'Flashcard',
    description: 'Spaced repetition cards',
    available: false,
  },
  {
    type: 'roleplay' as OutputType,
    icon: MessageSquare,
    label: 'Roleplay',
    description: 'AI conversation practice',
    available: false,
  },
]

export function QuestCreator() {
  const [selectedType, setSelectedType] = useState<ContentType>('text')
  const [selectedOutput, setSelectedOutput] = useState<OutputType>('quiz')
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('th')
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [quizType, setQuizType] = useState<QuizType>('multiple_choice')
  const [choiceCount, setChoiceCount] = useState(4)
  const [isQuizTypeOpen, setIsQuizTypeOpen] = useState(false)
  const [isChoiceCountOpen, setIsChoiceCountOpen] = useState(false)
  const [questionCount, setQuestionCount] = useState(10)
  const [isQuestionCountOpen, setIsQuestionCountOpen] = useState(false)
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setQuest, themeConfig } = useQuestStore()
  const { user, session, isLoading: isAuthLoading } = useAuthStore()
  const navigate = useNavigate()

  // Auth gate - show login prompt if not authenticated
  if (!isAuthLoading && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl mx-auto"
      >
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card/80 to-card">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              เข้าสู่ระบบเพื่อสร้างเควส
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              สมัครสมาชิกฟรี เพื่อเริ่มต้นสร้าง Learning Quest ของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Wand2 className="w-5 h-5 text-primary" />
                <span>AI สร้างเควสจากเนื้อหาในไม่กี่วินาที</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Map className="w-5 h-5 text-primary" />
                <span>แผนที่การเรียนรู้แบบ Gamified</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Quiz หลายรูปแบบ พร้อมคำอธิบาย</span>
              </div>
            </div>
            <Button size="lg" className="w-full" asChild>
              <Link to="/login">
                <Sparkles className="w-5 h-5" />
                เข้าสู่ระบบ / สมัครสมาชิก
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              เริ่มต้นใช้งานฟรี ไม่มีค่าใช้จ่าย
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
      setError('Please login to create a quest')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const quest = await generateQuest({
        data: {
          content,
          contentType: selectedType,
          language: selectedLanguage,
          outputType: selectedOutput,
          quizType: selectedOutput === 'quiz' ? quizType : undefined,
          choiceCount:
            selectedOutput === 'quiz' && quizType === 'multiple_choice'
              ? choiceCount
              : undefined,
          questionCount: selectedOutput === 'quiz' ? questionCount : undefined,
        },
      })
      setQuest(quest)

      // Save quest to Supabase
      await saveQuest({
        data: {
          quest,
          rawContent: content,
          themeConfig,
          accessToken: session!.access_token,
        },
      })

      navigate({ to: '/quest/preview' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quest')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card/80 to-card">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center">
            <div className="flex justify-center mr-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              >
                <IconApp className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Create Your{' '}
              {selectedOutput === 'quiz'
                ? 'Quiz'
                : selectedOutput === 'quest'
                  ? 'Quest'
                  : selectedOutput === 'flashcard'
                    ? 'Flashcard'
                    : 'Roleplay'}
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground text-lg">
            {selectedOutput === 'quiz'
              ? 'Generate smart quiz questions from any content'
              : selectedOutput === 'quest'
                ? 'Transform content into an epic learning adventure'
                : selectedOutput === 'flashcard'
                  ? 'Create flashcards for spaced repetition learning'
                  : 'Practice with AI conversation scenarios'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Output Type Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Output Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {outputTypes.map(
                ({ type, icon: Icon, label, description, available }) => (
                  <motion.button
                    key={type}
                    whileHover={available ? { scale: 1.02 } : {}}
                    whileTap={available ? { scale: 0.98 } : {}}
                    onClick={() => available && setSelectedOutput(type)}
                    disabled={!available}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedOutput === type
                        ? 'border-primary bg-primary/10'
                        : available
                          ? 'border-border hover:border-muted-foreground bg-secondary/50'
                          : 'border-border bg-secondary/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${selectedOutput === type ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div
                      className={`font-medium text-sm ${selectedOutput === type ? 'text-primary' : 'text-foreground'}`}
                    >
                      {label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {available ? description : 'Coming soon'}
                    </div>
                  </motion.button>
                ),
              )}
            </div>
          </div>

          {/* Quiz Options - Only show when Smart Quiz is selected */}
          <AnimatePresence>
            {selectedOutput === 'quiz' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Number of Questions Dropdown */}
                <div className="relative">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Number of Questions
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuestionCountOpen(!isQuestionCountOpen)
                      setIsQuizTypeOpen(false)
                      setIsChoiceCountOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
                  >
                    <span className="font-medium">{questionCount} questions</span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                        isQuestionCountOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isQuestionCountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto"
                      >
                        {/* Custom number input */}
                        <div className="px-4 py-3 border-b border-border">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Custom number
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={questionCount}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10)
                              if (!isNaN(value) && value >= 1 && value <= 100) {
                                setQuestionCount(value)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => setIsQuestionCountOpen(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsQuestionCountOpen(false)
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            placeholder="1-100"
                          />
                        </div>
                        {/* Preset options */}
                        {questionCountOptions.map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              setQuestionCount(count)
                              setIsQuestionCountOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors ${
                              questionCount === count
                                ? 'bg-primary/10 text-primary'
                                : ''
                            }`}
                          >
                            <span className="font-medium">{count} questions</span>
                            {questionCount === count && (
                              <span className="text-primary">✓</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quiz Type Dropdown */}
                  <div className="relative">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Question Type
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuizTypeOpen(!isQuizTypeOpen)
                        setIsChoiceCountOpen(false)
                        setIsQuestionCountOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
                    >
                      <span className="font-medium">
                        {
                          quizTypeOptions.find((q) => q.type === quizType)
                            ?.label
                        }
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                          isQuizTypeOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isQuizTypeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                        >
                          {quizTypeOptions.map(
                            ({ type, label, description }) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setQuizType(type)
                                  setIsQuizTypeOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors ${
                                  quizType === type
                                    ? 'bg-primary/10 text-primary'
                                    : ''
                                }`}
                              >
                                <div>
                                  <div className="font-medium">{label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {description}
                                  </div>
                                </div>
                                {quizType === type && (
                                  <span className="text-primary">✓</span>
                                )}
                              </button>
                            ),
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Choice Count Dropdown - Only for Multiple Choice */}
                  <AnimatePresence>
                    {quizType === 'multiple_choice' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="relative"
                      >
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Number of Choices
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChoiceCountOpen(!isChoiceCountOpen)
                            setIsQuizTypeOpen(false)
                            setIsQuestionCountOpen(false)
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
                        >
                          <span className="font-medium">
                            {choiceCount} choices
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                              isChoiceCountOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isChoiceCountOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                            >
                              {choiceCountOptions.map((count) => (
                                <button
                                  key={count}
                                  type="button"
                                  onClick={() => {
                                    setChoiceCount(count)
                                    setIsChoiceCountOpen(false)
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors ${
                                    choiceCount === count
                                      ? 'bg-primary/10 text-primary'
                                      : ''
                                  }`}
                                >
                                  <span className="font-medium">
                                    {count} choices
                                  </span>
                                  {choiceCount === count && (
                                    <span className="text-primary">✓</span>
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Type Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Input Source
            </label>
            <div className="grid grid-cols-3 gap-3">
              {contentTypes.map(({ type, icon: Icon, label, description }) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => type === 'text' && setSelectedType(type)}
                  disabled={type !== 'text'}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedType === type
                      ? 'border-primary bg-primary/10'
                      : type === 'text'
                        ? 'border-border hover:border-muted-foreground bg-secondary/50'
                        : 'border-border bg-secondary/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mx-auto mb-2 ${selectedType === type ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <div
                    className={`font-medium text-sm ${selectedType === type ? 'text-primary' : 'text-foreground'}`}
                  >
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {description}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Your Content
            </label>
            <Textarea
              placeholder="Paste your learning content here... (articles, notes, documentation, etc.)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] text-base"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Tip: The more detailed your content, the better the quest!
              </span>
              <span>{content.length} characters</span>
            </div>
          </div>

          {/* Language Dropdown */}
          <div className="relative">
            <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Quest Language (ภาษาที่จะ generate)
            </label>
            <button
              type="button"
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {languages.find((l) => l.code === selectedLanguage)?.flag}
                </span>
                <span className="font-medium">
                  {languages.find((l) => l.code === selectedLanguage)?.label}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                  isLanguageOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isLanguageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden"
                >
                  {languages.map(({ code, label, flag }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(code)
                        setIsLanguageOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                        selectedLanguage === code
                          ? 'bg-primary/10 text-primary'
                          : ''
                      }`}
                    >
                      <span className="text-xl">{flag}</span>
                      <span className="font-medium">{label}</span>
                      {selectedLanguage === code && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
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

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating || !content.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating your{' '}
                {selectedOutput === 'quiz'
                  ? 'quiz'
                  : selectedOutput === 'quest'
                    ? 'quest'
                    : selectedOutput === 'flashcard'
                      ? 'flashcard'
                      : 'roleplay'}
                ...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate{' '}
                {selectedOutput === 'quiz'
                  ? 'Quiz'
                  : selectedOutput === 'quest'
                    ? 'Quest'
                    : selectedOutput === 'flashcard'
                      ? 'Flashcard'
                      : 'Roleplay'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
