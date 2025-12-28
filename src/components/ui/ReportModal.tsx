import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, AlertTriangle, Shield, Ban, FileWarning, Loader2 } from 'lucide-react'
import { Button } from './button'
import { cn } from '../../lib/utils'
import { submitReport, type ReportReason, type ContentType } from '../../server/reports'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  activityTitle?: string
  onReported?: () => void
}

const reportReasons: Array<{
  value: ReportReason
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Contains adult, violent, or offensive material',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    value: 'spam',
    label: 'Spam or Misleading',
    description: 'Repetitive content, clickbait, or scam',
    icon: <Ban className="w-5 h-5" />,
  },
  {
    value: 'copyright',
    label: 'Copyright Violation',
    description: 'Uses copyrighted material without permission',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    value: 'misinformation',
    label: 'Misinformation',
    description: 'Contains false or misleading information',
    icon: <FileWarning className="w-5 h-5" />,
  },
  {
    value: 'harassment',
    label: 'Harassment or Hate',
    description: 'Targets individuals or groups with harmful content',
    icon: <Flag className="w-5 h-5" />,
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
]

export function ReportModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  onReported,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) return

    setSubmitting(true)

    try {
      await submitReport({
        data: {
          contentType: 'activity',
          contentId: activityId,
          reason: selectedReason,
          additionalInfo: additionalInfo || undefined,
        },
      })

      onReported?.()
      handleClose()
    } catch (error) {
      console.error('Failed to submit report:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setAdditionalInfo('')
    setSubmitted(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden mx-4">
              {submitted ? (
                // Success state
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Flag className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Report Submitted
                  </h2>
                  <p className="text-muted-foreground">
                    Thank you for helping keep our community safe. We'll review this report shortly.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Flag className="w-5 h-5 text-destructive" />
                      <h2 className="text-lg font-semibold text-foreground">Report Activity</h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {activityTitle && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Reporting: <span className="font-medium text-foreground">{activityTitle}</span>
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground mb-4">
                      Why are you reporting this activity?
                    </p>

                    <div className="space-y-2 mb-4">
                      {reportReasons.map((reason) => (
                        <button
                          key={reason.value}
                          onClick={() => setSelectedReason(reason.value)}
                          className={cn(
                            'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                            selectedReason === reason.value
                              ? 'border-destructive bg-destructive/10'
                              : 'border-border hover:border-destructive/50 hover:bg-accent/50'
                          )}
                        >
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                            selectedReason === reason.value
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {reason.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'font-medium',
                              selectedReason === reason.value
                                ? 'text-destructive'
                                : 'text-foreground'
                            )}>
                              {reason.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {reason.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Additional information */}
                    {selectedReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Additional details (optional)
                        </label>
                        <textarea
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          placeholder="Provide more context about this report..."
                          className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50 resize-none"
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {additionalInfo.length}/500
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30">
                    <Button variant="ghost" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleSubmit}
                      disabled={!selectedReason || submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Flag className="w-4 h-4 mr-2" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
