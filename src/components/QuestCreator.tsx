import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, FileText, Video, Type, Loader2, Wand2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/input'
import { generateQuest } from '../server/gemini'
import { useQuestStore } from '../stores/quest-store'
import { useNavigate } from '@tanstack/react-router'

type ContentType = 'text' | 'pdf' | 'video_link'

const contentTypes = [
  { type: 'text' as ContentType, icon: Type, label: 'Text', description: 'Paste any text content' },
  { type: 'pdf' as ContentType, icon: FileText, label: 'PDF', description: 'Coming soon' },
  { type: 'video_link' as ContentType, icon: Video, label: 'Video Link', description: 'Coming soon' },
]

export function QuestCreator() {
  const [selectedType, setSelectedType] = useState<ContentType>('text')
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setQuest = useQuestStore((state) => state.setQuest)
  const navigate = useNavigate()

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
      <Card className="border-purple-500/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Sparkles className="w-12 h-12 text-purple-400" />
            </motion.div>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Your Quest
          </CardTitle>
          <CardDescription className="text-slate-400 text-lg">
            Transform any content into an epic learning adventure
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            {contentTypes.map(({ type, icon: Icon, label, description }) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => type === 'text' && setSelectedType(type)}
                disabled={type !== 'text'}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedType === type
                    ? 'border-purple-500 bg-purple-500/10'
                    : type === 'text'
                    ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    : 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${selectedType === type ? 'text-purple-400' : 'text-slate-400'}`} />
                <div className={`font-medium ${selectedType === type ? 'text-purple-300' : 'text-slate-300'}`}>
                  {label}
                </div>
                <div className="text-xs text-slate-500 mt-1">{description}</div>
              </motion.button>
            ))}
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Your Content</label>
            <Textarea
              placeholder="Paste your learning content here... (articles, notes, documentation, etc.)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] text-base"
            />
            <div className="flex justify-between text-xs text-slate-500">
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
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
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
