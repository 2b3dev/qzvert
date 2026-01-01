import { Link, createFileRoute, useRouteContext } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Briefcase,
  FileText,
  Gamepad2,
  GraduationCap,
  Map,
  MessageSquare,
  Play,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { Button } from '../components/ui/button'
import { useTranslation } from '../hooks/useTranslation'
import IconApp from '@/components/icon/icon-app'
import en from '../locales/en.json'
import th from '../locales/th.json'

import type { Language } from '../server/language'

const translations = { th, en }

function getHomeSeo(language: Language) {
  return translations[language].seo.pages.home
}

export const Route = createFileRoute('/')({
  head: ({ context }) => {
    const language = (context as { language?: Language })?.language || 'en'
    const seo = getHomeSeo(language)
    const locale = language === 'en' ? 'en_US' : 'th_TH'
    const alternateLocale = language === 'en' ? 'th_TH' : 'en_US'

    // JSON-LD Structured Data for Organization and WebSite
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://qzvert.com/#organization',
          name: 'QzVert',
          url: 'https://qzvert.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://qzvert.com/logo.png',
          },
          sameAs: [
            'https://facebook.com/qzvert',
            'https://twitter.com/qzvert',
            'https://youtube.com/@qzvert',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://qzvert.com/#website',
          url: 'https://qzvert.com',
          name: 'QzVert',
          description: seo.description,
          publisher: { '@id': 'https://qzvert.com/#organization' },
          inLanguage: language === 'en' ? 'en-US' : 'th-TH',
        },
        {
          '@type': 'WebPage',
          '@id': 'https://qzvert.com/#webpage',
          url: 'https://qzvert.com',
          name: seo.title,
          isPartOf: { '@id': 'https://qzvert.com/#website' },
          about: { '@id': 'https://qzvert.com/#organization' },
          description: seo.description,
          inLanguage: language === 'en' ? 'en-US' : 'th-TH',
        },
        {
          '@type': 'SoftwareApplication',
          name: 'QzVert',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
          },
        },
      ],
    }

    return {
      meta: [
        { title: seo.title },
        { name: 'description', content: seo.description },
        { name: 'keywords', content: seo.keywords },
        // Robots
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'QzVert' },
        { property: 'og:title', content: seo.ogTitle },
        { property: 'og:description', content: seo.ogDescription },
        { property: 'og:url', content: 'https://qzvert.com' },
        { property: 'og:image', content: 'https://qzvert.com/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: locale },
        { property: 'og:locale:alternate', content: alternateLocale },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@qzvert' },
        { name: 'twitter:title', content: seo.ogTitle },
        { name: 'twitter:description', content: seo.ogDescription },
        { name: 'twitter:image', content: 'https://qzvert.com/og-image.png' },
      ],
      links: [
        { rel: 'canonical', href: 'https://qzvert.com' },
        { rel: 'alternate', hrefLang: 'en', href: 'https://qzvert.com?lang=en' },
        { rel: 'alternate', hrefLang: 'th', href: 'https://qzvert.com?lang=th' },
        { rel: 'alternate', hrefLang: 'x-default', href: 'https://qzvert.com' },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(structuredData),
        },
      ],
    }
  },
  component: HomePage,
})

