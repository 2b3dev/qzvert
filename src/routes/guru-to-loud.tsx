import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import {
  Volume2,
  Play,
  Pause,
  Square,
  Languages,
  GraduationCap,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  FileText,
  Wand2,
  Loader2,
  ArrowLeft,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/utils'
import { summarizeContent, craftContent, translateContent } from '../server/guru'
import { getSuggestedActivities } from '../server/activities'

export const Route = createFileRoute('/guru-to-loud')({
  component: GuruPage,
})

interface VoiceOption {
  voice: SpeechSynthesisVoice
  label: string
}

interface LanguageOption {
  code: string
  name: string
  flag: string
}

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

// LocalStorage key
const STORAGE_KEY = 'guru-to-loud-state'

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

function GuruPage() {
  const { t, language: uiLanguage } = useTranslation()
  const navigate = useNavigate()

  // Load saved state once on mount
  const savedState = useMemo(() => loadSavedState(), [])

  // Content states - initialize from localStorage
  const [originalContent, setOriginalContent] = useState(() => savedState?.originalContent || '')
  const [displayContent, setDisplayContent] = useState(() => savedState?.displayContent || '')
  const [contentMode, setContentMode] = useState<'original' | 'summarized' | 'crafted' | 'translated'>(() => savedState?.contentMode || 'original')

  // AI processing states
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<string>('')
  const [keyPoints, setKeyPoints] = useState<string[]>(() => savedState?.keyPoints || [])

  // AI confirmation and result states
  const [selectedMode, setSelectedMode] = useState<'listen' | 'summarize' | 'craft'>('listen')
  const [aiResult, setAiResult] = useState<string>('')
  const [aiResultKeyPoints, setAiResultKeyPoints] = useState<string[]>([])

  // Translate modal
  const [showTranslateModal, setShowTranslateModal] = useState(false)

  // Suggested activities
  const [suggestedActivities, setSuggestedActivities] = useState<SuggestedActivity[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Display mode - show markdown reader view
  const [isReaderMode, setIsReaderMode] = useState(false)

  // TTS states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(() => savedState?.selectedGender || 'female')
  const [originalDetectedLanguage, setOriginalDetectedLanguage] = useState<string>(() => savedState?.originalDetectedLanguage || 'en')
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>(() => savedState?.selectedTargetLanguage || 'en')
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>([])
  const [maleVoice, setMaleVoice] = useState<string | null>(null)
  const [femaleVoice, setFemaleVoice] = useState<string | null>(null)
  const [rate, setRate] = useState(() => savedState?.rate || 1)
  const [copied, setCopied] = useState(false)
  const [charCount, setCharCount] = useState(() => savedState?.originalContent?.length || 0)
  const [highlightIndex, setHighlightIndex] = useState<number>(() => savedState?.highlightIndex || 0)

  // Refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const suggestTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const charIndexRef = useRef<number>(savedState?.charIndex || 0)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
  }, [originalContent, displayContent, contentMode, keyPoints, highlightIndex, selectedTargetLanguage, originalDetectedLanguage, rate, selectedGender])

  // Auto-save when relevant state changes (debounced)
  useEffect(() => {
    debouncedSave()
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [debouncedSave])

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
  }, [originalContent, displayContent, contentMode, keyPoints, highlightIndex, selectedTargetLanguage, originalDetectedLanguage, rate, selectedGender])

  // Detect language from text
  const detectLanguage = useCallback((inputText: string): string => {
    if (!inputText.trim()) return uiLanguage === 'th' ? 'th' : 'en'

    const thaiPattern = /[\u0E00-\u0E7F]/
    const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/
    const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/
    const cyrillicPattern = /[\u0400-\u04FF]/
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

    const sample = inputText.slice(0, 200)

    if (thaiPattern.test(sample)) return 'th'
    if (japanesePattern.test(sample)) return 'ja'
    if (koreanPattern.test(sample)) return 'ko'
    if (chinesePattern.test(sample)) return 'zh'
    if (cyrillicPattern.test(sample)) return 'ru'
    if (vietnamesePattern.test(sample)) return 'vi'

    return 'en'
  }, [uiLanguage])

  // Find best male/female voices for a specific language
  const findVoicesForLanguage = useCallback((availableVoices: SpeechSynthesisVoice[], langCode: string) => {
    const femalePatterns = ['female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'karen', 'victoria', 'kanya', 'onuma', 'google.*female', 'ava', 'joanna', 'salli', 'kimberly', 'ivy', 'emma', 'amy', 'nicole', 'rachel']
    const malePatterns = ['male', 'man', 'david', 'mark', 'james', 'daniel', 'george', 'prem', 'google.*male', 'matthew', 'joey', 'justin', 'kevin', 'brian', 'russell', 'geraint']

    const langVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()))
    const fallbackVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('en'))
    const voicesToSearch = langVoices.length > 0 ? langVoices : fallbackVoices

    let foundFemaleVoice = voicesToSearch.find(v =>
      femalePatterns.some(p => v.name.toLowerCase().includes(p))
    )
    if (!foundFemaleVoice && voicesToSearch.length > 0) {
      foundFemaleVoice = voicesToSearch[0]
    }

    let foundMaleVoice = voicesToSearch.find(v =>
      malePatterns.some(p => v.name.toLowerCase().includes(p))
    )
    if (!foundMaleVoice && voicesToSearch.length > 1) {
      foundMaleVoice = voicesToSearch[1]
    } else if (!foundMaleVoice) {
      foundMaleVoice = voicesToSearch[0]
    }

    return { femaleVoice: foundFemaleVoice, maleVoice: foundMaleVoice }
  }, [])

  // Update voices when language changes
  const updateVoicesForLanguage = useCallback((langCode: string, allVoices: SpeechSynthesisVoice[], forceUpdate = false) => {
    const { femaleVoice: fVoice, maleVoice: mVoice } = findVoicesForLanguage(allVoices, langCode)

    setFemaleVoice(fVoice?.name || null)
    setMaleVoice(mVoice?.name || null)

    // Only update selectedVoice if:
    // 1. forceUpdate is true (language changed by user)
    // 2. Current selectedVoice is not valid for this language
    const currentVoiceValid = allVoices.some(v =>
      v.name === selectedVoice && v.lang.toLowerCase().startsWith(langCode.toLowerCase())
    )

    if (forceUpdate || !selectedVoice || !currentVoiceValid) {
      if (selectedGender === 'female' && fVoice) {
        setSelectedVoice(fVoice.name)
      } else if (selectedGender === 'male' && mVoice) {
        setSelectedVoice(mVoice.name)
      } else if (fVoice) {
        setSelectedVoice(fVoice.name)
      } else if (mVoice) {
        setSelectedVoice(mVoice.name)
      }
    }
  }, [findVoicesForLanguage, selectedGender, selectedVoice])

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      const voiceOptions: VoiceOption[] = availableVoices.map((voice) => ({
        voice,
        label: `${voice.name} (${voice.lang})`,
      }))
      setVoices(voiceOptions)

      const availableLangCodes = new Set(availableVoices.map(v => v.lang.split('-')[0].toLowerCase()))
      const availableLangs = SUPPORTED_LANGUAGES.filter(lang => availableLangCodes.has(lang.code))
      setAvailableLanguages(availableLangs)

      updateVoicesForLanguage(selectedTargetLanguage, availableVoices)
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      speechSynthesis.cancel()
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current)
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current)
    }
  }, [])

  // Update voices when selected target language changes
  useEffect(() => {
    if (voices.length > 0) {
      updateVoicesForLanguage(selectedTargetLanguage, voices.map(v => v.voice))
    }
  }, [selectedTargetLanguage, updateVoicesForLanguage])

  // Fetch suggested activities
  const fetchSuggestions = useCallback(async (content: string) => {
    if (!content.trim() || content.length < 20) {
      setSuggestedActivities([])
      return
    }

    setLoadingSuggestions(true)
    try {
      const suggestions = await getSuggestedActivities({ data: { content, limit: 5 } })
      setSuggestedActivities(suggestions)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  // Fetch suggestions on mount if there's saved content
  useEffect(() => {
    if (savedState?.originalContent && savedState.originalContent.length >= 20) {
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
    if (voices.length > 0) {
      // Force update voice when user changes language
      updateVoicesForLanguage(langCode, voices.map(v => v.voice), true)
    }
  }

  // Handle gender selection
  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender)
    if (gender === 'female' && femaleVoice) {
      setSelectedVoice(femaleVoice)
    } else if (gender === 'male' && maleVoice) {
      setSelectedVoice(maleVoice)
    }
  }

  // Mode selection handlers
  const handleModeSelect = (mode: 'listen' | 'summarize' | 'craft') => {
    setSelectedMode(mode)
    // Clear AI result when switching modes
    if (mode === 'listen') {
      setAiResult('')
      setAiResultKeyPoints([])
    }
  }

  const handleConfirmGenerate = async () => {
    if (selectedMode === 'listen' || !originalContent.trim()) return

    setIsProcessing(true)
    setProcessingAction(selectedMode)

    try {
      if (selectedMode === 'summarize') {
        const result = await summarizeContent({
          data: {
            content: originalContent,
            language: originalDetectedLanguage === 'th' ? 'th' : 'en'
          }
        })
        setAiResult(result.summary)
        setAiResultKeyPoints([])
      } else if (selectedMode === 'craft') {
        const result = await craftContent({
          data: {
            content: originalContent,
            language: originalDetectedLanguage === 'th' ? 'th' : 'en'
          }
        })
        setAiResult(result.crafted)
        setAiResultKeyPoints(result.keyPoints)
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error(t('guru.error'))
    } finally {
      setIsProcessing(false)
      setProcessingAction('')
    }
  }

  const handleUseAiResult = () => {
    if (!aiResult) return

    setDisplayContent(aiResult)
    setContentMode(selectedMode === 'summarize' ? 'summarized' : 'crafted')
    setKeyPoints(aiResultKeyPoints)
    toast.success(selectedMode === 'summarize' ? t('guru.summarized') : t('guru.crafted'))

    // Clear AI result state
    setAiResult('')
    setAiResultKeyPoints([])
  }

  const handleDiscardAiResult = () => {
    setAiResult('')
    setAiResultKeyPoints([])
  }

  const handleTranslateAndPlay = async () => {
    if (!originalContent.trim()) return

    setShowTranslateModal(false)
    setIsProcessing(true)
    setProcessingAction('translate')

    try {
      // Translate to the selected target language in dropdown
      const result = await translateContent({
        data: {
          content: contentMode === 'original' ? originalContent : displayContent,
          targetLanguage: selectedTargetLanguage
        }
      })
      setDisplayContent(result.translated)
      setContentMode('translated')
      setKeyPoints([])
      toast.success(t('guru.translated'))

      // Auto play after translation
      setIsReaderMode(true)
      setTimeout(() => {
        charIndexRef.current = 0
        playFromText(result.translated, 0)
      }, 100)
    } catch (error) {
      console.error('Translate error:', error)
      toast.error(t('guru.error'))
    } finally {
      setIsProcessing(false)
      setProcessingAction('')
    }
  }

  const handlePlayOriginal = () => {
    setShowTranslateModal(false)
    // Reset to original detected language for TTS
    updateVoicesForLanguage(originalDetectedLanguage, voices.map(v => v.voice))
    setSelectedTargetLanguage(originalDetectedLanguage)

    setIsReaderMode(true)
    setTimeout(() => {
      charIndexRef.current = 0
      playFromText(displayContent, 0)
    }, 100)
  }

  const handleBackToOriginal = () => {
    setDisplayContent(originalContent)
    setContentMode('original')
    setKeyPoints([])
  }

  // TTS functions
  const playFromText = useCallback((textToPlay: string, startIndex: number = 0) => {
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(textToPlay)
    utteranceRef.current = utterance
    charIndexRef.current = startIndex

    const voice = voices.find((v) => v.voice.name === selectedVoice)?.voice
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    utterance.rate = rate

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const absoluteIndex = startIndex + event.charIndex
        charIndexRef.current = absoluteIndex
        setHighlightIndex(absoluteIndex)
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      setHighlightIndex(startIndex)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      charIndexRef.current = 0
      setHighlightIndex(0)
    }

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        // Reset playback state but keep position for resume
        speechSynthesis.cancel()
        setIsPlaying(false)
        setIsPaused(false)
        // Don't reset charIndexRef - keep position so user can resume from here
        console.warn('TTS error:', event.error)
      }
    }

    // Cancel any existing speech before starting new one
    speechSynthesis.cancel()
    setTimeout(() => {
      speechSynthesis.speak(utterance)
    }, 50)
  }, [voices, selectedVoice, rate])

  const handlePlay = () => {
    if (isPaused) {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = null
      }

      speechSynthesis.resume()

      setTimeout(() => {
        if (speechSynthesis.paused || !speechSynthesis.speaking) {
          // Resume failed, restart from current position or beginning
          const remainingText = displayContent.slice(charIndexRef.current)
          if (remainingText.trim()) {
            playFromText(remainingText, charIndexRef.current)
          } else {
            // If no remaining text, restart from beginning
            charIndexRef.current = 0
            playFromText(displayContent, 0)
          }
        }
      }, 150)

      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    if (!displayContent.trim()) return

    // Check if selected language differs from detected language
    // and content hasn't been translated yet
    if (selectedTargetLanguage !== originalDetectedLanguage && contentMode !== 'translated') {
      setShowTranslateModal(true)
      return
    }

    // Enter reader mode
    setIsReaderMode(true)

    // If already in reader mode with a saved position, resume from there
    if (charIndexRef.current > 0 && charIndexRef.current < displayContent.length) {
      const remainingText = displayContent.slice(charIndexRef.current)
      if (remainingText.trim()) {
        playFromText(remainingText, charIndexRef.current)
        return
      }
    }

    // Otherwise start from beginning
    charIndexRef.current = 0
    setHighlightIndex(0)
    playFromText(displayContent, 0)
  }

  const handlePause = () => {
    speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)

    // Save position immediately when pausing
    debouncedSave()

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    // Auto reset playback state after 30 seconds, but keep position
    pauseTimeoutRef.current = setTimeout(() => {
      speechSynthesis.cancel()
      setIsPaused(false)
      setIsPlaying(false)
      // Don't reset charIndexRef - keep position so user can resume from here
    }, 30000)
  }

  const handleStop = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
    speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    charIndexRef.current = 0
    setHighlightIndex(0)
  }

  const handleCopy = async () => {
    if (!displayContent) return
    await navigator.clipboard.writeText(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setOriginalContent('')
    setDisplayContent('')
    setContentMode('original')
    setKeyPoints([])
    setCharCount(0)
    setSuggestedActivities([])
    setHighlightIndex(0)
    charIndexRef.current = 0
    handleStop()
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  const rateOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
  ]

  // Language for display badge (detected language)
  const detectedLanguageDisplay = SUPPORTED_LANGUAGES.find(l => l.code === originalDetectedLanguage) || SUPPORTED_LANGUAGES[1]
  // Language for dropdown selection
  const selectedLanguageDisplay = SUPPORTED_LANGUAGES.find(l => l.code === selectedTargetLanguage) || SUPPORTED_LANGUAGES[1]

  // Auto-scroll to highlighted word
  useEffect(() => {
    if (highlightRef.current && containerRef.current && (isPlaying || isPaused)) {
      const container = containerRef.current
      const highlight = highlightRef.current

      const highlightTop = highlight.offsetTop
      const highlightHeight = highlight.offsetHeight
      const containerHeight = container.clientHeight
      const scrollTop = container.scrollTop

      const visibleTop = scrollTop
      const visibleBottom = scrollTop + containerHeight

      if (highlightTop < visibleTop || highlightTop + highlightHeight > visibleBottom) {
        container.scrollTo({
          top: highlightTop - containerHeight / 2 + highlightHeight / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [highlightIndex, isPlaying, isPaused])

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        {/* Hero Section */}
        <section className="relative py-12 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                {t('guru.badge')}
              </div>

              <h1 className="text-2xl md:text-4xl font-black mb-4 leading-tight">
                <span className="text-foreground">{t("guru.title1")}</span>
                <br className="md:hidden" />
                {" "}
                <span className="bg-linear-to-r from-primary via-emerald-500 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                  {t('guru.title2')}
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('guru.subtitle')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto">
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
                      {t('guru.inputLabel')}
                    </div>
                    {contentMode !== 'original' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToOriginal}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {t('guru.backToOriginal')}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Content Mode Indicator */}
                  {contentMode !== 'original' && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
                      {contentMode === 'summarized' && <FileText className='w-4 h-4' />}
                      {contentMode === 'crafted' && <Wand2 className='w-4 h-4' />}
                      {contentMode === 'translated' && <Languages className='w-4 h-4' />}
                      <span className="font-medium">
                        {contentMode === 'summarized' && t('guru.viewingSummary')}
                        {contentMode === 'crafted' && t('guru.viewingCrafted')}
                        {contentMode === 'translated' && t('guru.viewingTranslated')}
                      </span>
                    </div>
                  )}

                  {/* Text Input / Reader Mode / Highlighted Display */}
                  <div className="relative">
                    {isReaderMode ? (
                      // Reader mode - markdown display with close button
                      <div className="relative">
                        <button
                          onClick={() => {
                            // Stop playback but keep position when closing reader
                            speechSynthesis.cancel()
                            setIsPlaying(false)
                            setIsPaused(false)
                            setIsReaderMode(false)
                            // Don't reset charIndexRef and highlightIndex - keep position
                          }}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Close reader"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div
                          ref={containerRef}
                          className="min-h-[200px] max-h-[400px] overflow-auto p-4 pr-10 rounded-xl border border-primary/30 bg-linear-to-br from-primary/5 to-emerald-500/5"
                        >
                          {(isPlaying || isPaused || highlightIndex > 0) ? (
                            // Show highlighted text when playing or has saved position
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <span className="text-muted-foreground">{displayContent.slice(0, highlightIndex)}</span>
                              <span
                                ref={highlightRef}
                                className="bg-primary text-primary-foreground px-0.5 rounded"
                              >
                                {displayContent.slice(highlightIndex, displayContent.indexOf(' ', highlightIndex) === -1 ? displayContent.length : displayContent.indexOf(' ', highlightIndex))}
                              </span>
                              <span className="text-foreground">{displayContent.slice(displayContent.indexOf(' ', highlightIndex) === -1 ? displayContent.length : displayContent.indexOf(' ', highlightIndex))}</span>
                            </div>
                          ) : (
                            // Show markdown when not playing and no saved position
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                              <Markdown>{displayContent}</Markdown>
                            </div>
                          )}
                        </div>
                        {/* Info bar with actions */}
                        <div className="flex items-center justify-between mt-2 px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {detectedLanguageDisplay.flag} {detectedLanguageDisplay.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {displayContent.length} {t('tools.tts.characters')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleCopy}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title={t('tools.tts.copy')}
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleClear}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title={t('tools.tts.clear')}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Normal textarea mode
                      <div>
                        <Textarea
                          value={contentMode === 'original' ? originalContent : displayContent}
                          onChange={(e) => contentMode === 'original' && handleTextChange(e.target.value)}
                          placeholder={t('guru.placeholder')}
                          className="min-h-[200px] resize-none text-base"
                          readOnly={contentMode !== 'original'}
                        />
                        {/* Info bar below textarea */}
                        <div className="flex items-center justify-end gap-2 mt-2 px-1">
                          {displayContent.length > 0 && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              {detectedLanguageDisplay.flag} {detectedLanguageDisplay.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {contentMode === 'original' ? charCount : displayContent.length} {t('tools.tts.characters')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Points (after craft) */}
                  {keyPoints.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t('guru.keyPoints')}
                      </h4>
                      <ul className="space-y-1">
                        {keyPoints.map((point, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Select Loud Mode Box */}
                  <div className="p-4 rounded-xl border border-input bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground mb-3 block">
                      {t('guru.selectModeLabel')}
                    </label>

                    {/* Mode Buttons */}
                    <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-background border border-input">
                      {/* Just Listen Button */}
                      <button
                        onClick={() => handleModeSelect('listen')}
                        disabled={isProcessing}
                        className={cn(
                          'flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                          selectedMode === 'listen'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                          isProcessing && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Volume2 className="w-4 h-4" />
                        {t('guru.listen')}
                      </button>
                      {/* Summarize Button */}
                      <button
                        onClick={() => handleModeSelect('summarize')}
                        disabled={isProcessing}
                        className={cn(
                          'flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                          selectedMode === 'summarize'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                          isProcessing && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <FileText className="w-4 h-4" />
                        {t('guru.summarize')}
                      </button>
                      {/* Craft Button */}
                      <button
                        onClick={() => handleModeSelect('craft')}
                        disabled={isProcessing}
                        className={cn(
                          'flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                          selectedMode === 'craft'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                          isProcessing && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Wand2 className="w-4 h-4" />
                        {t('guru.craft')}
                      </button>
                    </div>

                    {/* Mode Description & Action */}
                    <div className="mt-4">
                      {selectedMode === 'listen' && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-emerald-500/20">
                              <Volume2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm text-muted-foreground [&_strong]:text-emerald-600 dark:[&_strong]:text-emerald-400 [&_strong]:font-semibold"
                                dangerouslySetInnerHTML={{ __html: t('guru.listenFreeDesc') }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {(selectedMode === 'summarize' || selectedMode === 'craft') && !aiResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-primary/20">
                              {selectedMode === 'summarize' ? (
                                <FileText className="w-4 h-4 text-primary" />
                              ) : (
                                <Wand2 className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground mb-3">
                                {selectedMode === 'summarize' ? t('guru.summarizeConfirmDesc') : t('guru.craftConfirmDesc')}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  onClick={handleConfirmGenerate}
                                  disabled={isProcessing || !originalContent.trim()}
                                  size="sm"
                                  className="gap-2"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                  {t('guru.confirmGenerate')}
                                </Button>
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  ✨ {t('guru.confirmCredit')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* AI Result Display */}
                  {aiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border-2 border-emerald-500/30 bg-linear-to-br from-emerald-500/5 to-primary/5 overflow-hidden"
                    >
                      <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            {t('guru.aiResult')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {selectedMode === 'summarize' ? t('guru.summarize') : t('guru.craft')}
                          </span>
                        </div>
                        <button
                          onClick={handleDiscardAiResult}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 max-h-[300px] overflow-auto">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                          <Markdown>{aiResult}</Markdown>
                        </div>
                      </div>
                      {/* Key Points if available */}
                      {aiResultKeyPoints.length > 0 && (
                        <div className="p-3 border-t border-emerald-500/20 bg-emerald-500/5">
                          <h5 className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {t('guru.keyPoints')}
                          </h5>
                          <ul className="space-y-1">
                            {aiResultKeyPoints.map((point, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="p-3 border-t border-emerald-500/20 flex items-center gap-2">
                        <Button
                          onClick={handleUseAiResult}
                          size="sm"
                          className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Check className="w-4 h-4" />
                          {t('guru.useThisVersion')}
                        </Button>
                        <Button
                          onClick={handleDiscardAiResult}
                          variant="outline"
                          size="sm"
                        >
                          {t('guru.discardResult')}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Voice Controls Grid */}
                  <div className="p-4 rounded-xl border border-input bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Language Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          {t('tools.tts.languageLabel')}
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-full h-10 px-3 rounded-lg border border-input bg-background hover:bg-accent/50 flex items-center justify-between text-sm font-medium transition-colors">
                              <span className="flex items-center gap-2">
                                <span>{selectedLanguageDisplay.flag}</span>
                                {selectedLanguageDisplay.name}
                              </span>
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {availableLanguages.map((lang) => (
                              <DropdownMenuItem
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={cn(
                                  'flex items-center gap-2 cursor-pointer',
                                  selectedTargetLanguage === lang.code && 'bg-accent'
                                )}
                              >
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                                {selectedTargetLanguage === lang.code && (
                                  <Check className="w-4 h-4 ml-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Speed Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          {t('tools.tts.speedLabel')}
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-full h-10 px-3 rounded-lg border border-input bg-background hover:bg-accent/50 flex items-center justify-between text-sm font-medium transition-colors">
                              <span className="flex items-center gap-2">
                                <span>⚡</span>
                                {rateOptions.find(r => r.value === rate)?.label || '1x'}
                              </span>
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {rateOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => setRate(option.value)}
                                className={cn(
                                  'flex items-center gap-2 cursor-pointer',
                                  rate === option.value && 'bg-accent'
                                )}
                              >
                                <span>{option.label}</span>
                                {rate === option.value && (
                                  <Check className="w-4 h-4 ml-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Female Voice Button */}
                      <button
                        onClick={() => handleGenderSelect('female')}
                        disabled={!femaleVoice}
                        className={cn(
                          'h-10 sm:mt-6 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all',
                          selectedGender === 'female'
                            ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                            : 'bg-background border border-input hover:bg-accent/50 text-foreground',
                          !femaleVoice && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="5" />
                          <path d="M12 13v8M9 21h6" />
                        </svg>
                        {uiLanguage === 'th' ? 'หญิง' : 'Female'}
                      </button>

                      {/* Male Voice Button */}
                      <button
                        onClick={() => handleGenderSelect('male')}
                        disabled={!maleVoice}
                        className={cn(
                          'h-10 sm:mt-6 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all',
                          selectedGender === 'male'
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                            : 'bg-background border border-input hover:bg-accent/50 text-foreground',
                          !maleVoice && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="14" r="5" />
                          <path d="M19 5l-5.4 5.4M19 5h-5M19 5v5" />
                        </svg>
                        {uiLanguage === 'th' ? 'ชาย' : 'Male'}
                      </button>
                    </div>
                  </div>

                  {/* Play Button - Always visible */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isPlaying && !isPaused ? (
                      <Button
                        onClick={handlePlay}
                        disabled={!displayContent.trim()}
                        className="gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                      >
                        <Play className="w-4 h-4" />
                        {t('tools.tts.play')}
                      </Button>
                    ) : isPlaying ? (
                      <>
                        <Button
                          onClick={handlePause}
                          variant="outline"
                          className="gap-2"
                        >
                          <Pause className="w-4 h-4" />
                          {t('tools.tts.pause')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleStop}
                          className="gap-2"
                        >
                          <Square className="w-4 h-4" />
                          {t('tools.tts.stop')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handlePlay}
                          variant="outline"
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          {t('tools.tts.resume')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleStop}
                          className="gap-2"
                        >
                          <Square className="w-4 h-4" />
                          {t('tools.tts.stop')}
                        </Button>
                      </>
                    )}
                  </div>
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
                    {t('guru.suggestedTitle')}
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
                            onClick={() => navigate({ to: `/activity/play/${activity.id}` })}
                          >
                            <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors">
                              <div className={cn(
                                'h-24 bg-linear-to-br flex items-center justify-center',
                                style.bg
                              )}>
                                {activity.thumbnail ? (
                                  <img
                                    src={activity.thumbnail}
                                    alt={activity.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-4xl">{style.icon}</span>
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
        </section>
      </div>

      {/* Translation Confirmation Modal */}
      {showTranslateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowTranslateModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Languages className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('guru.translateModalTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('guru.translateModalDescription')}
              </p>
            </div>

            <div className="space-y-3">
              {/* Translate and play option */}
              <Button
                onClick={handleTranslateAndPlay}
                disabled={isProcessing}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                {isProcessing && processingAction === 'translate' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
                {t('guru.translateAndPlay', {
                  language: SUPPORTED_LANGUAGES.find(l => l.code === selectedTargetLanguage)?.name || 'English'
                })}
              </Button>

              {/* Play in original language */}
              <Button
                onClick={handlePlayOriginal}
                variant="outline"
                className="w-full gap-2"
              >
                <Play className="w-4 h-4" />
                {t('guru.playOriginal', {
                  language: SUPPORTED_LANGUAGES.find(l => l.code === originalDetectedLanguage)?.name || 'English'
                })}
              </Button>

              {/* Cancel */}
              <Button
                onClick={() => setShowTranslateModal(false)}
                variant="ghost"
                className="w-full"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Status Indicator */}
      {(isPlaying || isPaused) && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-card/95 backdrop-blur-sm border border-border shadow-lg"
        >
          {isPlaying && (
            <>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{ height: ['8px', '20px', '8px'] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-primary">{t("tools.tts.playing")}</span>
              <Button size="sm" variant="ghost" onClick={handlePause} className="h-8 w-8 p-0 rounded-full hover:bg-amber-500/20">
                <Pause className="w-4 h-4 text-amber-500" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleStop} className="h-8 w-8 p-0 rounded-full hover:bg-destructive/20">
                <Square className="w-4 h-4 text-destructive" />
              </Button>
            </>
          )}
          {isPaused && (
            <>
              <span className="text-sm font-medium text-amber-500">{t("tools.tts.paused")}</span>
              <Button size="sm" variant="ghost" onClick={handlePlay} className="h-8 w-8 p-0 rounded-full hover:bg-primary/20">
                <Play className="w-4 h-4 text-primary" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleStop} className="h-8 w-8 p-0 rounded-full hover:bg-destructive/20">
                <Square className="w-4 h-4 text-destructive" />
              </Button>
            </>
          )}
        </motion.div>
      )}
    </DefaultLayout>
  )
}
