import IconApp from '@/components/icon/icon-app'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Compass,
  GraduationCap,
  Languages,
  Map,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { QuestCreator } from '../components/QuestCreator'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Gemini AI transforms content into quests',
    },
    {
      icon: Map,
      title: 'Learning Map',
      description: 'Navigate stages like a game',
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Learn with fun explanations',
    },
    {
      icon: Trophy,
      title: 'Gamified',
      description: 'Points, lives, and achievements',
    },
  ]

  const useCases = [
    {
      icon: GraduationCap,
      title: 'Smart Quiz',
      description: 'สร้าง Quiz อัตโนมัติจาก Text/PDF/Video',
      tag: 'Entry Point',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Map,
      title: 'Quest Course',
      description: 'เปลี่ยนคอร์สเป็นเกม RPG พร้อม Learning Map',
      tag: 'Gamified',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BookOpen,
      title: 'Flashcard RPG',
      description: 'ท่องจำด้วยการสะสมการ์ดพลัง',
      tag: 'Memorize',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: MessageSquare,
      title: 'Roleplay Agent',
      description: 'ฝึกทักษะผ่านบทสนทนากับ AI',
      tag: 'Immersive',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <IconApp className="w-8 h-8" color={'hsl(var(--foreground))'} />
              </motion.div>
              <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                AI-Powered Edutainment
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="text-foreground">Content is Cheap</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent">
                Context is Priceless
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
              เปลี่ยน "ขยะข้อมูล" ให้กลายเป็น "เส้นทางการเรียนรู้ที่สนุก"
            </p>
            <p className="text-base text-muted-foreground/80 max-w-xl mx-auto mb-8">
              AI Game Master ที่เปลี่ยนเนื้อหา (PDF, YouTube, Text) เป็นภารกิจ
              RPG ด้วย Octalysis Gamification Framework
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button size="lg" asChild>
                <a href="#create">
                  <Sparkles className="w-5 h-5" />
                  Start Creating
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/explore">
                  <Compass className="w-5 h-5" />
                  Explore Quests
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="p-4 rounded-xl bg-card border border-border backdrop-blur-sm"
              >
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              4 Ways to Transform Learning
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              เลือกรูปแบบที่เหมาะกับการเรียนรู้ของคุณ
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative p-6 rounded-2xl bg-card border border-border overflow-hidden"
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Tag */}
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${useCase.color} text-white mb-4`}
                >
                  {useCase.tag}
                </span>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center mb-4`}
                >
                  <useCase.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {useCase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quest Creator Section */}
      <section id="create" className="py-16 px-6">
        <QuestCreator />
      </section>
    </div>
  )
}
