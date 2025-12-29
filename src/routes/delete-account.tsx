import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Mail,
  Shield,
  Trash2,
  Undo2,
  UserX,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import { useTranslation } from '../hooks/useTranslation'
import { CONTACT_EMAIL } from '../lib/utils'
import { softDeleteAccount } from '../server/account'
import { useAuthStore } from '../stores/auth-store'

export const Route = createFileRoute('/delete-account')({
  component: DeleteAccountPage,
})

function DeleteAccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isInitialized, signOut } = useAuthStore()
  const [confirmText, setConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [deletionDate, setDeletionDate] = useState<string | null>(null)

  // Redirect if not logged in (only after auth is initialized)
  useEffect(() => {
    if (isInitialized && !user) {
      navigate({ to: '/login', search: { redirect: '/delete-account' } })
    }
  }, [user, navigate, isInitialized])

  const isConfirmed = confirmText.toLowerCase() === 'delete'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed || !user) return

    setIsSubmitting(true)

    try {
      const result = await softDeleteAccount()

      if (result.success) {
        setDeletionDate(result.deletionDate)
        setIsSubmitted(true)
        // Sign out locally
        await signOut()
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : t('deleteAccount.error.generic'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const deletionItems = [
    {
      icon: UserX,
      title: t('deleteAccount.items.profile.title'),
      description: t('deleteAccount.items.profile.description'),
    },
    {
      icon: Trash2,
      title: t('deleteAccount.items.activities.title'),
      description: t('deleteAccount.items.activities.description'),
    },
    {
      icon: Shield,
      title: t('deleteAccount.items.progress.title'),
      description: t('deleteAccount.items.progress.description'),
    },
  ]

  if (isSubmitted) {
    const formattedDate = deletionDate
      ? new Date(deletionDate).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    return (
      <DefaultLayout>
        <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
          <section className="relative py-16 px-6">
            <div className="relative max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl bg-card border border-border"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold mb-4">
                  {t('deleteAccount.success.title')}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {t('deleteAccount.success.description')}
                </p>

                {formattedDate && (
                  <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted mb-6">
                    <Calendar className="w-5 h-5 text-destructive" />
                    <span className="font-medium">
                      {t('deleteAccount.success.permanentDate')}:{' '}
                      {formattedDate}
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-6">
                  <div className="flex items-start gap-3">
                    <Undo2 className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">
                        {t('deleteAccount.success.canRestore')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('deleteAccount.success.restoreInfo')}
                      </p>
                    </div>
                  </div>
                </div>

                <Button asChild>
                  <Link to="/">{t('deleteAccount.success.backHome')}</Link>
                </Button>
              </motion.div>
            </div>
          </section>
        </div>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        {/* Header */}
        <section className="relative py-16 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-destructive/10 via-transparent to-transparent" />

          <div className="relative max-w-4xl mx-auto">
            <Button variant="ghost" asChild className="mb-8">
              <Link to="/privacy">
                <ArrowLeft className="w-4 h-4" />
                {t('deleteAccount.hero.backToPrivacy')}
              </Link>
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/20 text-destructive text-sm font-medium mb-6">
                <Trash2 className="w-4 h-4" />
                {t('deleteAccount.hero.badge')}
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-4">
                <span className="text-foreground">
                  {t('deleteAccount.hero.title1')}
                </span>
                <span className="text-destructive">
                  {t('deleteAccount.hero.title2')}
                </span>
              </h1>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('deleteAccount.hero.subtitle')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Grace Period Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-primary/10 border border-primary/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-2">
                    {t('deleteAccount.gracePeriod.title')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('deleteAccount.gracePeriod.description')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Warning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-2">
                    {t('deleteAccount.warning.title')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('deleteAccount.warning.description')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* What will be deleted */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <h2 className="text-lg font-bold text-foreground mb-6">
                {t('deleteAccount.whatDeleted.title')}
              </h2>

              <div className="space-y-4">
                {deletionItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Request Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">
                {t('deleteAccount.form.title')}
              </h2>

              {!isInitialized || !user ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('deleteAccount.form.emailLabel')}
                    </label>
                    <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                      {user.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('deleteAccount.form.confirmLabel')}
                    </label>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('deleteAccount.form.confirmHint')}
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                    disabled={!isConfirmed || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isSubmitting
                      ? t('deleteAccount.form.submitting')
                      : t('deleteAccount.form.submit')}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Alternative Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-xl bg-muted/50 border border-border text-center"
            >
              <p className="text-sm text-muted-foreground mb-3">
                {t('deleteAccount.alternative.text')}
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <Mail className="w-4 h-4" />
                  {CONTACT_EMAIL}
                </a>
              </Button>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-xl bg-muted/50 border border-border"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {t('deleteAccount.timeline.title')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('deleteAccount.timeline.description')}
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </DefaultLayout>
  )
}
