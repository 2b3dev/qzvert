import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Copy,
  Pause,
  Play,
  Square,
  Volume2,
  X,
} from 'lucide-react'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import Markdown from 'react-markdown'

// Types
interface VoiceInfo {
  voice: SpeechSynthesisVoice
  lang: string
  gender: 'male' | 'female' | 'unknown'
}

// Voice gender detection helper
function detectVoiceGender(
  voice: SpeechSynthesisVoice,
): 'male' | 'female' | 'unknown' {
  const name = voice.name.toLowerCase()
  const femalePatterns = [
    'female',
    'woman',
    'girl',
    'zira',
    'hazel',
    'susan',
    'karen',
    'samantha',
    'victoria',
    'fiona',
    'moira',
    'tessa',
    'veena',
    'kanya',
    'hongying',
    'sinji',
    'yuna',
    'kyoko',
    'o-ren',
    'ting-ting',
    'mei-jia',
    'sin-ji',
    'onuma',
  ]
  const malePatterns = [
    'male',
    'man',
    'boy',
    'david',
    'mark',
    'james',
    'daniel',
    'alex',
    'tom',
    'fred',
    'ralph',
    'albert',
    'bruce',
    'junior',
    'aaron',
    'neel',
    'prem',
    'george',
  ]

  if (femalePatterns.some((p) => name.includes(p))) return 'female'
  if (malePatterns.some((p) => name.includes(p))) return 'male'
  return 'unknown'
}

// Rate options
const rateOptions = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2, label: '2x' },
]

// Language option type
export interface LanguageOption {
  code: string
  name: string
  flag: string
}

// Default available languages
const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
]

// Ref handle for external control
export interface TextToLoudRef {
  play: () => void
  pause: () => void
  stop: () => void
  isPlaying: boolean
  isPaused: boolean
}

export interface TextToLoudProps {
  // Content
  text: string
  detectedLanguage?: string

  // Appearance
  className?: string
  readerClassName?: string
  settingsClassName?: string

  // Control visibility
  showSettings?: boolean
  showReaderMode?: boolean
  showFloatControls?: boolean
  showPlayButton?: boolean

  // External state control (for controlled mode)
  isReaderMode?: boolean
  onReaderModeChange?: (isReader: boolean) => void

  // Voice settings - can be controlled externally
  selectedLanguage?: string
  onLanguageChange?: (langCode: string) => void
  availableLanguages?: LanguageOption[]

  rate?: number
  onRateChange?: (rate: number) => void

  selectedGender?: 'male' | 'female'
  onGenderChange?: (gender: 'male' | 'female') => void

  // Playback state callbacks
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onHighlightChange?: (index: number) => void

  // External highlight control (for resuming from position)
  initialHighlightIndex?: number

  // Translations
  translations?: {
    settings?: string
    language?: string
    speed?: string
    female?: string
    male?: string
    play?: string
    pause?: string
    stop?: string
    resume?: string
    copy?: string
    characters?: string
    playing?: string
    paused?: string
  }
  uiLanguage?: 'en' | 'th'

  // Play button customization
  playButtonClassName?: string
  playButtonLabel?: string
  playButtonIcon?: React.ReactNode

  // Render props for custom content
  renderBeforeSettings?: React.ReactNode
  renderAfterSettings?: React.ReactNode
}

