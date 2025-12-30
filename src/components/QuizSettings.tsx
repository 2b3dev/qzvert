import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, Hash, ListOrdered, Tag, Users, X, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

export type QuizMode = 'multiple_choice' | 'subjective'
export type QuizTypeMode = 'auto' | 'custom'
export type QuestMode = 'auto' | 'custom'

export interface QuizSettingsData {
  // Quiz type mode - auto or custom
  quizTypeMode: QuizTypeMode
  // Selected quiz modes when custom
  quizModes: QuizMode[]
  questionCount: number | 'auto'
  // Separate counts for mixed mode
  multipleChoiceCount: number | 'auto'
  subjectiveCount: number | 'auto'
  choiceCount: number
  timerEnabled: boolean
  timerSeconds: number
  // Tags
  tags: string[]
  // Age range
  ageRange: string | 'auto'
  // Easy Explain (Feynman Mode) - Plus/Pro only
  easyExplainEnabled?: boolean
}

export interface QuestSettingsData {
  // Quest mode
  questMode: QuestMode
  stageCount: number | 'auto'
  questionsPerStage: number | 'auto'
  choiceCount: number
  timerEnabled: boolean
  timerSeconds: number
  // Tags
  tags: string[]
  // Age range
  ageRange: string | 'auto'
  // Easy Explain (Feynman Mode) - Plus/Pro only
  easyExplainEnabled?: boolean
}

interface QuizSettingsProps {
  type: 'quiz'
  settings: QuizSettingsData
  onChange: (settings: QuizSettingsData) => void
}

interface QuestSettingsProps {
  type: 'quest'
  settings: QuestSettingsData
  onChange: (settings: QuestSettingsData) => void
}

type Props = QuizSettingsProps | QuestSettingsProps

const questionCountOptions = [5, 10, 15, 20, 25, 30, 50]
const choiceCountOptions = [2, 3, 4, 5]
const stageCountOptions = [3, 4, 5, 6, 7]
const questionsPerStageOptions = [2, 3, 4, 5]
const ageRangeOptions = [
  { value: '3-5', label: 'เด็กเล็ก (3-5)', desc: 'ยังอ่านไม่ออก เรียนรู้จากภาพและการเล่น' },
  { value: '6-9', label: 'ประถมต้น (6-9)', desc: 'อ่านออกแล้ว เข้าใจเหตุผลง่ายๆ' },
  { value: '10-12', label: 'ประถมปลาย (10-12)', desc: 'คิดเชิงตรรกะได้ เข้าใจแนวคิดนามธรรมเบื้องต้น' },
  { value: '13-17', label: 'วัยรุ่น (13-17)', desc: 'คิดเชิงนามธรรมได้ดี วิเคราะห์ซับซ้อนขึ้น' },
  { value: '18+', label: 'ผู้ใหญ่ (18+)', desc: 'ไม่จำกัดความซับซ้อน' },
]

