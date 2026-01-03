import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Clock,
  History,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ContentInputSection,
  ExtractedContentDisplay,
  ExtractionHistorySidebar,
  type ContentMode,
  type LanguageOption,
  type ProcessMode,
} from '../components/extract'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import type { TextToLoudRef } from '../components/TextToLoud'
import { TextToLoud } from '../components/TextToLoud'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/utils'
import { getSuggestedActivities } from '../server/activities'
import { isAIGenerationEnabled } from '../server/admin-settings'
import { extractContent } from '../server/content-extractor'
import {
  deleteExtraction,
  extractFile,
  getExtractionHistory,
  saveExtraction,
  updateExtraction,
} from '../server/extract-media'
import { craftContent, summarizeContent, translateContent } from '../server/ttl'
import { useAuthStore } from '../stores/auth-store'
import { useProfileStore } from '../stores/profile-store'
import type { ExtractedContent, ExtractionInputType } from '../types/database'

export const Route = createFileRoute('/extract-media')({
  component: ExtractMediaPage,
})

interface SuggestedActivity {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  type: 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'
  play_count: number
  tags: string[] | null
}

// Supported languages with their codes
const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
]

// Activity type styles
const getActivityTypeStyle = (type: string) => {
  switch (type) {
    case 'quiz':
      return { bg: 'from-violet-500 to-purple-600', icon: '🧠' }
    case 'quest':
      return { bg: 'from-amber-500 to-orange-600', icon: '🧭' }
    case 'lesson':
      return { bg: 'from-emerald-500 to-teal-600', icon: '📖' }
    case 'flashcard':
      return { bg: 'from-blue-500 to-indigo-600', icon: '📚' }
    case 'roleplay':
      return { bg: 'from-pink-500 to-rose-600', icon: '💬' }
    default:
      return { bg: 'from-gray-500 to-gray-600', icon: '📝' }
  }
}

// Hero Section component
function HeroSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative py-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto text-center">


        <h1 className="text-2xl md:text-4xl font-black mb-4 leading-tight">
          <span className="text-foreground">{t('extractMedia.title1')}</span>
          <br className="md:hidden" />{' '}
          <span className="bg-linear-to-r from-primary via-emerald-500 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
            {t('extractMedia.title2')}
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('extractMedia.subtitle')}
        </p>
      </div>
    </section>
  )
}

