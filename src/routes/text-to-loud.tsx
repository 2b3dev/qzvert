import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  GraduationCap,
  History,
  Languages,
  Loader2,
  Monitor,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  Volume2,
  Wand2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import type { LanguageOption, TextToLoudRef } from '../components/TextToLoud'
import { TextToLoud } from '../components/TextToLoud'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Textarea } from '../components/ui/input'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/utils'
import { getSuggestedActivities } from '../server/activities'
import { isAIGenerationEnabled } from '../server/admin-settings'
import { craftContent, summarizeContent, translateContent } from '../server/ttl'
import { useAuthStore } from '../stores/auth-store'
import { useProfileStore } from '../stores/profile-store'

export const Route = createFileRoute('/text-to-loud')({
  component: TextToLoudPage,
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

// LocalStorage keys
const STORAGE_KEY = 'text-to-loud-state'
const HISTORY_KEY = 'text-to-loud-history'
const MAX_HISTORY_ITEMS = 10

// Saved state interface
interface SavedState {
  originalContent: string
  displayContent: string
  contentMode: 'original' | 'summarized' | 'crafted' | 'translated'
  keyPoints: string[]
  highlightIndex: number
  charIndex: number
  selectedTargetLanguage: string
  originalDetectedLanguage: string
  rate: number
  selectedGender: 'male' | 'female'
}

// History item interface - stores all mode contents for instant switching
interface HistoryItem {
  id: string
  title: string // First 50 chars of content
  originalContent: string
  // Store processed content for each mode
  summarizedContent: string
  summarizedKeyPoints: string[]
  craftedContent: string
  craftedKeyPoints: string[]
  // Current display state
  displayContent: string
  contentMode: 'original' | 'summarized' | 'crafted' | 'translated'
  keyPoints: string[]
  language: string
  createdAt: number
  lastPlayedAt: number
}

// Load saved state from localStorage
const loadSavedState = (): Partial<SavedState> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

// Save state to localStorage (debounced in component)
const saveStateToStorage = (state: SavedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// Load history from localStorage
const loadHistory = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // Ignore parse errors
  }
  return []
}

// Save history to localStorage
const saveHistory = (history: HistoryItem[]) => {
  try {
    // Keep only the latest MAX_HISTORY_ITEMS
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore storage errors
  }
}

// Generate a simple ID
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// Get title from content (first 50 chars, clean up)
const getTitleFromContent = (content: string): string => {
  const cleaned = content.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= 50) return cleaned
  return cleaned.slice(0, 47) + '...'
}

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

// Hero Section - Static component for SEO (outside main component to prevent re-renders)
function HeroSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative py-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
          <GraduationCap className="w-4 h-4" />
          {t('ttl.badge')}
        </div>

        <h1 className="text-2xl md:text-4xl font-black mb-4 leading-tight">
          <span className="text-foreground">{t('ttl.title1')}</span>
          <br className="md:hidden" />{' '}
          <span className="bg-linear-to-r from-primary via-emerald-500 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
            {t('ttl.title2')}
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('ttl.subtitle')}
        </p>
      </div>
    </section>
  )
}

