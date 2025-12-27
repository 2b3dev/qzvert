import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Database,
  Eye,
  FileText,
  Globe,
  Lock,
  Mail,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import { useTranslation } from '../hooks/useTranslation'

export const Route = createFileRoute('/privacy')({ component: PrivacyPage })

function PrivacyPage() {
  const { t } = useTranslation()

  const sections = [
    {
      icon: Database,
      title: t('privacy.sections.dataCollect.title'),
      titleEn: t('privacy.sections.dataCollect.titleEn'),
      content: [
        {
          subtitle: t('privacy.sections.dataCollect.accountData'),
          items: [
            t('privacy.sections.dataCollect.items.email'),
            t('privacy.sections.dataCollect.items.displayName'),
            t('privacy.sections.dataCollect.items.avatar'),
          ],
        },
        {
          subtitle: t('privacy.sections.dataCollect.usageData'),
          items: [
            t('privacy.sections.dataCollect.usageItems.quests'),
            t('privacy.sections.dataCollect.usageItems.scores'),
            t('privacy.sections.dataCollect.usageItems.history'),
          ],
        },
      ],
    },
    {
      icon: Eye,
      title: t('privacy.sections.dataUse.title'),
      titleEn: t('privacy.sections.dataUse.titleEn'),
      content: [
        {
          subtitle: t('privacy.sections.dataUse.subtitle'),
          items: [
            t('privacy.sections.dataUse.items.verify'),
            t('privacy.sections.dataUse.items.display'),
            t('privacy.sections.dataUse.items.notify'),
            t('privacy.sections.dataUse.items.improve'),
            t('privacy.sections.dataUse.items.analyze'),
          ],
        },
      ],
    },
    {
      icon: Lock,
      title: t('privacy.sections.dataProtection.title'),
      titleEn: t('privacy.sections.dataProtection.titleEn'),
      content: [
        {
          subtitle: t('privacy.sections.dataProtection.subtitle'),
          items: [
            t('privacy.sections.dataProtection.items.ssl'),
            t('privacy.sections.dataProtection.items.hash'),
            t('privacy.sections.dataProtection.items.rls'),
            t('privacy.sections.dataProtection.items.own'),
            t('privacy.sections.dataProtection.items.admin'),
          ],
        },
      ],
    },
    {
      icon: UserCheck,
      title: t('privacy.sections.rights.title'),
      titleEn: t('privacy.sections.rights.titleEn'),
      content: [
        {
          subtitle: t('privacy.sections.rights.subtitle'),
          items: [
            t('privacy.sections.rights.items.access'),
            t('privacy.sections.rights.items.correct'),
            t('privacy.sections.rights.items.delete'),
            t('privacy.sections.rights.items.withdraw'),
            t('privacy.sections.rights.items.object'),
            t('privacy.sections.rights.items.transfer'),
          ],
        },
      ],
    },
    {
      icon: Globe,
      title: t('privacy.sections.dataSharing.title'),
      titleEn: t('privacy.sections.dataSharing.titleEn'),
      content: [
        {
          subtitle: t('privacy.sections.dataSharing.subtitle'),
          items: [
            t('privacy.sections.dataSharing.items.noSell'),
            t('privacy.sections.dataSharing.items.legal'),
            t('privacy.sections.dataSharing.items.services'),
            t('privacy.sections.dataSharing.items.standards'),
          ],
        },
      ],
    },
    {
      icon: Trash2,
      title: t('privacy.sections.dataDeletion.title'),
      titleEn: t('privacy.sections.dataDeletion.titleEn'),
      content: [
        {
          subtitle: t('privacy.sections.dataDeletion.subtitle'),
          items: [
            t('privacy.sections.dataDeletion.items.contact'),
            t('privacy.sections.dataDeletion.items.timeline'),
            t('privacy.sections.dataDeletion.items.legal'),
          ],
        },
      ],
    },
  ]

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        {/* Header */}
        <section className="relative py-16 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          <div className="relative max-w-4xl mx-auto">
            <Button variant="ghost" asChild className="mb-8">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                {t('privacy.hero.backToHome')}
              </Link>
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                {t('privacy.hero.badge')}
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-4">
                <span className="text-foreground">
                  {t('privacy.hero.title1')}
                </span>
                <span className="bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                  {t('privacy.hero.title2')}
                </span>
              </h1>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('privacy.hero.subtitle1')}
                <br />
                {t('privacy.hero.subtitle2')}
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                {t('privacy.hero.lastUpdated')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 md:p-8 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {section.titleEn}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 pl-16">
                  {section.content.map((block, blockIndex) => (
                    <div key={blockIndex}>
                      <h3 className="font-semibold text-foreground mb-3">
                        {block.subtitle}
                      </h3>
                      <ul className="space-y-2">
                        {block.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-start gap-2 text-muted-foreground"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 md:p-8 rounded-2xl bg-linear-to-br from-primary/10 to-pink-500/10 border border-primary/20"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t('privacy.contact.title')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.contact.titleEn')}
                  </p>
                </div>
              </div>

              <div className="pl-16 space-y-4">
                <p className="text-muted-foreground">
                  {t('privacy.contact.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                    <Link to="/contact">
                      <Mail className="w-4 h-4" />
                      {t('privacy.contact.contactTeam')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:privacy@qzvert.com">
                      <FileText className="w-4 h-4" />
                      privacy@qzvert.com
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Consent Reminder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-muted/50 border border-border text-center"
            >
              <p className="text-sm text-muted-foreground">
                {t('privacy.consent.text1')}
                <br />
                {t('privacy.consent.text2')}
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </DefaultLayout>
  )
}