function ExtractMediaPage() {
  const { t, language: uiLanguage } = useTranslation()
  const navigate = useNavigate()

  // User profile
  const { user } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

  // History state
  const [history, setHistory] = useState<ExtractedContent[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)

  // Current extraction state
  const [currentContent, setCurrentContent] = useState<ExtractedContent | null>(
    null,
  )
  const [displayContent, setDisplayContent] = useState('')
  const [contentMode, setContentMode] = useState<ContentMode>('original')
  const [keyPoints, setKeyPoints] = useState<string[]>([])

  // Processed content cache
  const [summarizedContent, setSummarizedContent] = useState('')
  const [summarizedKeyPoints, setSummarizedKeyPoints] = useState<string[]>([])
  const [craftedContent, setCraftedContent] = useState('')
  const [craftedKeyPoints, setCraftedKeyPoints] = useState<string[]>([])

  // Processing states
  const [isExtracting, setIsExtracting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState('')

  // Mode selection
  const [selectedMode, setSelectedMode] = useState<
    'original' | 'summarize' | 'lesson'
  >('original')

  // TTS state
  const [isReaderMode, setIsReaderMode] = useState(false)
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState('en')
  const [detectedLanguage, setDetectedLanguage] = useState('en')
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(
    'female',
  )
  const [rate, setRate] = useState(1)
  const [availableLanguages, setAvailableLanguages] =
    useState<LanguageOption[]>(SUPPORTED_LANGUAGES)
  const [highlightIndex, setHighlightIndex] = useState(0)

  // AI settings
  const [aiEnabled, setAiEnabled] = useState(true)
  const [easyExplainEnabled, setEasyExplainEnabled] = useState(false)
  const canUseEasyExplain =
    profile?.role === 'plus' ||
    profile?.role === 'pro' ||
    profile?.role === 'ultra' ||
    profile?.role === 'admin'

  // Suggestions
  const [suggestedActivities, setSuggestedActivities] = useState<
    SuggestedActivity[]
  >([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Mobile history dropdown
  const [showMobileHistory, setShowMobileHistory] = useState(false)

  // Refs
  const textToLoudRef = useRef<TextToLoudRef>(null)

  // Detect language from text
  const detectLanguage = useCallback((inputText: string): string => {
    if (!inputText.trim()) return 'en'

    const thaiPattern = /[\u0E00-\u0E7F]/
    const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/
    const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/

    const sample = inputText.slice(0, 200)

    if (thaiPattern.test(sample)) return 'th'
    if (japanesePattern.test(sample)) return 'ja'
    if (koreanPattern.test(sample)) return 'ko'
    if (chinesePattern.test(sample)) return 'zh'

    return 'en'
  }, [])

  // Load history from database
  const loadHistory = useCallback(async () => {
    if (!user) {
      setIsHistoryLoading(false)
      return
    }

    try {
      const result = await getExtractionHistory({ data: { limit: 20 } })
      setHistory(result.items)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [user])

  // Fetch user profile and check AI settings
  useEffect(() => {
    if (user?.id && !profile) {
      fetchProfile(user.id)
    }
  }, [user?.id, profile, fetchProfile])

  useEffect(() => {
    isAIGenerationEnabled().then(setAiEnabled)
  }, [])

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Filter available languages based on system voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      const availableLangCodes = new Set(
        voices.map((v) => v.lang.split('-')[0].toLowerCase()),
      )
      const availableLangs = SUPPORTED_LANGUAGES.filter((lang) =>
        availableLangCodes.has(lang.code),
      )
      if (availableLangs.length > 0) {
        setAvailableLanguages(availableLangs)
      }
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Fetch suggestions when content changes
  const fetchSuggestions = useCallback(async (content: string) => {
    if (!content.trim() || content.length < 50) {
      setSuggestedActivities([])
      return
    }

    setLoadingSuggestions(true)
    try {
      const suggestions = await getSuggestedActivities({
        data: { content, limit: 5 },
      })
      setSuggestedActivities(suggestions)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // Handle URL extraction
  const handleUrlExtract = useCallback(
    async (url: string, inputType: 'youtube' | 'web') => {
      setIsExtracting(true)
      try {
        const result = await extractContent({
          data: { input: url, type: inputType },
        })

        const detected = detectLanguage(result.content)
        setDetectedLanguage(detected)
        setSelectedTargetLanguage(detected)

        // Save to database if user is logged in
        if (user) {
          const saved = await saveExtraction({
            data: {
              input_type: inputType,
              original_input: url,
              extracted_text: result.content,
              title: result.metadata?.title || undefined,
              author: result.metadata?.author || undefined,
              language: detected,
            },
          })

          setCurrentContent(saved)
          setCurrentHistoryId(saved.id)
          setDisplayContent(saved.extracted_text)
          setHistory((prev) => [
            saved,
            ...prev.filter((h) => h.id !== saved.id),
          ])
        } else {
          // Guest mode - just display content
          setDisplayContent(result.content)
          setCurrentContent({
            id: '',
            user_id: '',
            input_type: inputType,
            original_input: url,
            source_file_path: null,
            extracted_text: result.content,
            summarized_content: null,
            crafted_content: null,
            key_points: null,
            title: result.metadata?.title || null,
            author: result.metadata?.author || null,
            duration: result.metadata?.duration || null,
            page_count: null,
            word_count: result.content.split(/\s+/).length,
            language: detected,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
          })
        }

        setContentMode('original')
        setKeyPoints([])
        setSummarizedContent('')
        setCraftedContent('')

        toast.success(
          result.metadata?.title
            ? `Extracted: ${result.metadata.title.slice(0, 50)}...`
            : 'Content extracted successfully',
        )

        fetchSuggestions(result.content)
      } catch (error) {
        console.error('URL extraction error:', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to extract content from URL',
        )
      } finally {
        setIsExtracting(false)
      }
    },
    [user, detectLanguage, fetchSuggestions],
  )

  // Handle file extraction
  const handleFileExtract = useCallback(
    async (file: File, base64Data: string, inputType: ExtractionInputType) => {
      setIsExtracting(true)
      try {
        // Map input type to file extraction type
        const fileInputType = inputType as 'pdf' | 'excel' | 'doc' | 'image'

        const result = await extractFile({
          data: {
            base64Data,
            fileName: file.name,
            inputType: fileInputType,
          },
        })

        const detected = detectLanguage(result.text)
        setDetectedLanguage(detected)
        setSelectedTargetLanguage(detected)

        // Save to database if user is logged in
        if (user) {
          const saved = await saveExtraction({
            data: {
              input_type: inputType,
              original_input: file.name,
              extracted_text: result.text,
              title: result.metadata?.title || file.name,
              author: result.metadata?.author || undefined,
              page_count: result.metadata?.pageCount || undefined,
              word_count: result.metadata?.wordCount || undefined,
              language: detected,
            },
          })

          setCurrentContent(saved)
          setCurrentHistoryId(saved.id)
          setDisplayContent(saved.extracted_text)
          setHistory((prev) => [
            saved,
            ...prev.filter((h) => h.id !== saved.id),
          ])
        } else {
          // Guest mode
          setDisplayContent(result.text)
          setCurrentContent({
            id: '',
            user_id: '',
            input_type: inputType,
            original_input: file.name,
            source_file_path: null,
            extracted_text: result.text,
            summarized_content: null,
            crafted_content: null,
            key_points: null,
            title: result.metadata?.title || file.name,
            author: result.metadata?.author || null,
            duration: null,
            page_count: result.metadata?.pageCount || null,
            word_count: result.metadata?.wordCount || null,
            language: detected,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
          })
        }

        setContentMode('original')
        setKeyPoints([])
        setSummarizedContent('')
        setCraftedContent('')

        toast.success(`Extracted from ${file.name}`)

        fetchSuggestions(result.text)
      } catch (error) {
        console.error('File extraction error:', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to extract content from file',
        )
      } finally {
        setIsExtracting(false)
      }
    },
    [user, detectLanguage, fetchSuggestions],
  )

  // Handle history item selection
  const handleHistorySelect = useCallback(
    (item: ExtractedContent) => {
      textToLoudRef.current?.stop()

      setCurrentContent(item)
      setCurrentHistoryId(item.id)
      setDisplayContent(item.extracted_text)
      setContentMode('original')
      setKeyPoints([])

      // Restore cached content
      setSummarizedContent(item.summarized_content || '')
      setSummarizedKeyPoints(item.key_points || [])
      setCraftedContent(item.crafted_content || '')
      setCraftedKeyPoints(item.key_points || [])

      // Set mode based on what's available
      if (item.crafted_content) {
        setSelectedMode('lesson')
        setDisplayContent(item.crafted_content)
        setContentMode('crafted')
        setKeyPoints(item.key_points || [])
      } else if (item.summarized_content) {
        setSelectedMode('summarize')
        setDisplayContent(item.summarized_content)
        setContentMode('summarized')
      } else {
        setSelectedMode('original')
      }

      setDetectedLanguage(item.language || 'en')
      setSelectedTargetLanguage(item.language || 'en')
      setIsReaderMode(false)
      setShowMobileHistory(false)

      fetchSuggestions(item.extracted_text)
    },
    [fetchSuggestions],
  )

  // Handle history deletion
  const handleHistoryDelete = useCallback(
    async (id: string) => {
      try {
        await deleteExtraction({ data: { id } })
        setHistory((prev) => prev.filter((h) => h.id !== id))

        if (currentHistoryId === id) {
          setCurrentContent(null)
          setCurrentHistoryId(null)
          setDisplayContent('')
          setContentMode('original')
        }

        toast.success(
          uiLanguage === 'th' ? 'ลบเรียบร้อย' : 'Deleted successfully',
        )
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(uiLanguage === 'th' ? 'ลบไม่สำเร็จ' : 'Failed to delete')
      }
    },
    [currentHistoryId, uiLanguage],
  )

  // Handle clear all history
  const handleClearAllHistory = useCallback(async () => {
    // Delete one by one (or could use clearExtractionHistory)
    try {
      for (const item of history) {
        await deleteExtraction({ data: { id: item.id } })
      }
      setHistory([])
      setCurrentContent(null)
      setCurrentHistoryId(null)
      setDisplayContent('')

      toast.success(
        uiLanguage === 'th' ? 'ล้างประวัติทั้งหมดแล้ว' : 'All history cleared',
      )
    } catch (error) {
      console.error('Clear all error:', error)
      toast.error(
        uiLanguage === 'th' ? 'ล้างไม่สำเร็จ' : 'Failed to clear history',
      )
    }
  }, [history, uiLanguage])

  // Handle new extraction
  const handleNewExtraction = useCallback(() => {
    textToLoudRef.current?.stop()
    setCurrentContent(null)
    setCurrentHistoryId(null)
    setDisplayContent('')
    setContentMode('original')
    setKeyPoints([])
    setSummarizedContent('')
    setCraftedContent('')
    setSelectedMode('original')
    setIsReaderMode(false)
    setSuggestedActivities([])
  }, [])

  // Handle extract from ContentInputSection
  const handleExtract = useCallback(
    async (data: {
      type: 'text' | 'url' | 'file'
      content: string
      file?: File
      base64Data?: string
      inputType?: ExtractionInputType | 'youtube' | 'web'
      mode: ProcessMode
      targetLanguage: string
      easyExplainEnabled: boolean
    }) => {
      // Update settings
      setSelectedTargetLanguage(data.targetLanguage)
      setSelectedMode(data.mode)
      setEasyExplainEnabled(data.easyExplainEnabled)

      if (data.type === 'text') {
        // Direct text input
        const detected = detectLanguage(data.content)
        setDetectedLanguage(detected)

        // Create content object
        const textContent: ExtractedContent = {
          id: '',
          user_id: '',
          input_type: 'text',
          original_input: data.content.slice(0, 100) + '...',
          source_file_path: null,
          extracted_text: data.content,
          summarized_content: null,
          crafted_content: null,
          key_points: null,
          title: data.content.slice(0, 50),
          author: null,
          duration: null,
          page_count: null,
          word_count: data.content.split(/\s+/).length,
          language: detected,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        }

        // Save to database if user is logged in
        if (user) {
          setIsExtracting(true)
          try {
            const saved = await saveExtraction({
              data: {
                input_type: 'text',
                original_input: data.content.slice(0, 100),
                extracted_text: data.content,
                title: data.content.slice(0, 50),
                language: detected,
              },
            })

            setCurrentContent(saved)
            setCurrentHistoryId(saved.id)
            setHistory((prev) => [
              saved,
              ...prev.filter((h) => h.id !== saved.id),
            ])
            textContent.id = saved.id
          } catch (error) {
            console.error('Failed to save extraction:', error)
          } finally {
            setIsExtracting(false)
          }
        }

        setCurrentContent(textContent)
        setDisplayContent(data.content)
        setContentMode('original')
        setKeyPoints([])
        setSummarizedContent('')
        setCraftedContent('')

        toast.success(
          uiLanguage === 'th'
            ? 'ดึงข้อความสำเร็จ'
            : 'Text extracted successfully',
        )
        fetchSuggestions(data.content)
      } else if (data.type === 'url' && data.inputType) {
        // URL extraction (YouTube or web)
        await handleUrlExtract(
          data.content,
          data.inputType as 'youtube' | 'web',
        )
      } else if (
        data.type === 'file' &&
        data.file &&
        data.base64Data &&
        data.inputType
      ) {
        // File extraction
        await handleFileExtract(
          data.file,
          data.base64Data,
          data.inputType as ExtractionInputType,
        )
      }
    },
    [
      user,
      uiLanguage,
      detectLanguage,
      fetchSuggestions,
      handleUrlExtract,
      handleFileExtract,
    ],
  )

  // Handle mode change from ContentInputSection
  const handleModeChange = useCallback((mode: ProcessMode) => {
    setSelectedMode(mode)
  }, [])

  // Handle mode selection
  const handleModeSelect = useCallback(
    (mode: 'original' | 'summarize' | 'lesson') => {
      setSelectedMode(mode)

      if (mode === 'original') {
        setDisplayContent(currentContent?.extracted_text || '')
        setContentMode('original')
        setKeyPoints([])
      } else if (mode === 'summarize' && summarizedContent) {
        setDisplayContent(summarizedContent)
        setContentMode('summarized')
        setKeyPoints(summarizedKeyPoints)
      } else if (mode === 'lesson' && craftedContent) {
        setDisplayContent(craftedContent)
        setContentMode('crafted')
        setKeyPoints(craftedKeyPoints)
      }
    },
    [
      currentContent,
      summarizedContent,
      summarizedKeyPoints,
      craftedContent,
      craftedKeyPoints,
    ],
  )

  // Handle AI generation
  const handleGenerate = useCallback(async () => {
    if (!currentContent?.extracted_text || selectedMode === 'original') return

    setIsProcessing(true)
    setProcessingAction(selectedMode === 'lesson' ? 'craft' : selectedMode)

    try {
      if (selectedMode === 'summarize') {
        const result = await summarizeContent({
          data: {
            content: currentContent.extracted_text,
            language: selectedTargetLanguage,
            easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
          },
        })

        setSummarizedContent(result.summary)
        setSummarizedKeyPoints([])
        setDisplayContent(result.summary)
        setContentMode('summarized')
        setKeyPoints([])

        // Update in database
        if (currentContent.id && user) {
          await updateExtraction({
            data: {
              id: currentContent.id,
              updates: { summarized_content: result.summary },
            },
          })
          // Update local state
          setCurrentContent((prev) =>
            prev ? { ...prev, summarized_content: result.summary } : null,
          )
          setHistory((prev) =>
            prev.map((h) =>
              h.id === currentContent.id
                ? { ...h, summarized_content: result.summary }
                : h,
            ),
          )
        }

        toast.success(t('ttl.summarized'))
      } else if (selectedMode === 'lesson') {
        const result = await craftContent({
          data: {
            content: currentContent.extracted_text,
            language: selectedTargetLanguage,
            easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
          },
        })

        setCraftedContent(result.crafted)
        setCraftedKeyPoints(result.keyPoints)
        setDisplayContent(result.crafted)
        setContentMode('crafted')
        setKeyPoints(result.keyPoints)

        // Update in database
        if (currentContent.id && user) {
          await updateExtraction({
            data: {
              id: currentContent.id,
              updates: {
                crafted_content: result.crafted,
                key_points: result.keyPoints,
              },
            },
          })
          // Update local state
          setCurrentContent((prev) =>
            prev
              ? {
                  ...prev,
                  crafted_content: result.crafted,
                  key_points: result.keyPoints,
                }
              : null,
          )
          setHistory((prev) =>
            prev.map((h) =>
              h.id === currentContent.id
                ? {
                    ...h,
                    crafted_content: result.crafted,
                    key_points: result.keyPoints,
                  }
                : h,
            ),
          )
        }

        toast.success(t('ttl.crafted'))
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error(t('ttl.error'))
    } finally {
      setIsProcessing(false)
      setProcessingAction('')
    }
  }, [
    currentContent,
    selectedMode,
    selectedTargetLanguage,
    canUseEasyExplain,
    easyExplainEnabled,
    user,
    t,
  ])

  // Handle back to original
  const handleBackToOriginal = useCallback(() => {
    setDisplayContent(currentContent?.extracted_text || '')
    setContentMode('original')
    setKeyPoints([])
  }, [currentContent])

  // TTS callbacks
  const handlePlay = useCallback(async () => {
    // Check if translation needed
    if (
      selectedTargetLanguage !== detectedLanguage &&
      contentMode !== 'translated'
    ) {
      setIsProcessing(true)
      setProcessingAction('translate')

      try {
        const result = await translateContent({
          data: {
            content: displayContent,
            targetLanguage: selectedTargetLanguage,
          },
        })

        setDisplayContent(result.translated)
        setContentMode('translated')
        setKeyPoints([])
        toast.success(t('ttl.translated'))

        // Enter reader mode and play
        setIsReaderMode(true)
        setTimeout(() => {
          textToLoudRef.current?.play()
        }, 100)
      } catch (error) {
        console.error('Translate error:', error)
        toast.error(t('ttl.error'))
      } finally {
        setIsProcessing(false)
        setProcessingAction('')
      }
      return
    }

    setIsReaderMode(true)
  }, [selectedTargetLanguage, detectedLanguage, contentMode, displayContent, t])

  // Show loading
  if (isHistoryLoading) {
    return (
      <DefaultLayout>
        <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
          <HeroSection t={t} />
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        <HeroSection t={t} />

        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto flex gap-6">
            {/* History Sidebar - Desktop */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <ExtractionHistorySidebar
                  items={history}
                  currentId={currentHistoryId}
                  isLoading={isHistoryLoading}
                  onSelect={handleHistorySelect}
                  onDelete={handleHistoryDelete}
                  onClearAll={handleClearAllHistory}
                  onNewExtraction={handleNewExtraction}
                  translations={{
                    title: uiLanguage === 'th' ? 'ประวัติ' : 'History',
                    newExtraction:
                      uiLanguage === 'th' ? 'เริ่มใหม่' : 'New Extraction',
                    noHistory:
                      uiLanguage === 'th'
                        ? 'ยังไม่มีประวัติ'
                        : 'No history yet',
                    noHistoryHint:
                      uiLanguage === 'th'
                        ? 'ดึงเนื้อหาเพื่อบันทึก'
                        : 'Extract content to save here',
                    clearAll: uiLanguage === 'th' ? 'ล้างทั้งหมด' : 'Clear All',
                    cloudStored:
                      uiLanguage === 'th'
                        ? 'ซิงค์กับคลาวด์'
                        : 'Synced to cloud',
                  }}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-primary/20">
                  <CardContent className="p-6 space-y-6">
                    {/* Mobile: History & New buttons */}
                    <div className="flex items-center justify-end gap-2 lg:hidden">
                      <Button
                        onClick={handleNewExtraction}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {uiLanguage === 'th' ? 'ใหม่' : 'New'}
                      </Button>

                      {history.length > 0 && (
                        <DropdownMenu
                          open={showMobileHistory}
                          onOpenChange={setShowMobileHistory}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <History className="w-4 h-4" />
                              <span className="px-1 py-0.5 text-xs rounded-full bg-muted">
                                {history.length}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-80 max-h-96 overflow-auto"
                          >
                            {history.map((item) => (
                              <DropdownMenuItem
                                key={item.id}
                                onClick={() => handleHistorySelect(item)}
                                className="flex items-start gap-2 p-2 cursor-pointer"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {item.title || item.extracted_text.slice(0, 50)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleHistoryDelete(item.id)
                                  }}
                                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {/* Content Input Section - show when no content */}
                    {!displayContent && (
                      <ContentInputSection
                        onExtract={handleExtract}
                        isLoading={isExtracting}
                        targetLanguage={selectedTargetLanguage}
                        onTargetLanguageChange={setSelectedTargetLanguage}
                        availableLanguages={availableLanguages}
                        selectedMode={selectedMode}
                        onModeChange={handleModeChange}
                        easyExplainEnabled={easyExplainEnabled}
                        onEasyExplainToggle={() =>
                          setEasyExplainEnabled(!easyExplainEnabled)
                        }
                        canUseEasyExplain={canUseEasyExplain}
                        aiEnabled={aiEnabled}
                        translations={{
                          textTab:
                            uiLanguage === 'th'
                              ? 'ข้อความ / URL'
                              : 'Text / URL',
                          fileTab: uiLanguage === 'th' ? 'ไฟล์' : 'File',
                          textTabDesc:
                            uiLanguage === 'th'
                              ? 'วางข้อความหรือ URL'
                              : 'Paste text or URL',
                          fileTabDesc:
                            uiLanguage === 'th' ? 'อัปโหลดไฟล์' : 'Upload file',
                          pasteFromClipboard:
                            uiLanguage === 'th'
                              ? 'วางจากคลิปบอร์ด'
                              : 'Paste from Clipboard',
                          textPlaceholder:
                            uiLanguage === 'th'
                              ? 'วางข้อความหรือ URL ที่นี่...'
                              : 'Paste text or URL here...',
                          urlPlaceholder:
                            uiLanguage === 'th'
                              ? 'วาง URL (YouTube, เว็บไซต์)'
                              : 'Paste URL (YouTube, Website)',
                          dropzone:
                            uiLanguage === 'th'
                              ? 'ลากไฟล์มาวางหรือคลิกเพื่ออัปโหลด'
                              : 'Drop files here or click to upload',
                          browseFiles:
                            uiLanguage === 'th' ? 'เลือกไฟล์' : 'Browse Files',
                          maxSize:
                            uiLanguage === 'th' ? 'ไม่เกิน 50MB' : 'Max 50MB',
                          supportedTypes: 'PDF, Excel, Word, Images',
                          youtube: 'YouTube',
                          web: uiLanguage === 'th' ? 'เว็บ' : 'Web',
                          pdf: 'PDF',
                          excel: 'Excel',
                          doc: uiLanguage === 'th' ? 'เอกสาร' : 'Document',
                          image: uiLanguage === 'th' ? 'รูปภาพ' : 'Image',
                          selectMode:
                            uiLanguage === 'th' ? 'โหมดผลลัพธ์' : 'Output Mode',
                          original:
                            uiLanguage === 'th' ? 'ต้นฉบับ' : 'Original',
                          summarize: uiLanguage === 'th' ? 'สรุป' : 'Summarize',
                          lesson: uiLanguage === 'th' ? 'บทเรียน' : 'Lesson',
                          originalDesc:
                            uiLanguage === 'th'
                              ? 'ดึงข้อความตามต้นฉบับ'
                              : 'Extract text as-is',
                          summarizeDesc:
                            uiLanguage === 'th'
                              ? 'AI สรุปเนื้อหา'
                              : 'AI summarizes content',
                          lessonDesc:
                            uiLanguage === 'th'
                              ? 'AI จัดเป็นบทเรียน'
                              : 'AI crafts into lesson',
                          targetLanguage:
                            uiLanguage === 'th'
                              ? 'ภาษาเป้าหมาย'
                              : 'Target Language',
                          easyExplain:
                            uiLanguage === 'th' ? 'อธิบายง่าย' : 'Easy Explain',
                          easyExplainUpgrade:
                            uiLanguage === 'th'
                              ? 'อัปเกรดเป็น Plus'
                              : 'Upgrade to Plus',
                          extract:
                            uiLanguage === 'th' ? 'ดึงเนื้อหา' : 'Extract',
                          extracting:
                            uiLanguage === 'th'
                              ? 'กำลังดึง...'
                              : 'Extracting...',
                          or: uiLanguage === 'th' ? 'หรือ' : 'or',
                        }}
                      />
                    )}

                    {/* Content Display - show when we have content */}
                    {displayContent && !isExtracting && (
                      <>
                        <ExtractedContentDisplay
                          content={currentContent}
                          displayContent={displayContent}
                          contentMode={contentMode}
                          keyPoints={keyPoints}
                          isProcessing={isProcessing}
                          processingAction={processingAction}
                          selectedMode={selectedMode}
                          onModeSelect={handleModeSelect}
                          onGenerate={handleGenerate}
                          onBackToOriginal={handleBackToOriginal}
                          targetLanguage={selectedTargetLanguage}
                          onTargetLanguageChange={setSelectedTargetLanguage}
                          availableLanguages={availableLanguages}
                          hasSummarized={!!summarizedContent}
                          hasCrafted={!!craftedContent}
                          aiEnabled={aiEnabled}
                          canUseEasyExplain={canUseEasyExplain}
                          easyExplainEnabled={easyExplainEnabled}
                          onEasyExplainToggle={() =>
                            setEasyExplainEnabled(!easyExplainEnabled)
                          }
                          translations={{
                            original:
                              uiLanguage === 'th' ? 'ต้นฉบับ' : 'Original',
                            summarize: t('ttl.summarize'),
                            lesson: uiLanguage === 'th' ? 'บทเรียน' : 'Lesson',
                            generate:
                              uiLanguage === 'th' ? 'สร้าง' : 'Generate',
                            regenerate:
                              uiLanguage === 'th' ? 'สร้างใหม่' : 'Regenerate',
                            backToOriginal: t('ttl.backToOriginal'),
                            selectMode: t('ttl.selectModeLabel'),
                            originalDesc:
                              uiLanguage === 'th'
                                ? 'ดูข้อความต้นฉบับ'
                                : 'View original extracted text',
                            summarizeDesc:
                              uiLanguage === 'th'
                                ? 'สรุปเนื้อหาให้กระชับ'
                                : 'Summarize content',
                            lessonDesc:
                              uiLanguage === 'th'
                                ? 'จัดเนื้อหาเป็นบทเรียน'
                                : 'Craft into structured lesson',
                            keyPoints: t('ttl.keyPoints'),
                            viewingSummary: t('ttl.viewingSummary'),
                            viewingLesson:
                              uiLanguage === 'th'
                                ? 'กำลังดูบทเรียน'
                                : 'Viewing Lesson',
                            viewingTranslated: t('ttl.viewingTranslated'),
                            characters: t('tools.tts.characters'),
                            words: uiLanguage === 'th' ? 'คำ' : 'words',
                            copy: t('tools.tts.copy'),
                            copied:
                              uiLanguage === 'th' ? 'คัดลอกแล้ว!' : 'Copied!',
                            export: uiLanguage === 'th' ? 'ส่งออก' : 'Export',
                            showOriginal:
                              uiLanguage === 'th'
                                ? 'แสดงต้นฉบับ'
                                : 'Show Original',
                            hideOriginal:
                              uiLanguage === 'th'
                                ? 'ซ่อนต้นฉบับ'
                                : 'Hide Original',
                            easyExplain:
                              uiLanguage === 'th'
                                ? 'อธิบายง่าย'
                                : 'Easy Explain',
                            easyExplainUpgrade:
                              uiLanguage === 'th'
                                ? 'อัปเกรดเป็น Plus เพื่อใช้งาน'
                                : 'Upgrade to Plus to use',
                            targetLanguage:
                              uiLanguage === 'th'
                                ? 'ภาษาเป้าหมาย'
                                : 'Target Language',
                          }}
                        />

                        {/* TTS Section */}
                        <div className="border-t border-border pt-6">
                          <TextToLoud
                            ref={textToLoudRef}
                            text={displayContent}
                            detectedLanguage={detectedLanguage}
                            uiLanguage={uiLanguage as 'en' | 'th'}
                            isReaderMode={isReaderMode}
                            onReaderModeChange={setIsReaderMode}
                            selectedLanguage={selectedTargetLanguage}
                            onLanguageChange={setSelectedTargetLanguage}
                            availableLanguages={availableLanguages}
                            rate={rate}
                            onRateChange={setRate}
                            selectedGender={selectedGender}
                            onGenderChange={setSelectedGender}
                            onPlay={handlePlay}
                            onHighlightChange={setHighlightIndex}
                            initialHighlightIndex={highlightIndex}
                            showSettings={!isReaderMode}
                            showReaderMode={true}
                            showFloatControls={true}
                            showPlayButton={false}
                            translations={{
                              settings:
                                uiLanguage === 'th'
                                  ? 'ตั้งค่าเสียง'
                                  : 'Voice Settings',
                              language: t('tools.tts.languageLabel'),
                              speed: t('tools.tts.speedLabel'),
                              playing: t('tools.tts.playing'),
                              paused: t('tools.tts.paused'),
                              copy: t('tools.tts.copy'),
                              characters: t('tools.tts.characters'),
                            }}
                          />

                          {/* Play Button */}
                          {!isReaderMode && (
                            <div className="mt-4">
                              <Button
                                onClick={() => textToLoudRef.current?.play()}
                                disabled={
                                  !displayContent.trim() ||
                                  isProcessing ||
                                  (selectedMode === 'summarize' &&
                                    !summarizedContent) ||
                                  (selectedMode === 'lesson' && !craftedContent)
                                }
                                className="gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                              >
                                <Play className="w-4 h-4" />
                                {uiLanguage === 'th' ? 'ฟังเลย' : 'Listen Now'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Suggested Activities */}
                {(suggestedActivities.length > 0 || loadingSuggestions) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8"
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t('ttl.suggestedTitle')}
                    </h3>

                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suggestedActivities.map((activity) => {
                          const style = getActivityTypeStyle(activity.type)
                          return (
                            <motion.div
                              key={activity.id}
                              whileHover={{ scale: 1.02 }}
                              className="group cursor-pointer"
                              onClick={() =>
                                navigate({
                                  to: `/activity/play/${activity.id}`,
                                })
                              }
                            >
                              <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors">
                                <div
                                  className={cn(
                                    'h-24 bg-linear-to-br flex items-center justify-center',
                                    style.bg,
                                  )}
                                >
                                  {activity.thumbnail ? (
                                    <img
                                      src={activity.thumbnail}
                                      alt={activity.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-4xl">
                                      {style.icon}
                                    </span>
                                  )}
                                </div>
                                <CardContent className="p-3">
                                  <h4 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                    {activity.title}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="capitalize px-2 py-0.5 rounded-full bg-muted">
                                      {activity.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {activity.play_count}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </DefaultLayout>
  )
}