function TextToLoudPage() {
  const { t, language: uiLanguage } = useTranslation()
  const navigate = useNavigate()

  // User profile for Easy Explain feature
  const { user } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

  // Load saved state once on mount
  const savedState = useMemo(() => loadSavedState(), [])

  // Content states - initialize from localStorage
  const [originalContent, setOriginalContent] = useState(
    () => savedState?.originalContent || '',
  )
  const [displayContent, setDisplayContent] = useState(
    () => savedState?.displayContent || '',
  )
  const [contentMode, setContentMode] = useState<
    'original' | 'summarized' | 'crafted' | 'translated'
  >(() => savedState?.contentMode || 'original')

  // AI processing states
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<string>('')
  const [keyPoints, setKeyPoints] = useState<string[]>(
    () => savedState?.keyPoints || [],
  )

  // AI confirmation and result states
  const [selectedMode, setSelectedMode] = useState<
    'listen' | 'summarize' | 'craft'
  >('listen')

  // Store processed content for each mode
  const [summarizedContent, setSummarizedContent] = useState<string>('')
  const [summarizedKeyPoints, setSummarizedKeyPoints] = useState<string[]>([])
  const [craftedContent, setCraftedContent] = useState<string>('')
  const [craftedKeyPoints, setCraftedKeyPoints] = useState<string[]>([])

  // Suggested activities
  const [suggestedActivities, setSuggestedActivities] = useState<
    SuggestedActivity[]
  >([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const currentHistoryIdRef = useRef<string | null>(null)

  // Display mode - show markdown reader view
  const [isReaderMode, setIsReaderMode] = useState(false)

  // AI generation setting
  const [aiEnabled, setAiEnabled] = useState(true)

  // Easy Explain Mode (Feynman Technique)
  const [easyExplainEnabled, setEasyExplainEnabled] = useState(false)
  const canUseEasyExplain =
    profile?.role === 'plus' ||
    profile?.role === 'pro' ||
    profile?.role === 'ultra' ||
    profile?.role === 'admin'

  // TTS states - controlled by TextToLoud component
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>(
    () => savedState?.selectedTargetLanguage || 'en',
  )
  const [originalDetectedLanguage, setOriginalDetectedLanguage] =
    useState<string>(() => savedState?.originalDetectedLanguage || 'en')
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(
    () => savedState?.selectedGender || 'female',
  )
  const [rate, setRate] = useState(() => savedState?.rate || 1)
  const [availableLanguages, setAvailableLanguages] =
    useState<LanguageOption[]>(SUPPORTED_LANGUAGES)
  const [charCount, setCharCount] = useState(
    () => savedState?.originalContent?.length || 0,
  )
  const [highlightIndex, setHighlightIndex] = useState<number>(
    () => savedState?.highlightIndex || 0,
  )

  // Refs
  const textToLoudRef = useRef<TextToLoudRef>(null)
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const suggestTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const charIndexRef = useRef<number>(savedState?.charIndex || 0)
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set())

  // Safe timeout helper - tracks timeouts for cleanup
  const safeSetTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timeoutRefs.current.delete(id)
      fn()
    }, ms)
    timeoutRefs.current.add(id)
    return id
  }, [])

  // Get playing state from ref
  const isPlaying = textToLoudRef.current?.isPlaying ?? false

  // Debounced save to localStorage
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveStateToStorage({
        originalContent,
        displayContent,
        contentMode,
        keyPoints,
        highlightIndex,
        charIndex: charIndexRef.current,
        selectedTargetLanguage,
        originalDetectedLanguage,
        rate,
        selectedGender,
      })
    }, 500) // Debounce 500ms
  }, [
    originalContent,
    displayContent,
    contentMode,
    keyPoints,
    highlightIndex,
    selectedTargetLanguage,
    originalDetectedLanguage,
    rate,
    selectedGender,
  ])

  // Auto-save when relevant state changes (debounced)
  useEffect(() => {
    debouncedSave()
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [debouncedSave])

  // Load history from localStorage on mount
  useEffect(() => {
    // Simulate brief delay to show loading state (also handles async storage)
    const timer = setTimeout(() => {
      const loaded = loadHistory()
      setHistory(loaded)
      setIsHistoryLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Fetch user profile on mount
  useEffect(() => {
    if (user?.id && !profile) {
      fetchProfile(user.id)
    }
  }, [user?.id, profile, fetchProfile])

  // Check AI generation setting on mount
  useEffect(() => {
    isAIGenerationEnabled().then(setAiEnabled)
  }, [])

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
      // Cleanup speech synthesis event
      speechSynthesis.onvoiceschanged = null
      // Cleanup all timeouts
      if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current)
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      // Clear all tracked timeouts
      timeoutRefs.current.forEach((id) => clearTimeout(id))
      timeoutRefs.current.clear()
    }
  }, [])

  // Save immediately on page unload (safety net)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Cancel debounce and save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveStateToStorage({
        originalContent,
        displayContent,
        contentMode,
        keyPoints,
        highlightIndex,
        charIndex: charIndexRef.current,
        selectedTargetLanguage,
        originalDetectedLanguage,
        rate,
        selectedGender,
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [
    originalContent,
    displayContent,
    contentMode,
    keyPoints,
    highlightIndex,
    selectedTargetLanguage,
    originalDetectedLanguage,
    rate,
    selectedGender,
  ])

  // Save current content to history (with all mode contents)
  const saveToHistory = useCallback(() => {
    if (!originalContent.trim() || originalContent.length < 10) return

    const now = Date.now()
    const title = getTitleFromContent(originalContent)

    setHistory((prev) => {
      // Check if this content already exists (by comparing title or first 100 chars)
      const existingIndex = prev.findIndex(
        (item) =>
          item.originalContent.slice(0, 100) === originalContent.slice(0, 100),
      )

      let updated: HistoryItem[]
      if (existingIndex !== -1) {
        // Update existing item with all mode contents
        updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          // Update all mode contents
          summarizedContent: summarizedContent || updated[existingIndex].summarizedContent,
          summarizedKeyPoints: summarizedKeyPoints.length > 0 ? summarizedKeyPoints : updated[existingIndex].summarizedKeyPoints,
          craftedContent: craftedContent || updated[existingIndex].craftedContent,
          craftedKeyPoints: craftedKeyPoints.length > 0 ? craftedKeyPoints : updated[existingIndex].craftedKeyPoints,
          // Current display state
          displayContent,
          contentMode,
          keyPoints,
          lastPlayedAt: now,
        }
        // Move to front
        const [item] = updated.splice(existingIndex, 1)
        updated.unshift(item)
        currentHistoryIdRef.current = item.id
      } else {
        // Create new history item with all mode contents
        const newItem: HistoryItem = {
          id: generateId(),
          title,
          originalContent,
          // Store all mode contents
          summarizedContent,
          summarizedKeyPoints,
          craftedContent,
          craftedKeyPoints,
          // Current display state
          displayContent,
          contentMode,
          keyPoints,
          language: originalDetectedLanguage,
          createdAt: now,
          lastPlayedAt: now,
        }
        updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS)
        currentHistoryIdRef.current = newItem.id
      }

      saveHistory(updated)
      return updated
    })
  }, [
    originalContent,
    summarizedContent,
    summarizedKeyPoints,
    craftedContent,
    craftedKeyPoints,
    displayContent,
    contentMode,
    keyPoints,
    originalDetectedLanguage,
  ])

  // Load content from history item (restore all mode contents)
  const handleLoadHistory = useCallback(
    (item: HistoryItem) => {
      // Stop any current playback first
      textToLoudRef.current?.stop()

      // Restore original content
      setOriginalContent(item.originalContent)

      // Restore all mode contents (so user can switch modes instantly)
      setSummarizedContent(item.summarizedContent || '')
      setSummarizedKeyPoints(item.summarizedKeyPoints || [])
      setCraftedContent(item.craftedContent || '')
      setCraftedKeyPoints(item.craftedKeyPoints || [])

      // Restore current display state
      setDisplayContent(item.displayContent)
      setContentMode(item.contentMode)
      setKeyPoints(item.keyPoints)

      // Set mode selector to match contentMode
      if (item.contentMode === 'summarized') {
        setSelectedMode('summarize')
      } else if (item.contentMode === 'crafted') {
        setSelectedMode('craft')
      } else {
        setSelectedMode('listen')
      }

      setOriginalDetectedLanguage(item.language)
      setSelectedTargetLanguage(item.language)
      setCharCount(item.originalContent.length)
      setHighlightIndex(0)
      charIndexRef.current = 0
      currentHistoryIdRef.current = item.id
      setShowHistory(false)
      setIsReaderMode(false)

      // Update lastPlayedAt
      setHistory((prev) => {
        const updated = prev.map((h) =>
          h.id === item.id ? { ...h, lastPlayedAt: Date.now() } : h,
        )
        saveHistory(updated)
        return updated
      })

      toast.success(
        uiLanguage === 'th' ? 'โหลดประวัติเรียบร้อย' : 'History loaded',
      )
    },
    [uiLanguage],
  )

  // Delete history item
  const handleDeleteHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering load
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id)
      saveHistory(updated)
      return updated
    })
    if (currentHistoryIdRef.current === id) {
      currentHistoryIdRef.current = null
    }
  }, [])

  // Clear all history
  const handleClearAllHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
    currentHistoryIdRef.current = null
    toast.success(
      uiLanguage === 'th' ? 'ล้างประวัติทั้งหมดแล้ว' : 'All history cleared',
    )
  }, [uiLanguage])

  // Detect language from text
  const detectLanguage = useCallback(
    (inputText: string): string => {
      if (!inputText.trim()) return uiLanguage === 'th' ? 'th' : 'en'

      const thaiPattern = /[\u0E00-\u0E7F]/
      const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/
      const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/
      const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/
      const cyrillicPattern = /[\u0400-\u04FF]/
      const vietnamesePattern =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

      const sample = inputText.slice(0, 200)

      if (thaiPattern.test(sample)) return 'th'
      if (japanesePattern.test(sample)) return 'ja'
      if (koreanPattern.test(sample)) return 'ko'
      if (chinesePattern.test(sample)) return 'zh'
      if (cyrillicPattern.test(sample)) return 'ru'
      if (vietnamesePattern.test(sample)) return 'vi'

      return 'en'
    },
    [uiLanguage],
  )

  // Fetch suggested activities
  const fetchSuggestions = useCallback(async (content: string) => {
    if (!content.trim() || content.length < 20) {
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

  // Fetch suggestions on mount if there's saved content
  useEffect(() => {
    if (
      savedState?.originalContent &&
      savedState.originalContent.length >= 20
    ) {
      fetchSuggestions(savedState.originalContent)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle text change with language detection and suggestions
  const handleTextChange = (newText: string) => {
    setOriginalContent(newText)
    if (contentMode === 'original') {
      setDisplayContent(newText)
    }
    setCharCount(newText.length)

    // Debounce language detection
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current)
    }
    detectTimeoutRef.current = setTimeout(() => {
      const detected = detectLanguage(newText)
      // Always update detected language and dropdown
      setOriginalDetectedLanguage(detected)
      setSelectedTargetLanguage(detected)
    }, 1000)

    // Debounce suggestions
    if (suggestTimeoutRef.current) {
      clearTimeout(suggestTimeoutRef.current)
    }
    suggestTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newText)
    }, 500)
  }

  // Handle language selection (dropdown)
  const handleLanguageChange = (langCode: string) => {
    setSelectedTargetLanguage(langCode)
  }

  // Handle gender selection
  const handleGenderChange = (gender: 'male' | 'female') => {
    setSelectedGender(gender)
  }

  // Handle rate change
  const handleRateChange = (newRate: number) => {
    setRate(newRate)
  }

  // Mode selection handlers
  const handleModeSelect = useCallback(
    (mode: 'listen' | 'summarize' | 'craft') => {
      setSelectedMode(mode)

      // Switch display content based on mode and what's available
      if (mode === 'listen') {
        // Always show original content in listen mode
        setDisplayContent(originalContent)
        setContentMode('original')
        setKeyPoints([])
      } else if (mode === 'summarize' && summarizedContent) {
        // If we have summarized content, show it
        setDisplayContent(summarizedContent)
        setContentMode('summarized')
        setKeyPoints(summarizedKeyPoints)
      } else if (mode === 'craft' && craftedContent) {
        // If we have crafted content, show it
        setDisplayContent(craftedContent)
        setContentMode('crafted')
        setKeyPoints(craftedKeyPoints)
      }
      // If no processed content for that mode, stay with current display
      // and show the generate prompt
    },
    [originalContent, summarizedContent, summarizedKeyPoints, craftedContent, craftedKeyPoints],
  )

  const handleConfirmGenerate = useCallback(async () => {
    if (selectedMode === 'listen' || !originalContent.trim()) return

    setIsProcessing(true)
    setProcessingAction(selectedMode)

    // Use target language if different from detected, otherwise use detected language
    const outputLanguage = selectedTargetLanguage || originalDetectedLanguage

    try {
      if (selectedMode === 'summarize') {
        const result = await summarizeContent({
          data: {
            content: originalContent,
            language: outputLanguage,
            easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
          },
        })
        // Store and display immediately
        setSummarizedContent(result.summary)
        setSummarizedKeyPoints([])
        setDisplayContent(result.summary)
        setContentMode('summarized')
        setKeyPoints([])
        toast.success(t('ttl.summarized'))
      } else if (selectedMode === 'craft') {
        const result = await craftContent({
          data: {
            content: originalContent,
            language: outputLanguage,
            easyExplainEnabled: canUseEasyExplain && easyExplainEnabled,
          },
        })
        // Store and display immediately
        setCraftedContent(result.crafted)
        setCraftedKeyPoints(result.keyPoints)
        setDisplayContent(result.crafted)
        setContentMode('crafted')
        setKeyPoints(result.keyPoints)
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
    selectedMode,
    originalContent,
    selectedTargetLanguage,
    originalDetectedLanguage,
    t,
    canUseEasyExplain,
    easyExplainEnabled,
  ])

  const handleBackToOriginal = () => {
    setDisplayContent(originalContent)
    setContentMode('original')
    setKeyPoints([])
  }

  // TTS callbacks
  const handlePlay = useCallback(async () => {
    // Check if selected language differs from detected language
    // and content hasn't been translated yet - auto translate
    if (
      selectedTargetLanguage !== originalDetectedLanguage &&
      contentMode !== 'translated'
    ) {
      // Auto translate before playing
      setIsProcessing(true)
      setProcessingAction('translate')

      try {
        const result = await translateContent({
          data: {
            content:
              contentMode === 'original' ? originalContent : displayContent,
            targetLanguage: selectedTargetLanguage,
          },
        })
        setDisplayContent(result.translated)
        setContentMode('translated')
        setKeyPoints([])
        toast.success(t('ttl.translated'))

        // Enter reader mode and play after translation
        setIsReaderMode(true)
        safeSetTimeout(() => {
          charIndexRef.current = 0
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

    // Enter reader mode
    setIsReaderMode(true)

    // Save to history when starting new playback
    saveToHistory()
  }, [
    selectedTargetLanguage,
    originalDetectedLanguage,
    contentMode,
    originalContent,
    displayContent,
    t,
    safeSetTimeout,
    saveToHistory,
  ])

  const handlePause = useCallback(() => {
    // Save position immediately when pausing
    debouncedSave()
  }, [debouncedSave])

  const handleStop = useCallback(() => {
    charIndexRef.current = 0
    setHighlightIndex(0)
  }, [])

  const handleHighlightChange = useCallback((index: number) => {
    charIndexRef.current = index
    setHighlightIndex(index)
  }, [])

  const handleClear = () => {
    setOriginalContent('')
    setDisplayContent('')
    setContentMode('original')
    setKeyPoints([])
    setCharCount(0)
    setSuggestedActivities([])
    setHighlightIndex(0)
    charIndexRef.current = 0
    textToLoudRef.current?.stop()
    // Clear stored processed content
    setSummarizedContent('')
    setSummarizedKeyPoints([])
    setCraftedContent('')
    setCraftedKeyPoints([])
    setSelectedMode('listen')
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  // New Loud - Save current to history then clear for new content
  const handleNewLoud = useCallback(() => {
    // Save current content to history if it has content
    if (originalContent.trim() && originalContent.length >= 10) {
      saveToHistory()
    }

    // Clear current content
    setOriginalContent('')
    setDisplayContent('')
    setContentMode('original')
    setKeyPoints([])
    setCharCount(0)
    setSuggestedActivities([])
    setHighlightIndex(0)
    charIndexRef.current = 0
    currentHistoryIdRef.current = null
    setIsReaderMode(false)
    textToLoudRef.current?.stop()
    // Clear stored processed content
    setSummarizedContent('')
    setSummarizedKeyPoints([])
    setCraftedContent('')
    setCraftedKeyPoints([])
    setSelectedMode('listen')

    // Clear localStorage for current state
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }

    toast.success(
      uiLanguage === 'th' ? 'เริ่มใหม่เรียบร้อย' : 'Ready for new content',
    )
  }, [originalContent, saveToHistory, uiLanguage])

  // Language for display badge (detected language)
  const detectedLanguageDisplay =
    SUPPORTED_LANGUAGES.find((l) => l.code === originalDetectedLanguage) ||
    SUPPORTED_LANGUAGES[1]

  // Render mode selector content (to be passed to TextToLoud) - memoized to prevent unnecessary re-renders
  const renderModeSelector = useMemo(
    () => (
      <>
        {/* Select Loud Mode */}
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            {t('ttl.selectModeLabel')}
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-background border border-input">
            {/* Just Listen Button */}
            <button
              onClick={() => handleModeSelect('listen')}
              disabled={isProcessing || isPlaying}
              className={cn(
                'relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                selectedMode === 'listen'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                (isProcessing || isPlaying) && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Volume2 className="w-4 h-4" />
              {t('ttl.listen')}
            </button>
            {/* Summarize Button */}
            <div className="relative group/summarize">
              <button
                onClick={() => aiEnabled && handleModeSelect('summarize')}
                disabled={isProcessing || isPlaying || !aiEnabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  selectedMode === 'summarize'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                  (isProcessing || isPlaying || !aiEnabled) &&
                    'opacity-50 cursor-not-allowed',
                )}
              >
                <FileText className="w-4 h-4" />
                {t('ttl.summarize')}
                {summarizedContent && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
              {!aiEnabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-sm text-foreground opacity-0 group-hover/summarize:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {t('common.aiDisabled')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                </div>
              )}
            </div>
            {/* Craft Button */}
            <div className="relative group/craft">
              <button
                onClick={() => aiEnabled && handleModeSelect('craft')}
                disabled={isProcessing || isPlaying || !aiEnabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  selectedMode === 'craft'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                  (isProcessing || isPlaying || !aiEnabled) &&
                    'opacity-50 cursor-not-allowed',
                )}
              >
                <Wand2 className="w-4 h-4" />
                {t('ttl.craft')}
                {craftedContent && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
              {!aiEnabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-sm text-foreground opacity-0 group-hover/craft:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {t('common.aiDisabled')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mode Description */}
        {selectedMode === 'listen' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-emerald-500/20">
                <Volume2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm text-muted-foreground [&_strong]:text-emerald-600 dark:[&_strong]:text-emerald-400 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: t('ttl.listenFreeDesc') }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Mode Description for Summarize/Craft with Easy Explain toggle */}
        {(selectedMode === 'summarize' || selectedMode === 'craft') && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/20">
                  {selectedMode === 'summarize' ? (
                    <FileText className="w-4 h-4 text-primary" />
                  ) : (
                    <Wand2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedMode === 'summarize'
                    ? uiLanguage === 'th'
                      ? 'สรุปเนื้อหาให้กระชับ'
                      : 'Summarize content'
                    : uiLanguage === 'th'
                      ? 'จัดเนื้อหาเป็นบทเรียน'
                      : 'Craft into lesson'}
                </p>
              </div>
              {/* Easy Explain Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {uiLanguage === 'th' ? 'อธิบายง่าย' : 'Easy'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (canUseEasyExplain) {
                      setEasyExplainEnabled(!easyExplainEnabled)
                    }
                  }}
                  disabled={!canUseEasyExplain}
                  className={cn(
                    'relative w-9 h-5 rounded-full transition-colors duration-200',
                    easyExplainEnabled && canUseEasyExplain
                      ? 'bg-yellow-500'
                      : 'bg-muted',
                    !canUseEasyExplain && 'opacity-50 cursor-not-allowed',
                  )}
                  title={
                    canUseEasyExplain
                      ? uiLanguage === 'th'
                        ? 'อธิบายแบบง่ายๆ'
                        : 'Easy Explain mode'
                      : uiLanguage === 'th'
                        ? 'อัปเกรดเป็น Plus เพื่อใช้งาน'
                        : 'Upgrade to Plus to use'
                  }
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{
                      left:
                        easyExplainEnabled && canUseEasyExplain
                          ? '1.125rem'
                          : '0.125rem',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </>
    ),
    [
      t,
      selectedMode,
      isProcessing,
      isPlaying,
      aiEnabled,
      handleModeSelect,
      uiLanguage,
      summarizedContent,
      craftedContent,
      canUseEasyExplain,
      easyExplainEnabled,
      setEasyExplainEnabled,
    ],
  )

  // Show loading screen while history is loading
  if (isHistoryLoading) {
    return (
      <DefaultLayout>
        <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
          <HeroSection t={t} />

          {/* Loading indicator */}
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
        {/* Hero Section */}
        <HeroSection t={t} />

        {/* Main Content with Sidebar */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto flex gap-6">
            {/* History Sidebar - Desktop only */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24 space-y-3">
                {/* New Loud Button */}
                <Button
                  onClick={handleNewLoud}
                  className="w-full gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                >
                  <Plus className="w-4 h-4" />
                  {uiLanguage === 'th' ? 'เริ่มใหม่' : 'New Loud'}
                </Button>

                <Card className="border-primary/20">
                  <CardHeader className="py-3 px-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm flex items-center gap-1">
                          {uiLanguage === 'th'
                            ? 'ประวัติ Loud'
                            : 'Loud History'}
                          <span
                            title={
                              uiLanguage === 'th'
                                ? 'เก็บบนเครื่องนี้'
                                : 'Stored on this device'
                            }
                          >
                            <Monitor className="w-3 h-3 opacity-50 relative top-1" />
                          </span>
                        </span>
                      </div>
                      {history.length > 0 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-muted">
                          {history.length}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {history.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {uiLanguage === 'th'
                            ? 'ยังไม่มีประวัติ'
                            : 'No history yet'}
                        </p>
                        <p className="text-xs mt-1">
                          {uiLanguage === 'th'
                            ? 'กดเล่นเนื้อหาเพื่อบันทึก'
                            : 'Play content to save here'}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[calc(100vh-240px)] overflow-auto">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleLoadHistory(item)}
                            className={cn(
                              'p-3 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors',
                              currentHistoryIdRef.current === item.id &&
                                'bg-primary/10 border-l-2 border-l-primary',
                            )}
                          >
                            <p className="text-sm font-medium truncate mb-1">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(item.lastPlayedAt).toLocaleDateString(
                                  uiLanguage === 'th' ? 'th-TH' : 'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                  },
                                )}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                {SUPPORTED_LANGUAGES.find(
                                  (l) => l.code === item.language,
                                )?.flag || '🌐'}
                              </span>
                              {/* Show badges for available modes */}
                              {item.summarizedContent && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">
                                  {uiLanguage === 'th' ? 'สรุป' : 'Sum'}
                                </span>
                              )}
                              {item.craftedContent && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">
                                  {uiLanguage === 'th' ? 'จัด' : 'Craft'}
                                </span>
                              )}
                              <button
                                onClick={(e) => handleDeleteHistory(item.id, e)}
                                className="ml-auto p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Clear All Button */}
                        <button
                          onClick={handleClearAllHistory}
                          className="w-full p-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          {uiLanguage === 'th'
                            ? 'ล้างประวัติทั้งหมด'
                            : 'Clear All History'}
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-primary/20 overflow-hidden">
                  <CardHeader className="bg-linear-to-r from-primary/10 to-emerald-500/10 border-b border-border">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        {t('ttl.inputLabel')}
                      </div>
                      {contentMode !== 'original' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToOriginal}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          {t('ttl.backToOriginal')}
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Content Mode Indicator */}
                    {contentMode !== 'original' && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
                        {contentMode === 'summarized' && (
                          <FileText className="w-4 h-4" />
                        )}
                        {contentMode === 'crafted' && (
                          <Wand2 className="w-4 h-4" />
                        )}
                        {contentMode === 'translated' && (
                          <Languages className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {contentMode === 'summarized' &&
                            t('ttl.viewingSummary')}
                          {contentMode === 'crafted' && t('ttl.viewingCrafted')}
                          {contentMode === 'translated' &&
                            t('ttl.viewingTranslated')}
                        </span>
                      </div>
                    )}

                    {/* Text Input / Reader Mode / Highlighted Display */}
                    <div className="relative">
                      {isReaderMode ? null : ( // Reader mode - use TextToLoud's reader // TextToLoud will render the reader mode
                        // Normal textarea mode
                        <div>
                          <Textarea
                            value={
                              contentMode === 'original'
                                ? originalContent
                                : displayContent
                            }
                            onChange={(e) =>
                              contentMode === 'original' &&
                              handleTextChange(e.target.value)
                            }
                            placeholder={t('ttl.placeholder')}
                            className="min-h-[200px] resize-none text-base"
                            readOnly={contentMode !== 'original'}
                          />
                          {/* Info bar below textarea */}
                          <div className="flex items-center justify-end gap-2 mt-2 px-1">
                            {displayContent.length > 0 && (
                              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                                {detectedLanguageDisplay.flag}{' '}
                                {detectedLanguageDisplay.name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {contentMode === 'original'
                                ? charCount
                                : displayContent.length}{' '}
                              {t('tools.tts.characters')}
                            </span>
                            {(originalContent.length > 0 ||
                              displayContent.length > 0) && (
                              <button
                                onClick={handleClear}
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title={t('tools.tts.clear')}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Key Points (after craft) */}
                    {keyPoints.length > 0 && !isReaderMode && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {t('ttl.keyPoints')}
                        </h4>
                        <ul className="space-y-1">
                          {keyPoints.map((point, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-emerald-500">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* TextToLoud Component - Voice Settings, Reader Mode, Float Controls */}
                    <TextToLoud
                      ref={textToLoudRef}
                      text={displayContent}
                      detectedLanguage={originalDetectedLanguage}
                      uiLanguage={uiLanguage as 'en' | 'th'}
                      // Controlled state
                      isReaderMode={isReaderMode}
                      onReaderModeChange={setIsReaderMode}
                      selectedLanguage={selectedTargetLanguage}
                      onLanguageChange={handleLanguageChange}
                      availableLanguages={availableLanguages}
                      rate={rate}
                      onRateChange={handleRateChange}
                      selectedGender={selectedGender}
                      onGenderChange={handleGenderChange}
                      // Callbacks
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onStop={handleStop}
                      onHighlightChange={handleHighlightChange}
                      initialHighlightIndex={highlightIndex}
                      // Visibility
                      showSettings={!isReaderMode}
                      showReaderMode={true}
                      showFloatControls={true}
                      showPlayButton={false} // We'll render our own play button section
                      // Custom content
                      renderBeforeSettings={renderModeSelector}
                      // Translations
                      translations={{
                        settings: 'Voice Settings',
                        language: t('tools.tts.languageLabel'),
                        speed: t('tools.tts.speedLabel'),
                        playing: t('tools.tts.playing'),
                        paused: t('tools.tts.paused'),
                        copy: t('tools.tts.copy'),
                        characters: t('tools.tts.characters'),
                      }}
                    />

                    {/* Play Button & Generate - only show when not in reader mode */}
                    {!isReaderMode && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Generate/Regenerate button for summarize/craft modes */}
                          {selectedMode !== 'listen' && (
                            <Button
                              onClick={handleConfirmGenerate}
                              disabled={isProcessing || !originalContent.trim()}
                              variant={
                                (selectedMode === 'summarize' && summarizedContent) ||
                                (selectedMode === 'craft' && craftedContent)
                                  ? 'outline'
                                  : 'default'
                              }
                              className="gap-2"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (selectedMode === 'summarize' && summarizedContent) ||
                                (selectedMode === 'craft' && craftedContent) ? (
                                <RotateCcw className="w-4 h-4" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              {(selectedMode === 'summarize' && summarizedContent) ||
                              (selectedMode === 'craft' && craftedContent)
                                ? uiLanguage === 'th'
                                  ? 'สร้างใหม่'
                                  : 'Regenerate'
                                : uiLanguage === 'th'
                                  ? 'สร้าง'
                                  : 'Generate'}
                            </Button>
                          )}

                          {/* Loud Now button - disabled if mode needs content but doesn't have it */}
                          <Button
                            onClick={() => textToLoudRef.current?.play()}
                            disabled={
                              !displayContent.trim() ||
                              isProcessing ||
                              (selectedMode === 'summarize' && !summarizedContent) ||
                              (selectedMode === 'craft' && !craftedContent)
                            }
                            className="gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                          >
                            <Play className="w-4 h-4" />
                            {t('tools.tts.play')}
                          </Button>
                        </div>

                        {/* Mobile buttons - New & History */}
                        <div className="flex items-center gap-2 lg:hidden">
                          {/* New Loud Button - Mobile */}
                          <Button
                            onClick={handleNewLoud}
                            size="sm"
                            className="gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                          >
                            <Plus className="w-4 h-4" />
                            {uiLanguage === 'th' ? 'ใหม่' : 'New'}
                          </Button>

                          {/* History Button - Mobile only */}
                          {history.length > 0 && (
                            <DropdownMenu
                              open={showHistory}
                              onOpenChange={setShowHistory}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <History className="w-4 h-4" />
                                  {uiLanguage === 'th' ? 'ประวัติ' : 'History'}
                                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                                    {history.length}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-80 max-h-96 overflow-auto"
                              >
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {uiLanguage === 'th'
                                      ? 'ประวัติล่าสุด'
                                      : 'Recent History'}
                                  </span>
                                  <button
                                    onClick={handleClearAllHistory}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    {uiLanguage === 'th'
                                      ? 'ล้างทั้งหมด'
                                      : 'Clear All'}
                                  </button>
                                </div>
                                {history.map((item) => (
                                  <DropdownMenuItem
                                    key={item.id}
                                    onClick={() => handleLoadHistory(item)}
                                    className="flex items-start gap-2 p-2 cursor-pointer"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {item.title}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {new Date(
                                            item.lastPlayedAt,
                                          ).toLocaleDateString(
                                            uiLanguage === 'th'
                                              ? 'th-TH'
                                              : 'en-US',
                                            {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            },
                                          )}
                                        </span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                          {SUPPORTED_LANGUAGES.find(
                                            (l) => l.code === item.language,
                                          )?.flag || '🌐'}
                                        </span>
                                        {/* Show badges for available modes */}
                                        {item.summarizedContent && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">
                                            {uiLanguage === 'th' ? 'สรุป' : 'Sum'}
                                          </span>
                                        )}
                                        {item.craftedContent && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">
                                            {uiLanguage === 'th' ? 'จัด' : 'Craft'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) =>
                                        handleDeleteHistory(item.id, e)
                                      }
                                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
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
