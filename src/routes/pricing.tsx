import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Building2,
  Check,
  ChevronDown,
  Crown,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { useTranslation } from '../hooks/useTranslation'

export const Route = createFileRoute('/pricing')({ component: PricingPage })

interface PlanFeature {
  name: string
  explorer: string | boolean
  hero: string | boolean
  legend: string | boolean
  enterprise: string | boolean
}

interface FAQItem {
  question: string
  answer: string
  category: string
}

function PricingPage() {
  const { t } = useTranslation()
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const faqItems: Array<FAQItem> = [
    // General
    {
      category: 'General',
      question: t('pricing.faq.items.whatIsQzvert.question'),
      answer: t('pricing.faq.items.whatIsQzvert.answer'),
    },
    {
      category: 'General',
      question: t('pricing.faq.items.needSkills.question'),
      answer: t('pricing.faq.items.needSkills.answer'),
    },
    // For Creators
    {
      category: 'For Creators',
      question: t('pricing.faq.items.existingCourse.question'),
      answer: t('pricing.faq.items.existingCourse.answer'),
    },
    {
      category: 'For Creators',
      question: t('pricing.faq.items.dataSafe.question'),
      answer: t('pricing.faq.items.dataSafe.answer'),
    },
    // For Learners
    {
      category: 'For Learners',
      question: t('pricing.faq.items.wrongAnswers.question'),
      answer: t('pricing.faq.items.wrongAnswers.answer'),
    },
    {
      category: 'For Learners',
      question: t('pricing.faq.items.xpItems.question'),
      answer: t('pricing.faq.items.xpItems.answer'),
    },
    // Technology & Pricing
    {
      category: 'Technology & Pricing',
      question: t('pricing.faq.items.aiAccuracy.question'),
      answer: t('pricing.faq.items.aiAccuracy.answer'),
    },
    {
      category: 'Technology & Pricing',
      question: t('pricing.faq.items.cancelSubscription.question'),
      answer: t('pricing.faq.items.cancelSubscription.answer'),
    },
  ]

  const faqCategories = [...new Set(faqItems.map((item) => item.category))]

  const plans = [
    {
      name: 'Explorer',
      nameThai: t('pricing.plans.explorer.nameThai'),
      description: t('pricing.plans.explorer.description'),
      price: t('pricing.plans.free'),
      priceSuffix: t('pricing.plans.forever'),
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/30',
      bgGlow: 'bg-emerald-500/10',
      popular: false,
    },
    {
      name: 'Hero',
      nameThai: t('pricing.plans.hero.nameThai'),
      description: t('pricing.plans.hero.description'),
      price: '฿290',
      priceSuffix: t('pricing.plans.perMonth'),
      icon: Rocket,
      color: 'from-primary to-cyan-500',
      borderColor: 'border-primary/50',
      bgGlow: 'bg-primary/20',
      popular: true,
    },
    {
      name: 'Legend',
      nameThai: t('pricing.plans.legend.nameThai'),
      description: t('pricing.plans.legend.description'),
      price: '฿790',
      priceSuffix: t('pricing.plans.perMonth'),
      icon: Crown,
      color: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/30',
      bgGlow: 'bg-amber-500/10',
      popular: false,
    },
    {
      name: 'Enterprise',
      nameThai: t('pricing.plans.enterprise.nameThai'),
      description: t('pricing.plans.enterprise.description'),
      price: t('pricing.plans.contactUs'),
      priceSuffix: '',
      icon: Building2,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      bgGlow: 'bg-purple-500/10',
      popular: false,
    },
  ]

  const features: Array<PlanFeature> = [
    {
      name: t('pricing.features.freeLearn'),
      explorer: t('pricing.features.unlimited'),
      hero: t('pricing.features.unlimited'),
      legend: t('pricing.features.unlimited'),
      enterprise: t('pricing.features.unlimited'),
    },
    {
      name: t('pricing.features.createActivity'),
      explorer: t('pricing.features.freeUnlimited'),
      hero: t('pricing.features.freeUnlimited'),
      legend: t('pricing.features.freeUnlimited'),
      enterprise: t('pricing.features.freeUnlimited'),
    },
    {
      name: t('pricing.features.trackProgress'),
      explorer: t('pricing.features.viewOwnStats'),
      hero: t('pricing.features.viewOwnStats'),
      legend: t('pricing.features.viewOwnStats'),
      enterprise: t('pricing.features.viewOwnStats'),
    },
    {
      name: t('pricing.features.aiCredits'),
      explorer: `3 ${t('pricing.features.creditsPerMonth')}`,
      hero: `30 ${t('pricing.features.creditsPerMonth')}`,
      legend: `100 ${t('pricing.features.creditsPerMonth')}`,
      enterprise: t('pricing.features.unlimited'),
    },
    {
      name: t('pricing.features.storage'),
      explorer: '25 MB',
      hero: '1 GB',
      legend: '5 GB',
      enterprise: t('pricing.features.unlimited'),
    },
    {
      name: t('pricing.features.contentSource'),
      explorer: t('pricing.features.docPages'),
      hero: t('pricing.features.unlimitedLength'),
      legend: t('pricing.features.unlimitedLength'),
      enterprise: t('pricing.features.unlimitedLength'),
    },
    {
      name: t('pricing.features.customBranding'),
      explorer: false,
      hero: false,
      legend: t('pricing.features.customHeaderFooter'),
      enterprise: t('pricing.features.fullWhitelabel'),
    },
    {
      name: t('pricing.features.aiRoleplay'),
      explorer: t('pricing.features.basicNpc'),
      hero: t('pricing.features.advancedAi'),
      legend: t('pricing.features.advancedAi'),
      enterprise: t('pricing.features.customScenarios'),
    },
    {
      name: t('pricing.features.analytics'),
      explorer: false,
      hero: t('pricing.features.basicDashboard'),
      legend: t('pricing.features.individualAnalytics'),
      enterprise: t('pricing.features.deepInsights'),
    },
    {
      name: t('pricing.features.gamification'),
      explorer: t('pricing.features.basicXp'),
      hero: t('pricing.features.customItems'),
      legend: t('pricing.features.customItems'),
      enterprise: t('pricing.features.whitelabelGuild'),
    },
    {
      name: t('pricing.features.support'),
      explorer: t('pricing.features.communitySupport'),
      hero: t('pricing.features.emailSupport'),
      legend: t('pricing.features.prioritySupport'),
      enterprise: t('pricing.features.dedicatedManager'),
    },
    {
      name: t('pricing.features.selfHosted'),
      explorer: false,
      hero: false,
      legend: false,
      enterprise: t('pricing.features.installOwn'),
    },
  ]

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-emerald-500" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/40" />
      )
    }
    return <span className="text-sm">{value}</span>
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t('pricing.hero.badge')}
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-foreground">
                  {t('pricing.hero.title1')}
                </span>
                <br />
                <span className="bg-linear-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  {t('pricing.hero.title2')}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
                {t('pricing.hero.subtitle')}
              </p>
              <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
                {t('pricing.hero.subtitleEnd')}
                <span className="text-primary font-semibold">
                  {' '}
                  {t('pricing.hero.subtitleHighlight')}
                </span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-4 py-1.5 rounded-full bg-linear-to-r from-primary to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                        <Star className="w-4 h-4" />
                        {t('pricing.plans.mostPopular')}
                      </div>
                    </div>
                  )}
                  <Card
                    className={`relative h-full overflow-hidden ${plan.borderColor} ${
                      plan.popular ? 'border-2 shadow-xl shadow-primary/20' : ''
                    }`}
                  >
                    {/* Background Glow */}
                    <div
                      className={`absolute top-0 right-0 w-40 h-40 ${plan.bgGlow} rounded-full blur-3xl`}
                    />

                    <CardHeader className="relative pb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-linear-to-br ${plan.color} flex items-center justify-center mb-4`}
                      >
                        <plan.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          ({plan.nameThai})
                        </span>
                      </div>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="relative">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {plan.priceSuffix}
                          </span>
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-3">
                        {features
                          .filter((feature) => {
                            const value =
                              plan.name === 'Explorer'
                                ? feature.explorer
                                : plan.name === 'Hero'
                                  ? feature.hero
                                  : plan.name === 'Legend'
                                    ? feature.legend
                                    : feature.enterprise
                            return value !== false
                          })
                          .map((feature) => {
                            const value =
                              plan.name === 'Explorer'
                                ? feature.explorer
                                : plan.name === 'Hero'
                                  ? feature.hero
                                  : plan.name === 'Legend'
                                    ? feature.legend
                                    : feature.enterprise

                            return (
                              <li
                                key={feature.name}
                                className="flex items-start gap-3"
                              >
                                <div
                                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-linear-to-br ${plan.color}`}
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {feature.name}
                                  </p>
                                  {typeof value === 'string' && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {value}
                                    </p>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                      </ul>
                    </CardContent>

                    <CardFooter className="relative pt-4">
                      {plan.name === 'Enterprise' ? (
                        <Button
                          className={`w-full bg-linear-to-r ${plan.color} hover:opacity-90`}
                          size="lg"
                          asChild
                        >
                          <Link to="/contact">
                            <Building2 className="w-4 h-4" />
                            {t('pricing.plans.contactUs')}
                          </Link>
                        </Button>
                      ) : plan.name === 'Legend' ? (
                        <Button
                          className={`w-full bg-linear-to-r ${plan.color} hover:opacity-90`}
                          size="lg"
                          asChild
                        >
                          <Link to="/" hash="create">
                            <Crown className="w-4 h-4" />
                            {t('pricing.plans.upgradeLegend')}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          className={`w-full ${
                            plan.popular
                              ? `bg-linear-to-r ${plan.color} hover:opacity-90`
                              : ''
                          }`}
                          variant={plan.popular ? 'default' : 'outline'}
                          size="lg"
                          asChild
                        >
                          <Link to="/" hash="create">
                            <Zap className="w-4 h-4" />
                            {plan.name === 'Explorer'
                              ? t('pricing.plans.startFree')
                              : t('pricing.plans.getStarted')}
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('pricing.comparison.title')}
                <span className="text-primary">
                  {t('pricing.comparison.titleHighlight')}
                </span>
              </h2>
              <p className="text-muted-foreground">
                {t('pricing.comparison.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-x-auto"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">
                      Features
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <GraduationCap className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold">Explorer</span>
                        <span className="text-xs text-muted-foreground">
                          Free
                        </span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 bg-primary/5 rounded-t-lg">
                      <div className="flex flex-col items-center gap-1">
                        <Rocket className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-primary">Hero</span>
                        <span className="text-xs text-primary/70">฿290/mo</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold">Legend</span>
                        <span className="text-xs text-muted-foreground">
                          ฿790/mo
                        </span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <Building2 className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold">Enterprise</span>
                        <span className="text-xs text-muted-foreground">
                          Contact Us
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={feature.name}
                      className={`border-b border-border/50 ${
                        index % 2 === 0 ? 'bg-muted/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-foreground">
                        {feature.name}
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground">
                        {renderFeatureValue(feature.explorer)}
                      </td>
                      <td className="py-4 px-4 text-center bg-primary/5 text-foreground">
                        {renderFeatureValue(feature.hero)}
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground">
                        {renderFeatureValue(feature.legend)}
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground">
                        {renderFeatureValue(feature.enterprise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* Early Bird Banner */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 p-8 md:p-12"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-500 text-sm font-medium mb-4">
                  <Shield className="w-4 h-4" />
                  {t('pricing.earlyBird.badge')}
                </div>

                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {t('pricing.earlyBird.title')}{' '}
                  <span className="bg-linear-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {t('pricing.earlyBird.titleHighlight')}
                  </span>
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t('pricing.earlyBird.subtitle')}
                </p>

                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                  asChild
                >
                  <Link to="/" hash="create">
                    <Wand2 className="w-5 h-5" />
                    {t('pricing.earlyBird.cta')}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
                <HelpCircle className="w-4 h-4" />
                {t('pricing.faq.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('pricing.faq.title')}
                <span className="text-primary">
                  {t('pricing.faq.titleHighlight')}
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('pricing.faq.subtitle')}
              </p>
            </motion.div>

            {/* FAQ by Category */}
            <div className="space-y-8">
              {faqCategories.map((category) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    {category === 'General' && (
                      <HelpCircle className="w-5 h-5" />
                    )}
                    {category === 'For Creators' && (
                      <Wand2 className="w-5 h-5" />
                    )}
                    {category === 'For Learners' && (
                      <GraduationCap className="w-5 h-5" />
                    )}
                    {category === 'Technology & Pricing' && (
                      <Zap className="w-5 h-5" />
                    )}
                    {category === 'General' &&
                      t('pricing.faq.categories.general')}
                    {category === 'For Creators' &&
                      t('pricing.faq.categories.forCreators')}
                    {category === 'For Learners' &&
                      t('pricing.faq.categories.forLearners')}
                    {category === 'Technology & Pricing' &&
                      t('pricing.faq.categories.techPricing')}
                  </h3>

                  <div className="space-y-3">
                    {faqItems
                      .filter((item) => item.category === category)
                      .map((item, index) => {
                        const globalIndex = faqItems.findIndex(
                          (faq) => faq.question === item.question,
                        )
                        const isOpen = openFAQ === globalIndex

                        return (
                          <motion.div
                            key={item.question}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl border border-border bg-card overflow-hidden"
                          >
                            <button
                              onClick={() => toggleFAQ(globalIndex)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                            >
                              <span className="font-medium text-foreground pr-4">
                                {item.question}
                              </span>
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="shrink-0"
                              >
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              </motion.div>
                            </button>

                            <motion.div
                              initial={false}
                              animate={{
                                height: isOpen ? 'auto' : 0,
                                opacity: isOpen ? 1 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                                {item.answer}
                              </div>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Still have questions? CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-6 rounded-2xl bg-linear-to-r from-primary/10 to-cyan-500/10 border border-primary/20 text-center"
            >
              <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {t('pricing.faq.stillQuestions.title')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('pricing.faq.stillQuestions.subtitle')}
              </p>
              <Button
                className="bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                size="lg"
                asChild
              >
                <Link to="/contact">
                  <MessageCircle className="w-4 h-4" />
                  {t('pricing.faq.stillQuestions.cta')}
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Closing Hook */}
        <section className="py-20 px-6 bg-linear-to-b from-muted/30 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-5xl mb-6">💎</div>
              <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-8">
                "{t('pricing.closing.quote1')}
                <br />
                {t('pricing.closing.quote2')}
                <br />
                <span className="bg-linear-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  {t('pricing.closing.quote3')}
                </span>
                <br />
                {t('pricing.closing.quote4')}"
              </blockquote>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                  asChild
                >
                  <Link to="/" hash="create">
                    <Sparkles className="w-5 h-5" />
                    {t('pricing.closing.cta')}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </DefaultLayout>
  )
}