export const TextToLoud = forwardRef<TextToLoudRef, TextToLoudProps>(
  (
    {
      text,
      detectedLanguage = 'en',
      className,
      readerClassName,
      settingsClassName,
      showSettings = true,
      showReaderMode = true,
      showFloatControls = true,
      showPlayButton = true,
      isReaderMode: externalReaderMode,
      onReaderModeChange,
      selectedLanguage: externalSelectedLanguage,
      onLanguageChange,
      availableLanguages = DEFAULT_LANGUAGES,
      rate: externalRate,
      onRateChange,
      selectedGender: externalGender,
      onGenderChange,
      onPlay,
      onPause,
      onStop,
      onHighlightChange,
      initialHighlightIndex = 0,
      translations,
      uiLanguage = 'en',
      playButtonClassName,
      playButtonLabel,
      playButtonIcon,
      renderBeforeSettings,
      renderAfterSettings,
    },
    ref,
  ) => {
    // Default translations - memoized to prevent recalculation
    const t = useMemo(() => ({
      settings: uiLanguage === 'th' ? 'ตั้งค่าเสียง' : 'Voice Settings',
      language: uiLanguage === 'th' ? 'ภาษาเสียง' : 'Target Language',
      speed: uiLanguage === 'th' ? 'ความเร็ว' : 'Speed',
      female: uiLanguage === 'th' ? 'หญิง' : 'Female',
      male: uiLanguage === 'th' ? 'ชาย' : 'Male',
      play: uiLanguage === 'th' ? 'เล่น' : 'Play',
      pause: uiLanguage === 'th' ? 'หยุดชั่วคราว' : 'Pause',
      stop: uiLanguage === 'th' ? 'หยุด' : 'Stop',
      resume: uiLanguage === 'th' ? 'เล่นต่อ' : 'Resume',
      copy: uiLanguage === 'th' ? 'คัดลอก' : 'Copy',
      characters: uiLanguage === 'th' ? 'ตัวอักษร' : 'characters',
      playing: uiLanguage === 'th' ? 'กำลังเล่น' : 'Playing',
      paused: uiLanguage === 'th' ? 'หยุดชั่วคราว' : 'Paused',
      ...translations,
    }), [uiLanguage, translations])

    // Internal states
    const [internalReaderMode, setInternalReaderMode] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(initialHighlightIndex)
    const [voices, setVoices] = useState<Array<VoiceInfo>>([])
    const [selectedVoice, setSelectedVoice] = useState<string>('')
    const [internalGender, setInternalGender] = useState<'male' | 'female'>(
      'female',
    )
    const [internalLanguage, setInternalLanguage] = useState<string>(
      detectedLanguage,
    )
    const [internalRate, setInternalRate] = useState(1)
    const [copied, setCopied] = useState(false)

    // Controlled vs uncontrolled
    const isReaderMode =
      externalReaderMode !== undefined ? externalReaderMode : internalReaderMode
    const selectedLanguage =
      externalSelectedLanguage !== undefined
        ? externalSelectedLanguage
        : internalLanguage
    const rate = externalRate !== undefined ? externalRate : internalRate
    const selectedGender =
      externalGender !== undefined ? externalGender : internalGender

    // Refs
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const charIndexRef = useRef(initialHighlightIndex)
    const containerRef = useRef<HTMLDivElement>(null)
    const highlightRef = useRef<HTMLSpanElement>(null)
    const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set())
    const hasPlayedRef = useRef(false) // Track if user has played at least once

    // Helper to track and clear timeouts
    const safeSetTimeout = useCallback((fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timeoutRefs.current.delete(id)
        fn()
      }, ms)
      timeoutRefs.current.add(id)
      return id
    }, [])

    // Get language display - memoized
    const selectedLanguageDisplay = useMemo(() =>
      availableLanguages.find((l) => l.code === selectedLanguage) ||
      availableLanguages.find((l) => l.code === detectedLanguage) ||
      availableLanguages[0]
    , [availableLanguages, selectedLanguage, detectedLanguage])

    const detectedLanguageDisplay = useMemo(() =>
      availableLanguages.find((l) => l.code === detectedLanguage) ||
      availableLanguages[0]
    , [availableLanguages, detectedLanguage])

    // Filter voices by language - memoized for performance
    const filteredVoices = useMemo(() =>
      voices.filter((v) => v.lang.toLowerCase().startsWith(selectedLanguage.toLowerCase()))
    , [voices, selectedLanguage])

    const femaleVoice = useMemo(() =>
      filteredVoices.find((v) => v.gender === 'female')
    , [filteredVoices])

    const maleVoice = useMemo(() =>
      filteredVoices.find((v) => v.gender === 'male')
    , [filteredVoices])

    // Load voices
    useEffect(() => {
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        const voiceInfos: Array<VoiceInfo> = availableVoices.map((voice) => ({
          voice,
          lang: voice.lang,
          gender: detectVoiceGender(voice),
        }))
        setVoices(voiceInfos)
      }

      loadVoices()
      speechSynthesis.onvoiceschanged = loadVoices

      return () => {
        speechSynthesis.onvoiceschanged = null
      }
    }, [])

    // Set default voice when voices or language changes
    useEffect(() => {
      if (filteredVoices.length > 0) {
        const preferredVoice =
          selectedGender === 'female' ? femaleVoice : maleVoice
        const defaultVoice = preferredVoice || filteredVoices[0]
        if (defaultVoice && selectedVoice !== defaultVoice.voice.name) {
          setSelectedVoice(defaultVoice.voice.name)
        }
      }
      // Note: selectedVoice is intentionally excluded to prevent infinite loop
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredVoices, selectedGender, femaleVoice, maleVoice])

    // Auto scroll to highlight
    useEffect(() => {
      if (highlightRef.current && containerRef.current && isPlaying) {
        const container = containerRef.current
        const highlight = highlightRef.current

        const highlightTop = highlight.offsetTop
        const highlightHeight = highlight.offsetHeight
        const containerHeight = container.clientHeight
        const scrollTop = container.scrollTop

        const visibleTop = scrollTop
        const visibleBottom = scrollTop + containerHeight

        if (
          highlightTop < visibleTop ||
          highlightTop + highlightHeight > visibleBottom
        ) {
          container.scrollTo({
            top: highlightTop - containerHeight / 2 + highlightHeight / 2,
            behavior: 'smooth',
          })
        }
      }
    }, [highlightIndex, isPlaying])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        speechSynthesis.cancel()
        // Clear all tracked timeouts
        timeoutRefs.current.forEach((id) => clearTimeout(id))
        timeoutRefs.current.clear()
      }
    }, [])

    // Notify parent of highlight changes
    useEffect(() => {
      onHighlightChange?.(highlightIndex)
    }, [highlightIndex, onHighlightChange])

    // Handlers
    const handleGenderSelect = useCallback(
      (gender: 'male' | 'female') => {
        if (onGenderChange) {
          onGenderChange(gender)
        } else {
          setInternalGender(gender)
        }
        const voice = gender === 'female' ? femaleVoice : maleVoice
        if (voice) {
          setSelectedVoice(voice.voice.name)
        }
      },
      [femaleVoice, maleVoice, onGenderChange],
    )

    const handleLanguageChange = useCallback(
      (langCode: string) => {
        if (onLanguageChange) {
          onLanguageChange(langCode)
        } else {
          setInternalLanguage(langCode)
        }
        setSelectedVoice('')
      },
      [onLanguageChange],
    )

    const handleRateChange = useCallback(
      (newRate: number) => {
        if (onRateChange) {
          onRateChange(newRate)
        } else {
          setInternalRate(newRate)
        }
      },
      [onRateChange],
    )

    const setReaderMode = useCallback(
      (value: boolean) => {
        if (onReaderModeChange) {
          onReaderModeChange(value)
        } else {
          setInternalReaderMode(value)
        }
      },
      [onReaderModeChange],
    )

    const playFromText = useCallback(
      (fullText: string, startIndex = 0) => {
        if (!fullText.trim()) return

        speechSynthesis.cancel()
        const remainingText = fullText.slice(startIndex)
        if (!remainingText.trim()) return

        const utterance = new SpeechSynthesisUtterance(remainingText)
        utteranceRef.current = utterance

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
        }

        utterance.onend = () => {
          setIsPlaying(false)
          setIsPaused(false)
          charIndexRef.current = 0
          setHighlightIndex(0)
        }

        utterance.onerror = (event) => {
          if (event.error !== 'interrupted') {
            speechSynthesis.cancel()
            setIsPlaying(false)
            setIsPaused(false)
          }
        }

        // Small delay to ensure cancel is complete
        safeSetTimeout(() => {
          speechSynthesis.speak(utterance)
        }, 50)
      },
      [voices, selectedVoice, rate, safeSetTimeout],
    )

    const handlePlay = useCallback(() => {
      if (isPaused) {
        // Try to resume first
        speechSynthesis.resume()

        // Check if resume worked after a short delay
        safeSetTimeout(() => {
          // If not speaking, speech was probably cancelled by browser (paused too long)
          // Clear position and restart from beginning
          if (!speechSynthesis.speaking) {
            setIsPaused(false)
            charIndexRef.current = 0
            setHighlightIndex(0)
            playFromText(text, 0)
          } else {
            // Resume worked
            setIsPaused(false)
            setIsPlaying(true)
          }
        }, 100)
        return
      }

      if (!text.trim()) return

      // Enter reader mode
      if (showReaderMode) {
        setReaderMode(true)
      }

      // First play after reload: use saved position (initialHighlightIndex)
      // Subsequent plays: start from beginning
      let startIndex = 0
      if (!hasPlayedRef.current && initialHighlightIndex > 0 && initialHighlightIndex < text.length) {
        startIndex = initialHighlightIndex
      }
      hasPlayedRef.current = true

      charIndexRef.current = startIndex
      setHighlightIndex(startIndex)
      playFromText(text, startIndex)
      onPlay?.()
    }, [isPaused, text, showReaderMode, setReaderMode, playFromText, onPlay, safeSetTimeout, initialHighlightIndex])

    const handlePause = useCallback(() => {
      speechSynthesis.pause()
      setIsPaused(true)
      setIsPlaying(false)
      onPause?.()
    }, [onPause])

    const handleStop = useCallback(() => {
      speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
      charIndexRef.current = 0
      setHighlightIndex(0)
      onStop?.()
    }, [onStop])

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        safeSetTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }, [text, safeSetTimeout])

    const closeReaderMode = useCallback(() => {
      speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
      setReaderMode(false)
    }, [setReaderMode])

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        play: handlePlay,
        pause: handlePause,
        stop: handleStop,
        isPlaying,
        isPaused,
      }),
      [handlePlay, handlePause, handleStop, isPlaying, isPaused],
    )

    return (
      <div className={cn('relative', className)}>
        {/* Reader Mode */}
        <AnimatePresence>
          {showReaderMode && isReaderMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title={t.copy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={closeReaderMode}
                  className="p-1.5 rounded-lg bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close reader"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div
                ref={containerRef}
                className={cn(
                  'min-h-[200px] max-h-[400px] overflow-auto p-4 pr-10 rounded-xl border border-primary/30 bg-linear-to-br from-primary/5 to-emerald-500/5',
                  readerClassName,
                )}
              >
                {isPlaying || isPaused || highlightIndex > 0 ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <span className="text-muted-foreground">
                      {text.slice(0, highlightIndex)}
                    </span>
                    <span
                      ref={highlightRef}
                      className="bg-primary text-primary-foreground px-0.5 rounded"
                    >
                      {text.slice(
                        highlightIndex,
                        text.indexOf(' ', highlightIndex) === -1
                          ? text.length
                          : text.indexOf(' ', highlightIndex),
                      )}
                    </span>
                    <span className="text-foreground">
                      {text.slice(
                        text.indexOf(' ', highlightIndex) === -1
                          ? text.length
                          : text.indexOf(' ', highlightIndex),
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                    <Markdown>{text}</Markdown>
                  </div>
                )}
              </div>
              {/* Info bar */}
              <div className="flex items-center justify-end gap-2 mt-2 px-1">
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {detectedLanguageDisplay.flag} {detectedLanguageDisplay.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {text.length} {t.characters}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        {showSettings && !isReaderMode && (
          <div
            className={cn(
              'p-4 rounded-xl border border-input bg-muted/30 transition-opacity',
              isPlaying && 'opacity-50 pointer-events-none',
              settingsClassName,
            )}
          >
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{t.settings}</span>
            </div>

            {/* Custom content before voice controls */}
            {renderBeforeSettings}

            {/* Voice Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Language Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t.language}
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isPlaying}>
                    <button
                      className={cn(
                        'w-full h-10 px-3 rounded-lg border border-input bg-background flex items-center justify-between text-sm font-medium transition-colors',
                        isPlaying
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-accent/50',
                      )}
                      disabled={isPlaying}
                    >
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
                          selectedLanguage === lang.code && 'bg-accent',
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                        {selectedLanguage === lang.code && (
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
                  {t.speed}
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isPlaying}>
                    <button
                      className={cn(
                        'w-full h-10 px-3 rounded-lg border border-input bg-background flex items-center justify-between text-sm font-medium transition-colors',
                        isPlaying
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-accent/50',
                      )}
                      disabled={isPlaying}
                    >
                      <span className="flex items-center gap-2">
                        <span>⚡</span>
                        {rateOptions.find((r) => r.value === rate)?.label ||
                          '1x'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {rateOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleRateChange(option.value)}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          rate === option.value && 'bg-accent',
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
                disabled={!femaleVoice || isPlaying}
                className={cn(
                  'h-10 sm:mt-6 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all',
                  selectedGender === 'female'
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                    : 'bg-background border border-input hover:bg-accent/50 text-foreground',
                  (!femaleVoice || isPlaying) && 'opacity-50 cursor-not-allowed',
                )}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M12 13v8M9 21h6" />
                </svg>
                {t.female}
              </button>

              {/* Male Voice Button */}
              <button
                onClick={() => handleGenderSelect('male')}
                disabled={!maleVoice || isPlaying}
                className={cn(
                  'h-10 sm:mt-6 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all',
                  selectedGender === 'male'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'bg-background border border-input hover:bg-accent/50 text-foreground',
                  (!maleVoice || isPlaying) && 'opacity-50 cursor-not-allowed',
                )}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="10" cy="14" r="5" />
                  <path d="M19 5l-5.4 5.4M19 5h-5M19 5v5" />
                </svg>
                {t.male}
              </button>
            </div>

            {/* Custom content after voice controls */}
            {renderAfterSettings}
          </div>
        )}

        {/* Play Button */}
        {showPlayButton && !isReaderMode && (
          <div className="mt-4">
            {!isPlaying && !isPaused ? (
              <Button
                onClick={handlePlay}
                disabled={!text.trim()}
                className={cn(
                  'gap-2 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90',
                  playButtonClassName,
                )}
              >
                {playButtonIcon || <Play className="w-4 h-4" />}
                {playButtonLabel || t.play}
              </Button>
            ) : isPlaying ? (
              <div className="flex items-center gap-2">
                <Button onClick={handlePause} variant="outline" className="gap-2">
                  <Pause className="w-4 h-4" />
                  {t.pause}
                </Button>
                <Button onClick={handleStop} variant="outline" className="gap-2">
                  <Square className="w-4 h-4" />
                  {t.stop}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={handlePlay} variant="outline" className="gap-2">
                  <Play className="w-4 h-4" />
                  {t.resume}
                </Button>
                <Button onClick={handleStop} variant="outline" className="gap-2">
                  <Square className="w-4 h-4" />
                  {t.stop}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Float Controls */}
        <AnimatePresence>
          {showFloatControls && (isPlaying || isPaused) && (
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
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {t.playing}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePause}
                    className="h-8 w-8 p-0 rounded-full hover:bg-amber-500/20"
                  >
                    <Pause className="w-4 h-4 text-amber-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStop}
                    className="h-8 w-8 p-0 rounded-full hover:bg-destructive/20"
                  >
                    <Square className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              )}
              {isPaused && (
                <>
                  <span className="text-sm font-medium text-amber-500">
                    {t.paused}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlay}
                    className="h-8 w-8 p-0 rounded-full hover:bg-primary/20"
                  >
                    <Play className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStop}
                    className="h-8 w-8 p-0 rounded-full hover:bg-destructive/20"
                  >
                    <Square className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

TextToLoud.displayName = 'TextToLoud'

export default TextToLoud
