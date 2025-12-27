import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import {
  UploadHeader,
  BasicInfoSection,
  PlaySettingsSection,
  LessonModulesEditor,
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
  GeneratedLesson,
} from '../../../types/database'

export const Route = createFileRoute('/activity/upload/lesson/$id')({
  component: LessonUploadPage,
})

function LessonUploadPage() {
  const navigate = useNavigate()
  const { id: activityId } = Route.useParams()
  const isNewActivity = activityId === 'new'
  const {
    currentActivity,
    setActivity,
    themeConfig,
    setThemeConfig,
    rawContent,
    ageRange: storeAgeRange,
  } = useActivityStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedModule, setExpandedModule] = useState<number | null>(0)
  const [loadedActivityId, setLoadedActivityId] = useState<string | null>(null)

  // Local state for editing
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [originalThumbnail, setOriginalThumbnail] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [lessonModules, setLessonModules] = useState<GeneratedLesson['modules']>([])
  const [status, setStatus] = useState<ActivityStatus>('draft')
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])

  // Play settings
  const [replayLimit, setReplayLimit] = useState<number | null>(null)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [availableFrom, setAvailableFrom] = useState<string>('')
  const [availableUntil, setAvailableUntil] = useState<string>('')
  const [ageRange, setAgeRange] = useState<string | null>(null)

  // Load activity
  useEffect(() => {
    const loadActivity = async () => {
      if (!activityId || loadedActivityId === activityId) return

      if (isNewActivity) {
        if (currentActivity && currentActivity.type === 'lesson') {
          setTitle(currentActivity.title)
          setDescription(currentActivity.description || '')
          setThumbnail(currentActivity.thumbnail || '')
          setTags(currentActivity.tags || [])
          setLessonModules([...currentActivity.modules])
          setLoadedActivityId(activityId)
          setAgeRange(storeAgeRange)
        }
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await getActivityByIdForEdit({ data: { activityId } })
        if (data && data.generatedQuest.type === 'lesson') {
          const quest = data.generatedQuest as GeneratedLesson
          setActivity(quest, data.activity.raw_content)
          setThemeConfig(data.themeConfig)
          setLoadedActivityId(activityId)

          setTitle(quest.title)
          setDescription(quest.description || '')
          setThumbnail(quest.thumbnail || '')
          setOriginalThumbnail(quest.thumbnail || '')
          setTags(quest.tags || [])
          setLessonModules([...quest.modules])

          const activityStatus = (data.activity as { status?: ActivityStatus }).status
          setStatus(activityStatus || 'draft')

          const activityData = data.activity as {
            replay_limit?: number | null
            time_limit_minutes?: number | null
            available_from?: string | null
            available_until?: string | null
            age_range?: string | null
          }
          setReplayLimit(activityData.replay_limit ?? null)
          setTimeLimitMinutes(activityData.time_limit_minutes ?? null)
          setAvailableFrom(activityData.available_from || '')
          setAvailableUntil(activityData.available_until || '')
          setAgeRange(activityData.age_range ?? null)

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
  }, [activityId, loadedActivityId, isNewActivity, currentActivity, storeAgeRange, setActivity, setThemeConfig, navigate])

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

  if (!currentActivity || currentActivity.type !== 'lesson') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Lesson Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              This lesson doesn't exist or you don't have access
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

  const validateLesson = (): string | null => {
    if (!title.trim()) return 'Title is required'
    if (lessonModules.length === 0) return 'At least one module is required'
    for (let i = 0; i < lessonModules.length; i++) {
      if (!lessonModules[i].title.trim()) {
        return `Module ${i + 1} needs a title`
      }
    }
    return null
  }

  const handleSave = async () => {
    if (!title.trim() || title.trim() === 'Untitled') {
      toast.error('Please enter a title for your lesson')
      return
    }

    const validationError = validateLesson()
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

      const updatedQuest: GeneratedLesson = {
        ...currentActivity,
        title,
        description,
        thumbnail: finalThumbnail,
        tags,
        modules: lessonModules,
      }

      setActivity(updatedQuest)

      if (isNewActivity) {
        const result = await saveQuest({
          data: {
            quest: updatedQuest,
            rawContent: rawContent || '',
            themeConfig,
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

        toast.success('Lesson created successfully!')
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
        title="Lesson"
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

        <LessonModulesEditor
          lessonModules={lessonModules}
          setLessonModules={setLessonModules}
          expandedModule={expandedModule}
          setExpandedModule={setExpandedModule}
        />
      </div>
    </div>
  )
}
