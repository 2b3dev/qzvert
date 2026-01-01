import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import {
  UploadHeader,
  BasicInfoSection,
  PlaySettingsSection,
  TotalPointsSection,
  QuestionsEditor,
} from '../../../components/upload'
import {
  getActivityByIdForEdit,
  getAllowedEmails,
  saveQuest,
  updateActivitySettings,
  updateAllowedEmails,
  updateQuest,
} from '../../../server/activities'
import { deleteImage, uploadImage } from '../../../server/storage'
import { useActivityStore } from '../../../stores/activity-store'
import type {
  ActivityStatus,
  GeneratedQuiz,
  GeneratedSmartQuiz,
} from '../../../types/database'

export const Route = createFileRoute('/activity/upload/quiz/$id')({
  component: QuizUploadPage,
})

function QuizUploadPage() {
  const navigate = useNavigate()
  const { id: activityId } = Route.useParams()
  const isNewActivity = activityId === 'new'
  const {
    currentActivity,
    setActivity,
    themeConfig,
    setThemeConfig,
    rawContent,
    timeLimitMinutes: storeTimeLimitMinutes,
    ageRange: storeAgeRange,
  } = useActivityStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(0)
  const [loadedActivityId, setLoadedActivityId] = useState<string | null>(null)

  // Local state for editing
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [originalThumbnail, setOriginalThumbnail] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [quizzes, setQuizzes] = useState<GeneratedQuiz[]>([])
  const [deleteQuizIndex, setDeleteQuizIndex] = useState<number | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [status, setStatus] = useState<ActivityStatus>('draft')
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])

  // Play settings
  const [replayLimit, setReplayLimit] = useState<number | null>(null)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [availableFrom, setAvailableFrom] = useState<string>('')
  const [availableUntil, setAvailableUntil] = useState<string>('')
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  // Load activity
  useEffect(() => {
    const loadActivity = async () => {
      if (!activityId || loadedActivityId === activityId) return

      if (isNewActivity) {
        if (currentActivity && currentActivity.type === 'quiz') {
          setTitle(currentActivity.title)
          setDescription(currentActivity.description || '')
          setThumbnail(currentActivity.thumbnail || '')
          setTags(currentActivity.tags || [])
          setQuizzes([...currentActivity.quizzes])
          const total = currentActivity.quizzes.reduce(
            (sum, q) => sum + (q.points ?? 100),
            0,
          )
          setTotalPoints(total)
          setLoadedActivityId(activityId)
          setTimeLimitMinutes(storeTimeLimitMinutes)
          setAgeRange(storeAgeRange)
        }
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await getActivityByIdForEdit({ data: { activityId } })
        if (data && data.generatedQuest.type === 'quiz') {
          const quest = data.generatedQuest as GeneratedSmartQuiz
          setActivity(quest, data.activity.raw_content)
          setThemeConfig(data.themeConfig)
          setLoadedActivityId(activityId)

          setTitle(quest.title)
          setDescription(quest.description || '')
          setThumbnail(quest.thumbnail || '')
          setOriginalThumbnail(quest.thumbnail || '')
          setTags(quest.tags || [])
          setQuizzes([...quest.quizzes])
          const total = quest.quizzes.reduce(
            (sum, q) => sum + (q.points ?? 100),
            0,
          )
          setTotalPoints(total)

          const activityStatus = (data.activity as { status?: ActivityStatus }).status
          setStatus(activityStatus || 'draft')

          const activityData = data.activity as {
            replay_limit?: number | null
            time_limit_minutes?: number | null
            available_from?: string | null
            available_until?: string | null
            age_range?: string | null
            category_id?: string | null
          }
          setReplayLimit(activityData.replay_limit ?? null)
          setTimeLimitMinutes(activityData.time_limit_minutes ?? null)
          setAvailableFrom(activityData.available_from || '')
          setAvailableUntil(activityData.available_until || '')
          setAgeRange(activityData.age_range ?? null)
          setCategoryId(activityData.category_id ?? null)

          if (activityStatus === 'private_group') {
            try {
              const emails = await getAllowedEmails({ data: { activityId } })
              setAllowedEmails(emails)
            } catch {
              // Ignore
            }
          }
        }
      } catch (error) {
        toast.error('Failed to load activity')
        navigate({ to: '/activity/me' })
      } finally {
        setIsLoading(false)
      }
    }

    loadActivity()
  }, [activityId, loadedActivityId, isNewActivity, currentActivity, storeTimeLimitMinutes, storeAgeRange, setActivity, setThemeConfig, navigate])

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

  if (!currentActivity || currentActivity.type !== 'quiz') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Quiz Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This quiz doesn't exist or you don't have access
            </p>
            <Button onClick={() => navigate({ to: '/activity/me' })}>
              <ArrowLeft className="w-4 h-4" />
              Back to My Activities
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const redistributePoints = () => {
    if (quizzes.length === 0 || totalPoints <= 0) return
    const pointsPerQuiz = Math.floor(totalPoints / quizzes.length)
    const remainder = totalPoints % quizzes.length
    const newQuizzes = quizzes.map((q, i) => ({
      ...q,
      points: pointsPerQuiz + (i === quizzes.length - 1 ? remainder : 0),
    })) as GeneratedQuiz[]
    setQuizzes(newQuizzes)
    const message = remainder > 0
      ? `${pointsPerQuiz} pts each, +${remainder} pts to last question`
      : `${pointsPerQuiz} pts each`
    toast.success(`Distributed: ${message}`)
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
        if (quiz.correct_answer < 0 || quiz.correct_answer >= quiz.options.length) {
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
    if (!title.trim() || title.trim() === 'Untitled') {
      toast.error('Please enter a title for your activity')
      return
    }

    const validationError = validateQuizzes()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSaving(true)

    try {
      let finalThumbnail = thumbnail
      if (thumbnail && thumbnail.startsWith('data:')) {
        try {
          const result = await uploadImage({
            data: {
              base64Data: thumbnail,
              fileName: `thumbnail-${Date.now()}.jpg`,
            },
          })
          finalThumbnail = result.url
          setThumbnail(finalThumbnail)
        } catch (err) {
          toast.error('Failed to upload thumbnail')
          setIsSaving(false)
          return
        }
      }

      const updatedQuest: GeneratedSmartQuiz = {
        ...currentActivity,
        title,
        description,
        thumbnail: finalThumbnail,
        tags,
        quizzes,
      }

      setActivity(updatedQuest)

      if (isNewActivity) {
        const result = await saveQuest({
          data: {
            quest: updatedQuest,
            rawContent: rawContent || '',
            themeConfig,
            categoryId,
          },
        })

        const newActivityId = result.activityId

        if (status !== 'draft' || replayLimit !== null || timeLimitMinutes !== null || availableFrom || availableUntil || ageRange) {
          await updateActivitySettings({
            data: {
              activityId: newActivityId,
              replayLimit,
              timeLimitMinutes,
              availableFrom: availableFrom || null,
              availableUntil: availableUntil || null,
              ageRange,
            },
          })
        }

        if (status !== 'draft') {
          await updateQuest({
            data: {
              activityId: newActivityId,
              quest: updatedQuest,
              rawContent: rawContent || '',
              themeConfig,
              status,
              categoryId,
            },
          })
        }

        if (status === 'private_group') {
          await updateAllowedEmails({
            data: {
              activityId: newActivityId,
              emails: allowedEmails,
            },
          })
        }

        toast.success('Quiz created successfully!')
      } else {
        if (
          originalThumbnail &&
          originalThumbnail !== thumbnail &&
          originalThumbnail.includes('/storage/v1/object/public/thumbnails/')
        ) {
          try {
            await deleteImage({ data: { imageUrl: originalThumbnail } })
          } catch {
            // Ignore
          }
        }

        await updateQuest({
          data: {
            activityId,
            quest: updatedQuest,
            rawContent: rawContent || '',
            themeConfig,
            status,
            categoryId,
          },
        })

        if (status === 'private_group') {
          await updateAllowedEmails({
            data: {
              activityId,
              emails: allowedEmails,
            },
          })
        }

        await updateActivitySettings({
          data: {
            activityId,
            replayLimit,
            timeLimitMinutes,
            availableFrom: availableFrom || null,
            availableUntil: availableUntil || null,
            ageRange,
          },
        })

        toast.success('Saved successfully!')
      }

      navigate({ to: '/activity/me' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    navigate({ to: '/activity/me' })
  }

  return (
    <div className="min-h-screen bg-background">
      <UploadHeader
        title="Quiz"
        status={status}
        onStatusChange={setStatus}
        allowedEmails={allowedEmails}
        onAllowedEmailsChange={setAllowedEmails}
        activityId={activityId}
        isSaving={isSaving}
        onBack={handleBack}
        onSave={handleSave}
      />

      <div className="max-w-4xl mx-auto py-8 px-6">
        <BasicInfoSection
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          thumbnail={thumbnail}
          setThumbnail={setThumbnail}
          tags={tags}
          setTags={setTags}
          tagInput={tagInput}
          setTagInput={setTagInput}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
        />

        <TotalPointsSection
          totalPoints={totalPoints}
          setTotalPoints={setTotalPoints}
          onRedistribute={redistributePoints}
          disabled={quizzes.length === 0}
        />

        <PlaySettingsSection
          replayLimit={replayLimit}
          setReplayLimit={setReplayLimit}
          timeLimitMinutes={timeLimitMinutes}
          setTimeLimitMinutes={setTimeLimitMinutes}
          availableFrom={availableFrom}
          setAvailableFrom={setAvailableFrom}
          availableUntil={availableUntil}
          setAvailableUntil={setAvailableUntil}
          ageRange={ageRange}
          setAgeRange={setAgeRange}
        />

        <QuestionsEditor
          quizzes={quizzes}
          setQuizzes={setQuizzes}
          expandedQuiz={expandedQuiz}
          setExpandedQuiz={setExpandedQuiz}
          setDeleteQuizIndex={setDeleteQuizIndex}
          setTotalPoints={setTotalPoints}
        />
      </div>

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
