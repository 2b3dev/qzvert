import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Volume2,
  Play,
  Pause,
  Square,
  Languages,
  Gauge,
  Mic2,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/utils'

export const Route = createFileRoute('/tools/text-to-speech')({
  component: TextToSpeechPage,
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

function TextToSpeechPage() {
  const { t, language: uiLanguage } = useTranslation()
  const [text, setText] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female')
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en')
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>([])
  const [maleVoice, setMaleVoice] = useState<string | null>(null)
  const [femaleVoice, setFemaleVoice] = useState<string | null>(null)
  const [rate, setRate] = useState(1)
  const [copied, setCopied] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [highlightIndex, setHighlightIndex] = useState<number>(0)
  const [currentWord, setCurrentWord] = useState<string>('')
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentTextRef = useRef<string>('')
  const charIndexRef = useRef<number>(0)
  const baseIndexRef = useRef<number>(0)
  const highlightRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect language from text
  const detectLanguage = useCallback((inputText: string): string => {
    if (!inputText.trim()) return uiLanguage === 'th' ? 'th' : 'en'

    // Thai characters range
    const thaiPattern = /[\u0E00-\u0E7F]/
    // Chinese characters range
    const chinesePattern = /[\u4E00-\u9FFF\u3400-\u4DBF]/
    // Japanese characters (Hiragana, Katakana, Kanji)
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/
    // Korean characters
    const koreanPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/
    // Cyrillic (Russian)
    const cyrillicPattern = /[\u0400-\u04FF]/
    // Arabic
    const arabicPattern = /[\u0600-\u06FF]/
    // Vietnamese special characters
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

    const sample = inputText.slice(0, 200)

    if (thaiPattern.test(sample)) return 'th'
    if (japanesePattern.test(sample)) return 'ja'
    if (koreanPattern.test(sample)) return 'ko'
    if (chinesePattern.test(sample)) return 'zh'
    if (cyrillicPattern.test(sample)) return 'ru'
    if (arabicPattern.test(sample)) return 'ar'
    if (vietnamesePattern.test(sample)) return 'vi'

    // Check for Spanish/French/German/Portuguese specific characters
    const spanishPattern = /[ñ¿¡]/i
    const frenchPattern = /[œæçéèêëàâùûüïîôÿ]/i
    const germanPattern = /[äöüß]/i
    const portuguesePattern = /[ãõç]/i

    if (spanishPattern.test(sample)) return 'es'
    if (germanPattern.test(sample)) return 'de'
    if (frenchPattern.test(sample)) return 'fr'
    if (portuguesePattern.test(sample)) return 'pt'

    // Default to English
    return 'en'
  }, [uiLanguage])

  // Find best male/female voices for a specific language
  const findVoicesForLanguage = useCallback((availableVoices: SpeechSynthesisVoice[], langCode: string) => {
    // Common patterns for male/female voice names
    const femalePatterns = ['female', 'woman', 'zira', 'hazel', 'susan', 'samantha', 'karen', 'victoria', 'kanya', 'onuma', 'google.*female', 'ava', 'joanna', 'salli', 'kimberly', 'ivy', 'emma', 'amy', 'nicole', 'rachel']
    const malePatterns = ['male', 'man', 'david', 'mark', 'james', 'daniel', 'george', 'prem', 'google.*male', 'matthew', 'joey', 'justin', 'kevin', 'brian', 'russell', 'geraint']

    // Filter voices by language
    const langVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()))
    const fallbackVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('en'))
    const voicesToSearch = langVoices.length > 0 ? langVoices : fallbackVoices

    // Find female voice
    let foundFemaleVoice = voicesToSearch.find(v =>
      femalePatterns.some(p => v.name.toLowerCase().includes(p))
    )
    if (!foundFemaleVoice && voicesToSearch.length > 0) {
      foundFemaleVoice = voicesToSearch[0]
    }

    // Find male voice
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
  const updateVoicesForLanguage = useCallback((langCode: string, allVoices: SpeechSynthesisVoice[]) => {
    const { femaleVoice: fVoice, maleVoice: mVoice } = findVoicesForLanguage(allVoices, langCode)

    setFemaleVoice(fVoice?.name || null)
    setMaleVoice(mVoice?.name || null)

    // Set selected voice based on gender preference
    if (selectedGender === 'female' && fVoice) {
      setSelectedVoice(fVoice.name)
    } else if (selectedGender === 'male' && mVoice) {
      setSelectedVoice(mVoice.name)
    } else if (fVoice) {
      setSelectedVoice(fVoice.name)
    } else if (mVoice) {
      setSelectedVoice(mVoice.name)
    }
  }, [findVoicesForLanguage, selectedGender])

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      const voiceOptions: VoiceOption[] = availableVoices.map((voice) => ({
        voice,
        label: `${voice.name} (${voice.lang})`,
      }))
      setVoices(voiceOptions)

      // Find which languages are available
      const availableLangCodes = new Set(availableVoices.map(v => v.lang.split('-')[0].toLowerCase()))
      const availableLangs = SUPPORTED_LANGUAGES.filter(lang => availableLangCodes.has(lang.code))
      setAvailableLanguages(availableLangs)

      // Set initial voices for detected language
      updateVoicesForLanguage(detectedLanguage, availableVoices)
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      speechSynthesis.cancel()
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
      if (detectTimeoutRef.current) {
        clearTimeout(detectTimeoutRef.current)
      }
    }
  }, [])

  // Update voices when detected language changes
  useEffect(() => {
    if (voices.length > 0) {
      updateVoicesForLanguage(detectedLanguage, voices.map(v => v.voice))
    }
  }, [detectedLanguage, updateVoicesForLanguage])

  // Handle text change with language detection
  const handleTextChange = (newText: string) => {
    setText(newText)
    setCharCount(newText.length)

    // Debounce language detection
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current)
    }

    detectTimeoutRef.current = setTimeout(() => {
      const detected = detectLanguage(newText)
      if (detected !== detectedLanguage) {
        setDetectedLanguage(detected)
      }
    }, 300)
  }

  // Handle language selection
  const handleLanguageChange = (langCode: string) => {
    setDetectedLanguage(langCode)
    if (voices.length > 0) {
      updateVoicesForLanguage(langCode, voices.map(v => v.voice))
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

  // Helper to create and play utterance
  const playFromText = useCallback((textToPlay: string, startIndex: number = 0) => {
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(textToPlay)
    utteranceRef.current = utterance
    currentTextRef.current = textToPlay
    charIndexRef.current = startIndex
    baseIndexRef.current = startIndex

    // Set voice
    const voice = voices.find((v) => v.voice.name === selectedVoice)?.voice
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    // Set rate
    utterance.rate = rate

    // Track character position for resume and highlight
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const absoluteIndex = startIndex + event.charIndex
        charIndexRef.current = absoluteIndex
        setHighlightIndex(absoluteIndex)
        // Get the current word being spoken
        const wordEnd = textToPlay.indexOf(' ', event.charIndex)
        const word = wordEnd === -1
          ? textToPlay.slice(event.charIndex)
          : textToPlay.slice(event.charIndex, wordEnd)
        setCurrentWord(word.trim())
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
      setCurrentWord('')
    }

    utterance.onerror = (event) => {
      // Ignore interrupted errors (happens on cancel)
      if (event.error !== 'interrupted') {
        setIsPlaying(false)
        setIsPaused(false)
        setHighlightIndex(0)
        setCurrentWord('')
      }
    }

    speechSynthesis.speak(utterance)
  }, [voices, selectedVoice, rate])

  const handlePlay = () => {
    if (isPaused) {
      // Clear pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = null
      }

      // Try native resume first
      speechSynthesis.resume()

      // Check if resume worked after a short delay
      setTimeout(() => {
        if (speechSynthesis.paused || !speechSynthesis.speaking) {
          // Resume failed - restart from approximate position
          const remainingText = text.slice(charIndexRef.current)
          if (remainingText.trim()) {
            playFromText(remainingText, charIndexRef.current)
          }
        }
      }, 100)

      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    if (!text.trim()) return

    charIndexRef.current = 0
    playFromText(text, 0)
  }

  const handlePause = () => {
    speechSynthesis.pause()
    setIsPaused(true)
    setIsPlaying(false)

    // Auto-stop after 10 seconds to prevent Chrome bug
    // where pause for too long causes speech to die
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    pauseTimeoutRef.current = setTimeout(() => {
      // If still paused after 10s, we'll need to restart from position
      // The charIndexRef already has the position saved
    }, 10000)
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
    setCurrentWord('')
  }

  const handleCopy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setText('')
    setCharCount(0)
    handleStop()
  }

  const rateOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
  ]

  // Get current language info
  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === detectedLanguage) || SUPPORTED_LANGUAGES[1]

  // Auto-scroll to highlighted word
  useEffect(() => {
    if (highlightRef.current && containerRef.current && (isPlaying || isPaused)) {
      const container = containerRef.current
      const highlight = highlightRef.current

      const highlightTop = highlight.offsetTop
      const highlightHeight = highlight.offsetHeight
      const containerHeight = container.clientHeight
      const scrollTop = container.scrollTop

      // Check if highlight is outside visible area
      const visibleTop = scrollTop
      const visibleBottom = scrollTop + containerHeight

      if (highlightTop < visibleTop || highlightTop + highlightHeight > visibleBottom) {
        // Scroll to center the highlighted word
        container.scrollTo({
          top: highlightTop - containerHeight / 2 + highlightHeight / 2,
          behavior: 'smooth'
        })
      }
    }
  }, [highlightIndex, isPlaying, isPaused])

  // Render highlighted text
  const renderHighlightedText = () => {
    if (!text) return null

    const beforeHighlight = text.slice(0, highlightIndex)
    const afterHighlight = text.slice(highlightIndex)

    // Find current word end
    const spaceIndex = afterHighlight.indexOf(' ')
    const newlineIndex = afterHighlight.indexOf('\n')
    let wordEndIndex = afterHighlight.length

    if (spaceIndex !== -1 && (newlineIndex === -1 || spaceIndex < newlineIndex)) {
      wordEndIndex = spaceIndex
    } else if (newlineIndex !== -1) {
      wordEndIndex = newlineIndex
    }

    const highlightedWord = afterHighlight.slice(0, wordEndIndex)
    const remaining = afterHighlight.slice(wordEndIndex)

    return (
      <div
        ref={containerRef}
        className="min-h-[200px] p-3 rounded-md border border-input bg-background text-base whitespace-pre-wrap wrap-break-word overflow-auto max-h-[400px]"
      >
        <span className="text-muted-foreground">{beforeHighlight}</span>
        <span
          ref={highlightRef}
          className="bg-primary text-primary-foreground px-0.5 rounded"
        >
          {highlightedWord}
        </span>
        <span className="text-foreground">{remaining}</span>
      </div>
    )
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        {/* Hero Section */}
        <section className="relative py-16 px-6 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                <Volume2 className="w-4 h-4" />
                {t('tools.tts.badge')}
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                <span className="text-foreground">{t('tools.tts.title1')}</span>{' '}
                <span className="bg-linear-to-r from-primary via-cyan-500 to-emerald-400 bg-clip-text text-transparent">
                  {t('tools.tts.title2')}
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('tools.tts.subtitle')}
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
                <CardHeader className="bg-linear-to-r from-primary/10 to-cyan-500/10 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-primary" />
                    {t('tools.tts.inputLabel')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Text Input / Highlighted Display */}
                  <div className="relative">
                    {(isPlaying || isPaused) && text ? (
                      renderHighlightedText()
                    ) : (
                      <Textarea
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder={t('tools.tts.placeholder')}
                        className="min-h-[200px] resize-none text-base"
                      />
                    )}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      {text.length > 0 && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          {currentLanguage.flag} {currentLanguage.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {charCount} {t('tools.tts.characters')}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    {/* Language & Voice Selection Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Language Dropdown */}
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Languages className="w-4 h-4 text-primary" />
                          {t('tools.tts.languageLabel')}
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-full h-11 px-4 rounded-xl border border-input bg-background hover:bg-accent/50 flex items-center justify-between text-sm font-medium transition-colors">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">{currentLanguage.flag}</span>
                                {currentLanguage.name}
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
                                  detectedLanguage === lang.code && 'bg-accent'
                                )}
                              >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {detectedLanguage === lang.code && (
                                  <Check className="w-4 h-4 ml-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Voice Selection (Male/Female) */}
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Volume2 className="w-4 h-4 text-primary" />
                          {t('tools.tts.voiceLabel')}
                        </label>
                        <div className="flex gap-2 h-11">
                          <button
                            onClick={() => handleGenderSelect('female')}
                            disabled={!femaleVoice}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all',
                              selectedGender === 'female'
                                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                              !femaleVoice && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="8" r="5" />
                              <path d="M12 13v8M9 21h6" />
                            </svg>
                            {uiLanguage === 'th' ? 'หญิง' : 'Female'}
                          </button>
                          <button
                            onClick={() => handleGenderSelect('male')}
                            disabled={!maleVoice}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all',
                              selectedGender === 'male'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground',
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
                    </div>

                    {/* Speed Selection */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Gauge className="w-4 h-4 text-primary" />
                        {t('tools.tts.speedLabel')}
                      </label>
                      <div className="flex gap-1">
                        {rateOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setRate(option.value)}
                            className={cn(
                              'flex-1 h-10 rounded-md text-sm font-medium transition-colors',
                              rate === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {/* Play/Pause Button */}
                    {isPlaying ? (
                      <Button
                        size="lg"
                        onClick={handlePause}
                        className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600"
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        {t('tools.tts.pause')}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handlePlay}
                        disabled={!text.trim()}
                        className="flex-1 sm:flex-none bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        {isPaused ? t('tools.tts.resume') : t('tools.tts.play')}
                      </Button>
                    )}

                    {/* Stop Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleStop}
                      disabled={!isPlaying && !isPaused}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      {t('tools.tts.stop')}
                    </Button>

                    {/* Copy Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleCopy}
                      disabled={!text}
                    >
                      {copied ? (
                        <Check className="w-5 h-5 mr-2 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 mr-2" />
                      )}
                      {copied ? t('tools.tts.copied') : t('tools.tts.copy')}
                    </Button>

                    {/* Clear Button */}
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={handleClear}
                      disabled={!text}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      {t('tools.tts.clear')}
                    </Button>
                  </div>

                  </CardContent>
              </Card>

              {/* Features */}
              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: Sparkles,
                    title: t('tools.tts.features.free.title'),
                    description: t('tools.tts.features.free.description'),
                  },
                  {
                    icon: Languages,
                    title: t('tools.tts.features.multilang.title'),
                    description: t('tools.tts.features.multilang.description'),
                  },
                  {
                    icon: Gauge,
                    title: t('tools.tts.features.speed.title'),
                    description: t('tools.tts.features.speed.description'),
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <feature.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

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
                    animate={{
                      height: ['8px', '20px', '8px'],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-primary">
                {t('tools.tts.playing')}
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
                {t('tools.tts.paused')}
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
    </DefaultLayout>
  )
}
