import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ImageIcon,
  List,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { ConfirmModal } from '../../components/ui/confirm-modal'
import { ImageInput } from '../../components/ui/image-input'
import { Input, Textarea } from '../../components/ui/input'
import { RichTextEditor } from '../../components/ui/rich-text-editor'
import { cn } from '../../lib/utils'
import { getCreationByIdForEdit, updateQuest } from '../../server/creations'
import { deleteImage } from '../../server/storage'
import { useAuthStore } from '../../stores/auth-store'
import { supabase } from '../../lib/supabase'
import { useCreationStore } from '../../stores/creation-store'
import type {
  GeneratedMultipleChoiceQuiz,
  GeneratedQuiz,
  GeneratedSubjectiveQuiz,
} from '../../types/database'

export const Route = createFileRoute('/creation/edit/$id')({
  component: CreationEditPage,
})

function CreationEditPage() {
  const navigate = useNavigate()
  const { id: creationId } = Route.useParams()
  const {
    currentCreation,
    setCreation,
    themeConfig,
    setThemeConfig,
    rawContent,
  } = useCreationStore()
  const { session } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(0)
  const [loadedCreationId, setLoadedCreationId] = useState<string | null>(null)

  // Local state for editing
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [originalThumbnail, setOriginalThumbnail] = useState('') // Track original for deletion
  const [tags, setTags] = useState<Array<string>>([])
  const [tagInput, setTagInput] = useState('')
  const [quizzes, setQuizzes] = useState<Array<GeneratedQuiz>>([])
  const [deleteQuizIndex, setDeleteQuizIndex] = useState<number | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)

  // Load creation from database
  useEffect(() => {
    const loadCreation = async () => {
      if (!creationId || loadedCreationId === creationId) return

      // Get session directly from supabase (handles cookies/localStorage)
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession?.access_token) {
        toast.error('Please login to edit')
        navigate({ to: '/login' })
        return
      }

      setIsLoading(true)
      try {
        const data = await getCreationByIdForEdit({
          data: { creationId, accessToken: currentSession.access_token },
        })
        if (data) {
          const quest = data.generatedQuest
          setCreation(quest, data.creation.raw_content)
          setThemeConfig(data.themeConfig)
          setLoadedCreationId(creationId)

          // Update local state
          setTitle(quest.title)
          setDescription(quest.description || '')
          setThumbnail(quest.thumbnail || '')
          setOriginalThumbnail(quest.thumbnail || '') // Store original for later comparison
          setTags(quest.tags || [])

          let loadedQuizzes: GeneratedQuiz[]
          if (quest.type === 'quiz') {
            loadedQuizzes = [...quest.quizzes]
          } else {
            loadedQuizzes = quest.stages.flatMap((stage) => stage.quizzes)
          }
          setQuizzes(loadedQuizzes)
          // Calculate total points from loaded quizzes
          const total = loadedQuizzes.reduce((sum, q) => sum + (q.points ?? 100), 0)
          setTotalPoints(total)
        }
      } catch (error) {
        toast.error('Failed to load creation')
        navigate({ to: '/creation/me' })
      } finally {
        setIsLoading(false)
      }
    }

    loadCreation()
  }, [
    creationId,
    loadedCreationId,
    setCreation,
    setThemeConfig,
    navigate,
  ])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentCreation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Creation Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This creation doesn't exist or you don't have access
            </p>
            <Button onClick={() => navigate({ to: '/creation/me' })}>
              <ArrowLeft className="w-4 h-4" />
              Back to My Creations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSmartQuiz = currentCreation.type === 'quiz'

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const redistributePoints = () => {
    if (quizzes.length === 0 || totalPoints < 0) return
    // Distribute points evenly across all quizzes
    const pointsPerQuiz = Math.floor(totalPoints / quizzes.length)
    const remainder = totalPoints % quizzes.length
    setQuizzes((prev) =>
      prev.map((q, i) => ({
        ...q,
        // Add remainder to last question
        points: pointsPerQuiz + (i === prev.length - 1 ? remainder : 0),
      })) as GeneratedQuiz[],
    )
  }

  const updateQuiz = (index: number, updates: Partial<GeneratedQuiz>) => {
    setQuizzes((prev) => {
      const newQuizzes = prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
      // If points changed, update total
      if ('points' in updates) {
        const newTotal = newQuizzes.reduce((sum, q) => sum + (q.points ?? 100), 0)
        setTotalPoints(newTotal)
      }
      return newQuizzes
    })
  }

  const updateOption = (
    quizIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    setQuizzes((prev) =>
      prev.map((q, i) => {
        if (i !== quizIndex || q.type !== 'multiple_choice') return q
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      }),
    )
  }

  const addOption = (quizIndex: number) => {
    setQuizzes((prev) =>
      prev.map((q, i) => {
        if (i !== quizIndex || q.type !== 'multiple_choice') return q
        return { ...q, options: [...q.options, ''] }
      }),
    )
  }

  const removeOption = (quizIndex: number, optionIndex: number) => {
    setQuizzes((prev) =>
      prev.map((q, i) => {
        if (i !== quizIndex || q.type !== 'multiple_choice') return q
        const newOptions = q.options.filter((_, oi) => oi !== optionIndex)
        // Adjust correct_answer if needed
        let newCorrectAnswer = q.correct_answer
        if (optionIndex === q.correct_answer) {
          newCorrectAnswer = 0
        } else if (optionIndex < q.correct_answer) {
          newCorrectAnswer = q.correct_answer - 1
        }
        return { ...q, options: newOptions, correct_answer: newCorrectAnswer }
      }),
    )
  }

  const setCorrectAnswer = (quizIndex: number, optionIndex: number) => {
    setQuizzes((prev) =>
      prev.map((q, i) => {
        if (i !== quizIndex || q.type !== 'multiple_choice') return q
        return { ...q, correct_answer: optionIndex }
      }),
    )
  }

  const changeQuizType = (index: number, newType: 'multiple_choice' | 'subjective') => {
    setQuizzes((prev) => {
      const newQuizzes = prev.map((q, i) => {
        if (i !== index) return q
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyQ = q as any
        if (newType === 'subjective') {
          // Convert to subjective - keep options/correct_answer as hidden fields
          return {
            type: 'subjective' as const,
            question: q.question,
            explanation: q.explanation,
            points: q.points,
            model_answer: anyQ.model_answer || anyQ._preserved_model_answer || '',
            // Preserve MC data for switching back
            _preserved_options: anyQ.options,
            _preserved_correct_answer: anyQ.correct_answer,
          }
        } else {
          // Convert to multiple choice - restore preserved options if available
          return {
            type: 'multiple_choice' as const,
            question: q.question,
            explanation: q.explanation,
            points: q.points,
            options: anyQ._preserved_options || anyQ.options || ['', '', '', ''],
            correct_answer: anyQ._preserved_correct_answer ?? anyQ.correct_answer ?? 0,
            // Preserve subjective data for switching back
            _preserved_model_answer: anyQ.model_answer,
          }
        }
      })
      return newQuizzes as GeneratedQuiz[]
    })
  }

  const addQuiz = () => {
    const newQuiz: GeneratedMultipleChoiceQuiz = {
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      points: 100,
    }
    setQuizzes((prev) => [...prev, newQuiz])
    setTotalPoints((prev) => prev + 100)
    setExpandedQuiz(quizzes.length)
  }

  const confirmRemoveQuiz = () => {
    if (deleteQuizIndex === null || quizzes.length <= 1) return
    setQuizzes((prev) => prev.filter((_, i) => i !== deleteQuizIndex))
    if (expandedQuiz === deleteQuizIndex) {
      setExpandedQuiz(null)
    } else if (expandedQuiz !== null && expandedQuiz > deleteQuizIndex) {
      setExpandedQuiz(expandedQuiz - 1)
    }
    setDeleteQuizIndex(null)
  }

  const moveQuiz = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= quizzes.length) return

    setQuizzes((prev) => {
      const newQuizzes = [...prev]
      const temp = newQuizzes[index]
      newQuizzes[index] = newQuizzes[newIndex]
      newQuizzes[newIndex] = temp
      return newQuizzes
    })
    setExpandedQuiz(newIndex)
  }

  const validateQuizzes = (): string | null => {
    if (!title.trim()) return 'Title is required'
    if (quizzes.length === 0) return 'At least one question is required'

    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i]
      if (!quiz.question.trim()) return `Question ${i + 1} is empty`

      if (quiz.type === 'multiple_choice') {
        if (quiz.options.length < 2)
          return `Question ${i + 1} needs at least 2 options`
        const emptyOptions = quiz.options.filter((o) => !o.trim())
        if (emptyOptions.length > 0)
          return `Question ${i + 1} has empty options`
        if (
          quiz.correct_answer < 0 ||
          quiz.correct_answer >= quiz.options.length
        ) {
          return `Question ${i + 1} has invalid correct answer`
        }
      } else if (quiz.type === 'subjective') {
        if (!quiz.model_answer?.trim())
          return `Question ${i + 1} needs a model answer`
      }
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validateQuizzes()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSaving(true)

    try {
      // Delete old thumbnail if it changed and was a storage URL
      if (
        originalThumbnail &&
        originalThumbnail !== thumbnail &&
        originalThumbnail.includes('/storage/v1/object/public/thumbnails/')
      ) {
        try {
          await deleteImage({
            data: {
              imageUrl: originalThumbnail,
              accessToken: session!.access_token,
            },
          })
        } catch {
          // Ignore deletion errors, continue with save
        }
      }

      // Update the quest with edited data
      const updatedQuest = isSmartQuiz
        ? { ...currentCreation, title, description, thumbnail, tags, quizzes }
        : { ...currentCreation, title, description, thumbnail, tags }

      setCreation(updatedQuest)

      // Save to database
      await updateQuest({
        data: {
          creationId,
          quest: updatedQuest,
          rawContent: rawContent || '',
          themeConfig,
          accessToken: session!.access_token,
        },
      })

      toast.success('Saved successfully!')
      navigate({ to: '/creation/me' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    navigate({ to: '/creation/me' })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">
                Edit {isSmartQuiz ? 'Quiz' : 'Quest'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleBack}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground mb-2 block">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
            className="text-lg font-semibold"
          />
        </motion.div>

        {/* Description & Thumbnail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-[1fr,280px] gap-6"
        >
          <div className="flex gap-4">
            <div className="w-[263px] relative">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <ImageIcon className="w-4 h-4 inline-block mr-1" />
                Thumbnail
              </label>
              <ImageInput
                value={thumbnail}
                onChange={setThumbnail}
                placeholder="Add a thumbnail image"
                aspectRatio="video"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                <FileText className="w-4 h-4 inline-block mr-1" />
                Description
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add a description..."
              />
            </div>
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Tag className="w-4 h-4 inline-block mr-1" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-secondary/30 min-h-[48px]">
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
              placeholder={
                tags.length === 0 ? 'Add tags (press Enter or comma)' : ''
              }
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter or comma to add a tag. Backspace to remove last tag.
          </p>
        </motion.div>

        {/* Total Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Star className="w-4 h-4 inline-block mr-1" />
            Total Points
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              value={totalPoints || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 0) setTotalPoints(val)
              }}
              className="w-32"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={redistributePoints}
              disabled={quizzes.length === 0}
            >
              Distribute
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Distribute" to evenly split points across all questions.
          </p>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Questions ({quizzes.length})
            </h2>
            <Button variant="secondary" size="sm" onClick={addQuiz}>
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          {quizzes.map((quiz, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card
                className={cn(
                  'transition-all duration-200',
                  expandedQuiz === index ? 'ring-2 ring-primary' : '',
                )}
              >
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedQuiz(expandedQuiz === index ? null : index)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveQuiz(index, 'up')
                        }}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          moveQuiz(index, 'down')
                        }}
                        disabled={index === quizzes.length - 1}
                        className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {quiz.question || 'New Question'}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {quiz.type === 'multiple_choice'
                          ? `${quiz.options.length} options`
                          : 'Subjective'}
                        {quiz.points && ` • ${quiz.points} pts`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteQuizIndex(index)
                        }}
                        disabled={quizzes.length <= 1}
                        className="p-2 hover:bg-destructive/10 rounded-lg text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-muted-foreground transition-transform',
                          expandedQuiz === index ? 'rotate-180' : '',
                        )}
                      />
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {expandedQuiz === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0 space-y-4">
                        {/* Question Type Selector */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Question Type
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => changeQuizType(index, 'multiple_choice')}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                quiz.type !== 'subjective'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                              )}
                            >
                              <List className="w-4 h-4" />
                              Multiple Choice
                            </button>
                            <button
                              type="button"
                              onClick={() => changeQuizType(index, 'subjective')}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                quiz.type === 'subjective'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                              )}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Subjective
                            </button>
                          </div>
                        </div>

                        {/* Question */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Question
                          </label>
                          <Textarea
                            value={quiz.question}
                            onChange={(e) =>
                              updateQuiz(index, { question: e.target.value })
                            }
                            placeholder="Enter your question..."
                            className="min-h-[80px]"
                          />
                        </div>

                        {/* Options (Multiple Choice) */}
                        {quiz.type === 'multiple_choice' && (
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Options (click to set correct answer)
                            </label>
                            <div className="space-y-2">
                              {quiz.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCorrectAnswer(index, optIndex)
                                    }
                                    className={cn(
                                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all',
                                      quiz.correct_answer === optIndex
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                    )}
                                  >
                                    {quiz.correct_answer === optIndex ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      optIndex + 1
                                    )}
                                  </button>
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(
                                        index,
                                        optIndex,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={`Option ${optIndex + 1}`}
                                    className={cn(
                                      'flex-1',
                                      quiz.correct_answer === optIndex &&
                                        'border-emerald-500',
                                    )}
                                  />
                                  <button
                                    onClick={() =>
                                      removeOption(index, optIndex)
                                    }
                                    disabled={quiz.options.length <= 2}
                                    className="p-2 hover:bg-destructive/10 rounded-lg text-destructive disabled:opacity-30"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addOption(index)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4" />
                                Add Option
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Model Answer (Subjective) */}
                        {quiz.type === 'subjective' && (
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Model Answer
                            </label>
                            <Textarea
                              value={quiz.model_answer}
                              onChange={(e) =>
                                updateQuiz(index, {
                                  model_answer: e.target.value,
                                } as Partial<GeneratedSubjectiveQuiz>)
                              }
                              placeholder="Enter the model answer..."
                              className="min-h-[100px]"
                            />
                          </div>
                        )}

                        {/* Explanation */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Explanation
                          </label>
                          <Textarea
                            value={quiz.explanation}
                            onChange={(e) =>
                              updateQuiz(index, { explanation: e.target.value })
                            }
                            placeholder="Explain why the answer is correct..."
                            className="min-h-[80px]"
                          />
                        </div>

                        {/* Points */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            <Star className="w-4 h-4 inline-block mr-1" />
                            Points
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={quiz.points ?? ''}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ''
                                    ? undefined
                                    : parseInt(e.target.value, 10)
                                updateQuiz(index, { points: value })
                              }}
                              placeholder="100"
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">
                              (default: 100)
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* Delete Question Confirm Modal */}
      <ConfirmModal
        open={deleteQuizIndex !== null}
        onOpenChange={(open) => !open && setDeleteQuizIndex(null)}
        title="Delete Question"
        description={`Are you sure you want to delete "${deleteQuizIndex !== null ? quizzes[deleteQuizIndex]?.question || 'this question' : ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmRemoveQuiz}
      />
    </div>
  )
}
