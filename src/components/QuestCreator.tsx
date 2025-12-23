import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  FileText,
  Video,
  Type,
  Loader2,
  Wand2,
  GraduationCap,
  Map,
  BookOpen,
  MessageSquare,
  Lock,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Textarea } from './ui/input'
import { generateQuest } from '../server/gemini'
import { useQuestStore } from '../stores/quest-store'
import { useAuthStore } from '../stores/auth-store'
import { useNavigate, Link } from '@tanstack/react-router'

type ContentType = 'text' | 'pdf' | 'video_link'
type OutputType = 'quiz' | 'quest' | 'flashcard' | 'roleplay'

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
  const [selectedOutput, setSelectedOutput] = useState<OutputType>('quest')
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setQuest = useQuestStore((state) => state.setQuest)
  const { user, isLoading: isAuthLoading } = useAuthStore()
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

    setIsGenerating(true)
    setError(null)

    try {
      const quest = await generateQuest({ data: { content, contentType: selectedType } })
      setQuest(quest)
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
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Sparkles className="w-12 h-12 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            Create Your Quest
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Transform any content into an epic learning adventure
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
                )
              )}
            </div>
          </div>

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
            <label className="text-sm font-medium text-foreground">Your Content</label>
            <Textarea
              placeholder="Paste your learning content here... (articles, notes, documentation, etc.)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] text-base"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tip: The more detailed your content, the better the quest!</span>
              <span>{content.length} characters</span>
            </div>
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
                Generating your quest...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Learning Quest
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