function HomePage() {
  const { t } = useTranslation()

  const problems = [
    {
      icon: BookOpen,
      title: t('home.problem.items.vocab.title'),
      description: t('home.problem.items.vocab.description'),
    },
    {
      icon: Video,
      title: t('home.problem.items.video.title'),
      description: t('home.problem.items.video.description'),
    },
    {
      icon: FileText,
      title: t('home.problem.items.document.title'),
      description: t('home.problem.items.document.description'),
    },
  ]

  const solutions = [
    {
      icon: Map,
      title: t('home.solution.items.mapping.title'),
      description: t('home.solution.items.mapping.description'),
    },
    {
      icon: MessageSquare,
      title: t('home.solution.items.roleplay.title'),
      description: t('home.solution.items.roleplay.description'),
    },
    {
      icon: Trophy,
      title: t('home.solution.items.reward.title'),
      description: t('home.solution.items.reward.description'),
    },
  ]

  const transformTypes = [
    {
      icon: Play,
      title: t('home.transform.items.video.title'),
      description: t('home.transform.items.video.description'),
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: FileText,
      title: t('home.transform.items.document.title'),
      description: t('home.transform.items.document.description'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Gamepad2,
      title: t('home.transform.items.flashcard.title'),
      description: t('home.transform.items.flashcard.description'),
      color: 'from-purple-500 to-pink-500',
    },
  ]

  const creatorBenefits = [
    {
      icon: TrendingUp,
      title: t('home.creator.items.churn.title'),
      description: t('home.creator.items.churn.description'),
    },
    {
      icon: Users,
      title: t('home.creator.items.community.title'),
      description: t('home.creator.items.community.description'),
    },
    {
      icon: Star,
      title: t('home.creator.items.value.title'),
      description: t('home.creator.items.value.description'),
    },
  ]

  // Detect reduced motion preference for accessibility and SEO
  const prefersReducedMotion = useReducedMotion()

  // Animation variants - disabled for reduced motion or crawlers
  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 },
      }

  const staggerChild = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: delay * 0.1, duration: 0.4 },
        }

  return (
    <DefaultLayout>
      <main className="min-h-screen bg-linear-to-b from-background via-muted/50 to-background">
        {/* Hero Section - No initial hide for SEO, content visible immediately */}
        <header className="relative py-24 px-6 overflow-hidden" role="banner">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto text-center">
            {/* Hero content visible immediately for SEO, animate only on client */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <motion.div
                  animate={prefersReducedMotion ? {} : { rotate: [0, 360] }}
                  transition={
                    prefersReducedMotion
                      ? {}
                      : {
                          duration: 20,
                          repeat: Infinity,
                          ease: 'linear',
                        }
                  }
                >
                  <IconApp
                    className="w-10 h-10"
                    color={'hsl(var(--foreground))'}
                  />
                </motion.div>
                <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                  {t('home.hero.badge')}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                <span className="text-foreground">{t('home.hero.title1')}</span>
                <br />
                <span className="bg-linear-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  {t('home.hero.title2')}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4">
                {t('home.hero.subtitle')}
              </p>
              <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto mb-8">
                {t('home.hero.description')}
              </p>

              {/* Dual CTA */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                  asChild
                >
                  <Link to="/explore">
                    <GraduationCap className="w-5 h-5" />
                    {t('home.hero.ctaLearn')}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90"
                  asChild
                >
                  <Link to="/create">
                    <Wand2 className="w-5 h-5" />
                    {t('home.hero.ctaCreate')}
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('common.freeStart')}
              </p>
            </motion.div>
          </div>
        </header>

        {/* Dual Audience Section */}
        <section className="py-20 px-6" aria-labelledby="audience-heading">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <h2 id="audience-heading" className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.audience.title')}
                <span className="text-primary">
                  {t('home.audience.titleHighlight')}
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('home.audience.subtitle')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* For Learners */}
              <motion.div
                {...staggerChild(0)}
                className="relative p-8 rounded-3xl bg-linear-to-br from-primary/10 to-cyan-500/10 border border-primary/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-cyan-500 flex items-center justify-center mb-6">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-primary">
                    {t('home.audience.learner.title')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('home.audience.learner.description')}
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        {t('home.audience.learner.benefit1')}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        {t('home.audience.learner.benefit2')}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        {t('home.audience.learner.benefit3')}
                      </span>
                    </li>
                  </ul>
                  <Button
                    className="bg-linear-to-r from-primary to-cyan-500"
                    asChild
                  >
                    <Link to="/explore">
                      <GraduationCap className="w-4 h-4" />
                      {t('home.audience.learner.cta')}
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* For Creators */}
              <motion.div
                {...staggerChild(1)}
                className="relative p-8 rounded-3xl bg-linear-to-br from-purple-500/10 to-pink-500/10 border border-pink-500/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-pink-400">
                    {t('home.audience.creator.title')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('home.audience.creator.description')}
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-pink-400" />
                      <span className="text-foreground">
                        {t('home.audience.creator.benefit1')}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-pink-400" />
                      <span className="text-foreground">
                        {t('home.audience.creator.benefit2')}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-pink-400" />
                      <span className="text-foreground">
                        {t('home.audience.creator.benefit3')}
                      </span>
                    </li>
                  </ul>
                  <Button
                    className="bg-linear-to-r from-purple-500 to-pink-500"
                    asChild
                  >
                    <Link to="/create">
                      <Wand2 className="w-4 h-4" />
                      {t('home.audience.creator.cta')}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-6 bg-muted/30" aria-labelledby="problem-heading">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <h2 id="problem-heading" className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.problem.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('home.problem.subtitle')}{' '}
                <span className="text-primary font-semibold">
                  {t('home.problem.subtitleHighlight')}
                </span>
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.title}
                  {...staggerChild(index)}
                  className="p-6 rounded-2xl bg-card border border-destructive/20 relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4">
                    <XCircle className="w-6 h-6 text-destructive/50" aria-hidden="true" />
                  </div>
                  <problem.icon className="w-10 h-10 text-muted-foreground mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground">{problem.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20 px-6" aria-labelledby="solution-heading">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {t('home.solution.badge')}
              </div>
              <h2 id="solution-heading" className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.solution.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('home.solution.subtitle')}{' '}
                <span className="text-primary font-semibold">
                  {t('home.solution.subtitleHighlight')}
                </span>{' '}
                {t('home.solution.subtitleEnd')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.title}
                  {...staggerChild(index)}
                  className="p-6 rounded-2xl bg-linear-to-br from-card to-primary/5 border border-primary/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <solution.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {solution.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {solution.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Transform Types Section */}
        <section className="py-20 px-6 bg-muted/30" aria-labelledby="transform-heading">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <h2 id="transform-heading" className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.transform.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('home.transform.subtitle')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {transformTypes.map((type, index) => (
                <motion.div
                  key={type.title}
                  {...staggerChild(index)}
                  whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.02 }}
                  className="group relative p-8 rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${type.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-linear-to-br ${type.color} flex items-center justify-center mb-6`}
                  >
                    <type.icon className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3">{type.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Creator Value Section */}
        <section className="py-20 px-6" aria-labelledby="creator-heading">
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-500/20 to-pink-500/20 text-pink-400 text-sm font-medium mb-4">
                <Target className="w-4 h-4" aria-hidden="true" />
                {t('home.creator.badge')}
              </div>
              <h2 id="creator-heading" className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.creator.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('home.creator.subtitle')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {creatorBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  {...staggerChild(index)}
                  className="p-6 rounded-2xl bg-card border border-border text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-pink-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-6 bg-linear-to-b from-muted/30 to-background" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div {...fadeInUp}>
              <h2 id="cta-heading" className="text-3xl md:text-5xl font-black mb-4">
                <span className="text-foreground block pb-2">
                  {t('home.cta.title1')}
                </span>
                <span className="bg-linear-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent block py-2">
                  {t('home.cta.title2')}
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                {t('home.cta.subtitle')}
              </p>

              <nav className="flex flex-col sm:flex-row justify-center gap-4" aria-label="Call to action">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-linear-to-r from-primary to-cyan-500"
                  asChild
                >
                  <Link to="/explore">
                    <GraduationCap className="w-5 h-5" aria-hidden="true" />
                    {t('home.hero.ctaLearn')}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-linear-to-r from-purple-500 to-pink-500"
                  asChild
                >
                  <Link to="/create">
                    <Wand2 className="w-5 h-5" aria-hidden="true" />
                    {t('home.hero.ctaCreate')}
                  </Link>
                </Button>
              </nav>
            </motion.div>
          </div>
        </section>
      </main>
    </DefaultLayout>
  )
}
