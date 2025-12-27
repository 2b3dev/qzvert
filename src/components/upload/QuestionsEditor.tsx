import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ChevronUp,
  List,
  MessageSquare,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input, Textarea } from '../ui/input'
import { cn } from '../../lib/utils'
import type {
  GeneratedMultipleChoiceQuiz,
  GeneratedQuiz,
  GeneratedSubjectiveQuiz,
} from '../../types/database'

interface QuestionsEditorProps {
  quizzes: GeneratedQuiz[]
  setQuizzes: React.Dispatch<React.SetStateAction<GeneratedQuiz[]>>
  expandedQuiz: number | null
  setExpandedQuiz: (index: number | null) => void
  setDeleteQuizIndex: (index: number | null) => void
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>
}

export function QuestionsEditor({
  quizzes,
  setQuizzes,
  expandedQuiz,
  setExpandedQuiz,
  setDeleteQuizIndex,
  setTotalPoints,
}: QuestionsEditorProps) {
  const updateQuiz = (index: number, updates: Partial<GeneratedQuiz>) => {
    setQuizzes((prev) => {
      const newQuizzes = prev.map((q, i) =>
        i === index ? { ...q, ...updates } : q,
      )
      // If points changed, update total
      if ('points' in updates) {
        const newTotal = newQuizzes.reduce(
          (sum, q) => sum + (q.points ?? 100),
          0,
        )
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

  const changeQuizType = (
    index: number,
    newType: 'multiple_choice' | 'subjective',
  ) => {
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
            model_answer:
              anyQ.model_answer || anyQ._preserved_model_answer || '',
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
            options: anyQ._preserved_options ||
              anyQ.options || ['', '', '', ''],
            correct_answer:
              anyQ._preserved_correct_answer ?? anyQ.correct_answer ?? 0,
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

  return (
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
                          onClick={() =>
                            changeQuizType(index, 'multiple_choice')
                          }
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
                          onClick={() =>
                            changeQuizType(index, 'subjective')
                          }
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
  )
}
