import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Crown,
  Gamepad2,
  Globe,
  Heart,
  Lightbulb,
  Map,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Wand2,
  Zap,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { useTranslation } from '../hooks/useTranslation'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  const { t } = useTranslation()

  const coreValues = [
    {
      icon: Crown,
      title: t('about.values.context.title'),
      titleThai: t('about.values.context.titleThai'),
      description: t('about.values.context.description'),
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      icon: Gamepad2,
      title: t('about.values.fun.title'),
      titleThai: t('about.values.fun.titleThai'),
      description: t('about.values.fun.description'),
      color: 'from-primary to-cyan-500',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    {
      icon: Rocket,
      title: t('about.values.potential.title'),
      titleThai: t('about.values.potential.titleThai'),
      description: t('about.values.potential.description'),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
  ]

  const stats = [
    { value: '10K+', label: t('about.stats.questsCreated'), icon: Map },
    { value: '50K+', label: t('about.stats.learnersWorldwide'), icon: Users },
    { value: '95%', label: t('about.stats.satisfactionRate'), icon: Heart },
    { value: '3x', label: t('about.stats.retentionIncrease'), icon: Brain },
  ]

  const team = [
    {
      role: t('about.drives.vision.title'),
      description: t('about.drives.vision.description'),
      icon: Lightbulb,
    },
    {
      role: t('about.drives.technology.title'),
      description: t('about.drives.technology.description'),
      icon: Zap,
    },
    {
      role: t('about.drives.design.title'),
      description: t('about.drives.design.description'),
      icon: Sparkles,
    },
  ]

  const milestones = [
    {
      year: t('about.timeline.start.year'),
      title: t('about.timeline.start.title'),
      description: t('about.timeline.start.description'),
    },
    {
      year: t('about.timeline.aiEngine.year'),
      title: t('about.timeline.aiEngine.title'),
      description: t('about.timeline.aiEngine.description'),
    },
    {
      year: t('about.timeline.beta.year'),
      title: t('about.timeline.beta.title'),
      description: t('about.timeline.beta.description'),
    },
    {
      year: t('about.timeline.future.year'),
      title: t('about.timeline.future.title'),
      description: t('about.timeline.future.description'),
    },
  ]

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
        {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              {t('about.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-foreground">{t('about.hero.title1')}</span>
              <br />
              <span className="bg-linear-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                {t('about.hero.title2')}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('about.hero.subtitle1')}{' '}
              <span className="text-foreground font-semibold">{t('about.hero.subtitleHighlight')}</span> {t('about.hero.subtitle2')}
              <span className="text-primary font-semibold">
                {' '}{t('about.hero.subtitleHighlight2')}
              </span>
              {' '}{t('about.hero.subtitleEnd')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card to-primary/5 border border-primary/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative">
              <BookOpen className="w-12 h-12 text-primary mb-6" />
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                {t('about.mission.text1')}{' '}
                <span className="text-primary font-bold">{t('about.mission.highlight1')}</span> {t('about.mission.text2')}
                <span className="text-primary font-bold"> {t('about.mission.highlight2')}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              {t('about.values.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.values.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`relative p-8 rounded-3xl bg-card border ${value.borderColor} overflow-hidden`}
              >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 ${value.bgColor} rounded-full blur-3xl`} />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6`}
                  >
                    <value.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Number Badge */}
                  <div className="absolute top-0 right-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-1">{value.title}</h3>
                  <p className={`text-sm font-medium mb-4 bg-gradient-to-r ${value.color} bg-clip-text text-transparent`}>
                    {value.titleThai}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.stats.title')}<span className="text-primary">{t('about.stats.titleHighlight')}</span>{t('about.stats.titleEnd')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 rounded-2xl bg-card border border-border text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-black text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Drives Us */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.drives.title')}<span className="text-primary">{t('about.drives.titleHighlight')}</span>{t('about.drives.titleEnd')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.drives.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((item, index) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.role}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline / Journey */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.timeline.title')}<span className="text-primary">{t('about.timeline.titleHighlight')}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.timeline.subtitle')}
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-0.5" />

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary md:-translate-x-2 z-10" />

                  {/* Content */}
                  <div className={`flex-1 ml-12 md:ml-0 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-2">
                      {milestone.year}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-primary/20 to-pink-500/20 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              {t('about.cta.badge')}
            </div>

            <h2 className="text-3xl md:text-5xl font-black mb-6">
              <span className="text-foreground">{t('about.cta.title1')}</span>
              <br />
              <span className="bg-linear-to-r from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
                {t('about.cta.title2')}
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('about.cta.subtitle')}
              <br />
              {t('about.cta.subtitleEnd')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-linear-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                asChild
              >
                <Link to="/explore">
                  <Target className="w-5 h-5" />
                  {t('about.cta.exploreQuests')}
                </Link>
              </Button>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90"
                asChild
              >
                <Link to="/" hash="create">
                  <Wand2 className="w-5 h-5" />
                  {t('about.cta.createYourQuest')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Quote */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Trophy className="w-12 h-12 text-primary mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl text-foreground font-medium leading-relaxed italic">
              "{t('about.finalQuote.text')}"
            </blockquote>
            <p className="text-muted-foreground mt-4">— {t('about.finalQuote.author')}</p>
          </motion.div>
        </div>
      </section>
      </div>
    </DefaultLayout>
  )
}
