import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '../ui/button'
import { StatusDropdown } from '../ui/status-dropdown'
import type { ActivityStatus } from '../../types/database'

interface UploadHeaderProps {
  title: string
  status: ActivityStatus
  onStatusChange: (status: ActivityStatus) => void
  allowedEmails: string[]
  onAllowedEmailsChange: (emails: string[]) => void
  activityId: string
  isSaving: boolean
  onBack: () => void
  onSave: () => void
}

export function UploadHeader({
  title,
  status,
  onStatusChange,
  allowedEmails,
  onAllowedEmailsChange,
  activityId,
  isSaving,
  onBack,
  onSave,
}: UploadHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Edit {title}
            </h1>
            <StatusDropdown
              value={status}
              onChange={onStatusChange}
              allowedEmails={allowedEmails}
              onAllowedEmailsChange={onAllowedEmailsChange}
              activityId={activityId}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
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
  )
}
