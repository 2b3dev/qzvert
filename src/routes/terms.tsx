import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  Brain,
  FileText,
  Gamepad2,
  GraduationCap,
  Mail,
  Scale,
  ScrollText,
  Shield,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import { useTranslation } from '../hooks/useTranslation'
import { CONTACT_EMAIL } from '../lib/utils'

export const Route = createFileRoute('/terms')({ component: TermsPage })

function TermsPage() {
  const { t } = useTranslation()

  const sections = [
    {
      icon: BookOpen,
      title: t('terms.sections.acceptance.title'),
      titleEn: t('terms.sections.acceptance.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.acceptance.subtitle'),
          items: [
            t('terms.sections.acceptance.items.agree'),
            t('terms.sections.acceptance.items.age'),
            t('terms.sections.acceptance.items.changes'),
          ],
        },
      ],
    },
    {
      icon: Gamepad2,
      title: t('terms.sections.services.title'),
      titleEn: t('terms.sections.services.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.services.subtitle'),
          items: [
            t('terms.sections.services.items.create'),
            t('terms.sections.services.items.play'),
            t('terms.sections.services.items.ai'),
            t('terms.sections.services.items.storage'),
          ],
        },
      ],
    },
    {
      icon: User,
      title: t('terms.sections.account.title'),
      titleEn: t('terms.sections.account.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.account.subtitle'),
          items: [
            t('terms.sections.account.items.accurate'),
            t('terms.sections.account.items.secure'),
            t('terms.sections.account.items.oneAccount'),
            t('terms.sections.account.items.responsible'),
          ],
        },
      ],
    },
    {
      icon: GraduationCap,
      title: t('terms.sections.education.title'),
      titleEn: t('terms.sections.education.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.education.subtitle'),
          items: [
            t('terms.sections.education.items.authorization'),
            t('terms.sections.education.items.consent'),
            t('terms.sections.education.items.supervision'),
            t('terms.sections.education.items.compliance'),
            t('terms.sections.education.items.data'),
            t('terms.sections.education.items.agreement'),
          ],
        },
      ],
    },
    {
      icon: Brain,
      title: t('terms.sections.content.title'),
      titleEn: t('terms.sections.content.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.content.yourContent'),
          items: [
            t('terms.sections.content.items.ownership'),
            t('terms.sections.content.items.license'),
            t('terms.sections.content.items.responsibility'),
          ],
        },
        {
          subtitle: t('terms.sections.content.aiContent'),
          items: [
            t('terms.sections.content.items.aiOwnership'),
            t('terms.sections.content.items.aiReview'),
          ],
        },
      ],
    },
    {
      icon: XCircle,
      title: t('terms.sections.prohibited.title'),
      titleEn: t('terms.sections.prohibited.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.prohibited.subtitle'),
          items: [
            t('terms.sections.prohibited.items.illegal'),
            t('terms.sections.prohibited.items.harmful'),
            t('terms.sections.prohibited.items.infringe'),
            t('terms.sections.prohibited.items.spam'),
            t('terms.sections.prohibited.items.hack'),
            t('terms.sections.prohibited.items.impersonate'),
          ],
        },
      ],
    },
    {
      icon: ShieldCheck,
      title: t('terms.sections.ip.title'),
      titleEn: t('terms.sections.ip.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.ip.subtitle'),
          items: [
            t('terms.sections.ip.items.qzvertOwns'),
            t('terms.sections.ip.items.noUse'),
            t('terms.sections.ip.items.feedback'),
          ],
        },
      ],
    },
    {
      icon: AlertTriangle,
      title: t('terms.sections.disclaimer.title'),
      titleEn: t('terms.sections.disclaimer.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.disclaimer.subtitle'),
          items: [
            t('terms.sections.disclaimer.items.asIs'),
            t('terms.sections.disclaimer.items.noWarranty'),
            t('terms.sections.disclaimer.items.limitation'),
          ],
        },
      ],
    },
    {
      icon: Scale,
      title: t('terms.sections.termination.title'),
      titleEn: t('terms.sections.termination.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.termination.subtitle'),
          items: [
            t('terms.sections.termination.items.terminate'),
            t('terms.sections.termination.items.suspend'),
            t('terms.sections.termination.items.effect'),
          ],
        },
      ],
    },
    {
      icon: Users,
      title: t('terms.sections.governing.title'),
      titleEn: t('terms.sections.governing.titleEn'),
      content: [
        {
          subtitle: t('terms.sections.governing.subtitle'),
          items: [
            t('terms.sections.governing.items.law'),
            t('terms.sections.governing.items.dispute'),
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
                {t('terms.hero.backToHome')}
              </Link>
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                <ScrollText className="w-4 h-4" />
                {t('terms.hero.badge')}
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-4">
                <span className="text-foreground">{t('terms.hero.title1')}</span>
                <span className="bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                  {t('terms.hero.title2')}
                </span>
              </h1>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('terms.hero.subtitle1')}
                <br />
                {t('terms.hero.subtitle2')}
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                {t('terms.hero.lastUpdated')}
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
                    {t('terms.contact.title')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('terms.contact.titleEn')}
                  </p>
                </div>
              </div>

              <div className="pl-16 space-y-4">
                <p className="text-muted-foreground">
                  {t('terms.contact.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                    <Link to="/contact">
                      <Mail className="w-4 h-4" />
                      {t('terms.contact.contactTeam')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`mailto:${CONTACT_EMAIL}`}>
                      <FileText className="w-4 h-4" />
                      {CONTACT_EMAIL}
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Related Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {t('terms.related.title')}
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/privacy">
                    <Shield className="w-4 h-4" />
                    {t('terms.related.privacy')}
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Agreement Reminder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-muted/50 border border-border text-center"
            >
              <p className="text-sm text-muted-foreground">
                {t('terms.agreement.text1')}
                <br />
                {t('terms.agreement.text2')}
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </DefaultLayout>
  )
}