export function QuizSettings(props: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [customMinutes, setCustomMinutes] = useState('')
  const [customQuestionCount, setCustomQuestionCount] = useState('')
  const [customMultipleChoiceCount, setCustomMultipleChoiceCount] = useState('')
  const [customSubjectiveCount, setCustomSubjectiveCount] = useState('')
  const [customChoiceCount, setCustomChoiceCount] = useState('')
  const [showCustomTimer, setShowCustomTimer] = useState(false)
  const [showCustomQuestionCount, setShowCustomQuestionCount] = useState(false)
  const [showCustomMultipleChoiceCount, setShowCustomMultipleChoiceCount] = useState(false)
  const [showCustomSubjectiveCount, setShowCustomSubjectiveCount] = useState(false)
  const [showCustomChoiceCount, setShowCustomChoiceCount] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  const closeDropdowns = () => setOpenDropdown(null)

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdowns()
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Tag handlers
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !props.settings.tags.includes(trimmed)) {
      if (props.type === 'quiz') {
        props.onChange({ ...props.settings, tags: [...props.settings.tags, trimmed] })
      } else {
        props.onChange({ ...props.settings, tags: [...props.settings.tags, trimmed] })
      }
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    if (props.type === 'quiz') {
      props.onChange({ ...props.settings, tags: props.settings.tags.filter(t => t !== tagToRemove) })
    } else {
      props.onChange({ ...props.settings, tags: props.settings.tags.filter(t => t !== tagToRemove) })
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && props.settings.tags.length > 0) {
      removeTag(props.settings.tags[props.settings.tags.length - 1])
    }
  }

  if (props.type === 'quiz') {
    const { settings, onChange } = props

    return (
      <div ref={containerRef} className="space-y-6 p-4 rounded-xl border border-border bg-card/50">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Quiz Settings
        </h3>

        {/* Quiz Type Selection - Auto vs Custom */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Question Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'auto' as QuizTypeMode, label: 'Auto', desc: 'AI decides question types' },
              { value: 'custom' as QuizTypeMode, label: 'Custom', desc: 'Choose your own settings' }
            ].map((option) => {
              const isSelected = settings.quizTypeMode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (option.value === 'auto') {
                      onChange({ ...settings, quizTypeMode: 'auto', quizModes: ['multiple_choice'] })
                    } else {
                      onChange({ ...settings, quizTypeMode: 'custom' })
                    }
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      isSelected ? "border-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{option.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Settings - Only show when Custom mode */}
        {settings.quizTypeMode === 'custom' && (
        <>
          {/* Question Type Checkboxes */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Question Types</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'multiple_choice' as QuizMode, label: 'Multiple Choice', desc: 'Select from options' },
                { value: 'subjective' as QuizMode, label: 'Subjective', desc: 'Write answer' }
              ].map((option) => {
                const isChecked = settings.quizModes.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      let newModes: QuizMode[]
                      if (isChecked) {
                        // Don't allow unchecking if it's the last one
                        if (settings.quizModes.length > 1) {
                          newModes = settings.quizModes.filter(m => m !== option.value)
                        } else {
                          return
                        }
                      } else {
                        newModes = [...settings.quizModes, option.value]
                      }
                      onChange({ ...settings, quizModes: newModes })
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200",
                      isChecked
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center",
                      isChecked ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-sm">{option.label}</span>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {settings.quizModes.length === 2 && (
              <p className="text-xs text-primary">
                You can set the number of questions for each type below
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
          {/* Number of Questions - Single mode (not both) */}
          {settings.quizModes.length === 1 && (
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Hash className="w-4 h-4 inline mr-1" />
                Number of Questions
              </label>
              <button
                type="button"
                onClick={() => toggleDropdown('questionCount')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
              >
                <span className="font-medium">
                  {settings.questionCount === 'auto' ? 'Auto' : `${settings.questionCount} questions`}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  openDropdown === 'questionCount' ? 'rotate-180' : ''
                )} />
              </button>

              <AnimatePresence>
                {openDropdown === 'questionCount' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto"
                  >
                    <button
                      type="button"
                      onClick={() => { onChange({ ...settings, questionCount: 'auto' }); closeDropdowns() }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                        settings.questionCount === 'auto' ? 'bg-primary/10 text-primary' : ''
                      )}
                    >
                      <span className="font-medium">Auto</span>
                      {settings.questionCount === 'auto' && <span className="text-primary">✓</span>}
                    </button>
                    {questionCountOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { onChange({ ...settings, questionCount: count }); setShowCustomQuestionCount(false); closeDropdowns() }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          settings.questionCount === count && !showCustomQuestionCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">{count} questions</span>
                        {settings.questionCount === count && !showCustomQuestionCount && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                    {/* Custom input */}
                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomQuestionCount(true)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          showCustomQuestionCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">Custom...</span>
                        {showCustomQuestionCount && <span className="text-primary">✓</span>}
                      </button>
                      {showCustomQuestionCount && (
                        <div className="px-4 py-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="Enter number"
                            value={customQuestionCount}
                            onChange={(e) => setCustomQuestionCount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(customQuestionCount)
                                if (num > 0 && num <= 100) {
                                  onChange({ ...settings, questionCount: num })
                                  closeDropdowns()
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseInt(customQuestionCount)
                              if (num > 0 && num <= 100) {
                                onChange({ ...settings, questionCount: num })
                                closeDropdowns()
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Multiple Choice Count - Both mode */}
          {settings.quizModes.length === 2 && (
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Hash className="w-4 h-4 inline mr-1" />
                Multiple Choice Questions
              </label>
              <button
                type="button"
                onClick={() => toggleDropdown('multipleChoiceCount')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
              >
                <span className="font-medium">
                  {settings.multipleChoiceCount === 'auto' ? 'Auto' : `${settings.multipleChoiceCount} questions`}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  openDropdown === 'multipleChoiceCount' ? 'rotate-180' : ''
                )} />
              </button>

              <AnimatePresence>
                {openDropdown === 'multipleChoiceCount' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto"
                  >
                    <button
                      type="button"
                      onClick={() => { onChange({ ...settings, multipleChoiceCount: 'auto' }); closeDropdowns() }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                        settings.multipleChoiceCount === 'auto' ? 'bg-primary/10 text-primary' : ''
                      )}
                    >
                      <span className="font-medium">Auto</span>
                      {settings.multipleChoiceCount === 'auto' && <span className="text-primary">✓</span>}
                    </button>
                    {questionCountOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { onChange({ ...settings, multipleChoiceCount: count }); setShowCustomMultipleChoiceCount(false); closeDropdowns() }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          settings.multipleChoiceCount === count && !showCustomMultipleChoiceCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">{count} questions</span>
                        {settings.multipleChoiceCount === count && !showCustomMultipleChoiceCount && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                    {/* Custom input */}
                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomMultipleChoiceCount(true)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          showCustomMultipleChoiceCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">Custom...</span>
                        {showCustomMultipleChoiceCount && <span className="text-primary">✓</span>}
                      </button>
                      {showCustomMultipleChoiceCount && (
                        <div className="px-4 py-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="Enter number"
                            value={customMultipleChoiceCount}
                            onChange={(e) => setCustomMultipleChoiceCount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(customMultipleChoiceCount)
                                if (num > 0 && num <= 100) {
                                  onChange({ ...settings, multipleChoiceCount: num })
                                  closeDropdowns()
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseInt(customMultipleChoiceCount)
                              if (num > 0 && num <= 100) {
                                onChange({ ...settings, multipleChoiceCount: num })
                                closeDropdowns()
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Subjective Count - Both mode */}
          {settings.quizModes.length === 2 && (
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Hash className="w-4 h-4 inline mr-1" />
                Subjective Questions
              </label>
              <button
                type="button"
                onClick={() => toggleDropdown('subjectiveCount')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
              >
                <span className="font-medium">
                  {settings.subjectiveCount === 'auto' ? 'Auto' : `${settings.subjectiveCount} questions`}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  openDropdown === 'subjectiveCount' ? 'rotate-180' : ''
                )} />
              </button>

              <AnimatePresence>
                {openDropdown === 'subjectiveCount' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto"
                  >
                    <button
                      type="button"
                      onClick={() => { onChange({ ...settings, subjectiveCount: 'auto' }); closeDropdowns() }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                        settings.subjectiveCount === 'auto' ? 'bg-primary/10 text-primary' : ''
                      )}
                    >
                      <span className="font-medium">Auto</span>
                      {settings.subjectiveCount === 'auto' && <span className="text-primary">✓</span>}
                    </button>
                    {questionCountOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { onChange({ ...settings, subjectiveCount: count }); setShowCustomSubjectiveCount(false); closeDropdowns() }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          settings.subjectiveCount === count && !showCustomSubjectiveCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">{count} questions</span>
                        {settings.subjectiveCount === count && !showCustomSubjectiveCount && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                    {/* Custom input */}
                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomSubjectiveCount(true)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          showCustomSubjectiveCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">Custom...</span>
                        {showCustomSubjectiveCount && <span className="text-primary">✓</span>}
                      </button>
                      {showCustomSubjectiveCount && (
                        <div className="px-4 py-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="Enter number"
                            value={customSubjectiveCount}
                            onChange={(e) => setCustomSubjectiveCount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(customSubjectiveCount)
                                if (num > 0 && num <= 100) {
                                  onChange({ ...settings, subjectiveCount: num })
                                  closeDropdowns()
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseInt(customSubjectiveCount)
                              if (num > 0 && num <= 100) {
                                onChange({ ...settings, subjectiveCount: num })
                                closeDropdowns()
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Activity Time Limit */}
          <div className="relative">
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Clock className="w-4 h-4 inline mr-1" />
              Activity Time Limit
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown('timer')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
            >
              <span className="font-medium">
                {settings.timerEnabled
                  ? settings.timerSeconds >= 60
                    ? `${Math.floor(settings.timerSeconds / 60)} min`
                    : `${settings.timerSeconds} sec`
                  : 'No limit'}
              </span>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                openDropdown === 'timer' ? 'rotate-180' : ''
              )} />
            </button>

            <AnimatePresence>
              {openDropdown === 'timer' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-72 overflow-y-auto"
                >
                  <button
                    type="button"
                    onClick={() => { onChange({ ...settings, timerEnabled: false }); setShowCustomTimer(false); closeDropdowns() }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                      !settings.timerEnabled ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    <span className="font-medium">No limit</span>
                    {!settings.timerEnabled && <span className="text-primary">✓</span>}
                  </button>
                  {[1, 2, 3, 5, 10, 15, 20, 30, 45, 60].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => {
                        onChange({ ...settings, timerEnabled: true, timerSeconds: minutes * 60 })
                        setShowCustomTimer(false)
                        closeDropdowns()
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                        settings.timerEnabled && settings.timerSeconds === minutes * 60 && !showCustomTimer ? 'bg-primary/10 text-primary' : ''
                      )}
                    >
                      <span className="font-medium">{minutes} {minutes === 1 ? 'minute' : 'minutes'}</span>
                      {settings.timerEnabled && settings.timerSeconds === minutes * 60 && !showCustomTimer && <span className="text-primary">✓</span>}
                    </button>
                  ))}
                  {/* Custom input option */}
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowCustomTimer(true)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                        showCustomTimer ? 'bg-primary/10 text-primary' : ''
                      )}
                    >
                      <span className="font-medium">Custom...</span>
                      {showCustomTimer && <span className="text-primary">✓</span>}
                    </button>
                    {showCustomTimer && (
                      <div className="px-4 py-3 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          placeholder="Enter minutes"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const mins = parseInt(customMinutes)
                              if (mins > 0 && mins <= 180) {
                                onChange({ ...settings, timerEnabled: true, timerSeconds: mins * 60 })
                                closeDropdowns()
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                          autoFocus
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                        <button
                          type="button"
                          onClick={() => {
                            const mins = parseInt(customMinutes)
                            if (mins > 0 && mins <= 180) {
                              onChange({ ...settings, timerEnabled: true, timerSeconds: mins * 60 })
                              closeDropdowns()
                            }
                          }}
                          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                        >
                          Set
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Multiple Choice Options - Show if multiple choice is selected */}
          {settings.quizModes.includes('multiple_choice') && (
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <ListOrdered className="w-4 h-4 inline mr-1" />
                Multiple Choice Options
              </label>
              <button
                type="button"
                onClick={() => toggleDropdown('choiceCount')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
              >
                <span className="font-medium">{settings.choiceCount} choices</span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  openDropdown === 'choiceCount' ? 'rotate-180' : ''
                )} />
              </button>

              <AnimatePresence>
                {openDropdown === 'choiceCount' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                  >
                    {choiceCountOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { onChange({ ...settings, choiceCount: count }); setShowCustomChoiceCount(false); closeDropdowns() }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          settings.choiceCount === count && !showCustomChoiceCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">{count} choices</span>
                        {settings.choiceCount === count && !showCustomChoiceCount && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                    {/* Custom input */}
                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowCustomChoiceCount(true)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          showCustomChoiceCount ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">Custom...</span>
                        {showCustomChoiceCount && <span className="text-primary">✓</span>}
                      </button>
                      {showCustomChoiceCount && (
                        <div className="px-4 py-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="2"
                            max="10"
                            placeholder="2-10"
                            value={customChoiceCount}
                            onChange={(e) => setCustomChoiceCount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(customChoiceCount)
                                if (num >= 2 && num <= 10) {
                                  onChange({ ...settings, choiceCount: num })
                                  closeDropdowns()
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseInt(customChoiceCount)
                              if (num >= 2 && num <= 10) {
                                onChange({ ...settings, choiceCount: num })
                                closeDropdowns()
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Age Range */}
          <div className="relative">
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Users className="w-4 h-4 inline mr-1" />
              Age Range
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown('ageRange')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
            >
              <span className="font-medium">
                {settings.ageRange === 'auto' ? 'Auto' : ageRangeOptions.find(a => a.value === settings.ageRange)?.label || settings.ageRange}
              </span>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                openDropdown === 'ageRange' ? 'rotate-180' : ''
              )} />
            </button>

            <AnimatePresence>
              {openDropdown === 'ageRange' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-80 overflow-y-auto"
                >
                  <button
                    type="button"
                    onClick={() => { onChange({ ...settings, ageRange: 'auto' }); closeDropdowns() }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                      settings.ageRange === 'auto' ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    <span className="font-medium">Auto</span>
                    {settings.ageRange === 'auto' && <span className="text-primary">✓</span>}
                  </button>
                  {ageRangeOptions.map((age) => (
                    <button
                      key={age.value}
                      type="button"
                      onClick={() => { onChange({ ...settings, ageRange: age.value }); closeDropdowns() }}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                        settings.ageRange === age.value ? 'bg-primary/10 text-primary' : ''
                      )}
                    >
                      <div className="flex-1">
                        <span className="font-medium">{age.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{age.desc}</p>
                      </div>
                      {settings.ageRange === age.value && <span className="text-primary">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
              <span className="text-xs text-muted-foreground ml-2">(optional - AI will generate if empty)</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-border bg-secondary/50 min-h-[48px]">
              {settings.tags.map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-primary/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={settings.tags.length === 0 ? "Add tags (Enter or comma)" : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

        </>
        )}
      </div>
    )
  }

  // Quest Settings
  const { settings, onChange } = props

  return (
    <div ref={containerRef} className="space-y-6 p-4 rounded-xl border border-border bg-card/50">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Quest Settings
      </h3>

      {/* Quest Mode Selection - Radio */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Quest Structure</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'auto', label: 'Auto', desc: 'AI decides stages & questions' },
            { value: 'custom', label: 'Custom', desc: 'Set your own structure' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...settings, questMode: option.value as QuestMode })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                settings.questMode === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  settings.questMode === option.value ? "border-primary" : "border-muted-foreground"
                )}>
                  {settings.questMode === option.value && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Settings - Only show when custom mode */}
      <AnimatePresence>
        {settings.questMode === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Number of Stages */}
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Number of Stages
              </label>
              <button
                type="button"
                onClick={() => toggleDropdown('stageCount')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
              >
                <span className="font-medium">
                  {settings.stageCount === 'auto' ? 'Auto' : `${settings.stageCount} stages`}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  openDropdown === 'stageCount' ? 'rotate-180' : ''
                )} />
              </button>

              <AnimatePresence>
                {openDropdown === 'stageCount' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                  >
                    {stageCountOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { onChange({ ...settings, stageCount: count }); closeDropdowns() }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          settings.stageCount === count ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">{count} stages</span>
                        {settings.stageCount === count && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Questions per Stage */}
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Questions per Stage
              </label>
              <button
                type="button"
                onClick={() => toggleDropdown('questionsPerStage')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
              >
                <span className="font-medium">
                  {settings.questionsPerStage === 'auto' ? 'Auto' : `${settings.questionsPerStage} questions`}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  openDropdown === 'questionsPerStage' ? 'rotate-180' : ''
                )} />
              </button>

              <AnimatePresence>
                {openDropdown === 'questionsPerStage' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                  >
                    {questionsPerStageOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => { onChange({ ...settings, questionsPerStage: count }); closeDropdowns() }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                          settings.questionsPerStage === count ? 'bg-primary/10 text-primary' : ''
                        )}
                      >
                        <span className="font-medium">{count} questions</span>
                        {settings.questionsPerStage === count && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Common Settings */}
      <div className="grid grid-cols-2 gap-4">
        {/* Number of Choices */}
        <div className="relative">
          <label className="text-sm font-medium text-foreground mb-2 block">
            <ListOrdered className="w-4 h-4 inline mr-1" />
            Choices per Question
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('choiceCount')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
          >
            <span className="font-medium">{settings.choiceCount} choices</span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              openDropdown === 'choiceCount' ? 'rotate-180' : ''
            )} />
          </button>

          <AnimatePresence>
            {openDropdown === 'choiceCount' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
              >
                {choiceCountOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => { onChange({ ...settings, choiceCount: count }); closeDropdowns() }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                      settings.choiceCount === count ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    <span className="font-medium">{count} choices</span>
                    {settings.choiceCount === count && <span className="text-primary">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time Limit */}
        <div className="relative">
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Clock className="w-4 h-4 inline mr-1" />
            Time Limit
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('timer')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
          >
            <span className="font-medium">
              {settings.timerEnabled
                ? settings.timerSeconds >= 60
                  ? `${Math.floor(settings.timerSeconds / 60)} min`
                  : `${settings.timerSeconds} sec`
                : 'No limit'}
            </span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              openDropdown === 'timer' ? 'rotate-180' : ''
            )} />
          </button>

          <AnimatePresence>
            {openDropdown === 'timer' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-72 overflow-y-auto"
              >
                <button
                  type="button"
                  onClick={() => { onChange({ ...settings, timerEnabled: false }); setShowCustomTimer(false); closeDropdowns() }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                    !settings.timerEnabled ? 'bg-primary/10 text-primary' : ''
                  )}
                >
                  <span className="font-medium">No limit</span>
                  {!settings.timerEnabled && <span className="text-primary">✓</span>}
                </button>
                {[1, 2, 3, 5, 10, 15, 20, 30, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => {
                      onChange({ ...settings, timerEnabled: true, timerSeconds: minutes * 60 })
                      setShowCustomTimer(false)
                      closeDropdowns()
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                      settings.timerEnabled && settings.timerSeconds === minutes * 60 && !showCustomTimer ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    <span className="font-medium">{minutes} {minutes === 1 ? 'minute' : 'minutes'}</span>
                    {settings.timerEnabled && settings.timerSeconds === minutes * 60 && !showCustomTimer && <span className="text-primary">✓</span>}
                  </button>
                ))}
                {/* Custom input option */}
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCustomTimer(true)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                      showCustomTimer ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    <span className="font-medium">Custom...</span>
                    {showCustomTimer && <span className="text-primary">✓</span>}
                  </button>
                  {showCustomTimer && (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        placeholder="Enter minutes"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const mins = parseInt(customMinutes)
                            if (mins > 0 && mins <= 180) {
                              onChange({ ...settings, timerEnabled: true, timerSeconds: mins * 60 })
                              closeDropdowns()
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                      <button
                        type="button"
                        onClick={() => {
                          const mins = parseInt(customMinutes)
                          if (mins > 0 && mins <= 180) {
                            onChange({ ...settings, timerEnabled: true, timerSeconds: mins * 60 })
                            closeDropdowns()
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Age Range */}
        <div className="relative col-span-2 sm:col-span-1">
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Users className="w-4 h-4 inline mr-1" />
            Age Range
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('ageRange')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-secondary/50 hover:border-muted-foreground transition-all duration-200"
          >
            <span className="font-medium">
              {settings.ageRange === 'auto' ? 'Auto' : ageRangeOptions.find(a => a.value === settings.ageRange)?.label || settings.ageRange}
            </span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              openDropdown === 'ageRange' ? 'rotate-180' : ''
            )} />
          </button>

          <AnimatePresence>
            {openDropdown === 'ageRange' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-80 overflow-y-auto"
              >
                <button
                  type="button"
                  onClick={() => { onChange({ ...settings, ageRange: 'auto' }); closeDropdowns() }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                    settings.ageRange === 'auto' ? 'bg-primary/10 text-primary' : ''
                  )}
                >
                  <span className="font-medium">Auto</span>
                  {settings.ageRange === 'auto' && <span className="text-primary">✓</span>}
                </button>
                {ageRangeOptions.map((age) => (
                  <button
                    key={age.value}
                    type="button"
                    onClick={() => { onChange({ ...settings, ageRange: age.value }); closeDropdowns() }}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                      settings.ageRange === age.value ? 'bg-primary/10 text-primary' : ''
                    )}
                  >
                    <div className="flex-1">
                      <span className="font-medium">{age.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{age.desc}</p>
                    </div>
                    {settings.ageRange === age.value && <span className="text-primary">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          <Tag className="w-4 h-4 inline mr-1" />
          Tags
          <span className="text-xs text-muted-foreground ml-2">(optional - AI will generate if empty)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border-2 border-border bg-secondary/50 min-h-[48px]">
          {settings.tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-primary/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={settings.tags.length === 0 ? "Add tags (Enter or comma)" : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

    </div>
  )
}
