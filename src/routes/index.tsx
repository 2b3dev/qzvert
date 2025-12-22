import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Sparkles, Map, Zap, Brain, Trophy, Compass } from 'lucide-react'
import { QuestCreator } from '../components/QuestCreator'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered',
      description: 'Gemini transforms your content into engaging quests'
    },
    {
      icon: Map,
      title: 'Visual Learning Map',
      description: 'Navigate through stages like a game'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Learn from mistakes with fun explanations'
    },
    {
      icon: Trophy,
      title: 'Gamified Progress',
      description: 'Earn points and track achievements'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-10 h-10 text-purple-400" />
              </motion.div>
              <span className="text-purple-400 font-semibold tracking-wide uppercase text-sm">
                AI-Powered Edutainment
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="text-white">Transform Learning</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Into Adventure
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Turn any content into gamified "Learning Quests" with AI.
              Master new topics through interactive stages, quizzes, and instant feedback.
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
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm"
              >
                <feature.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quest Creator Section */}
      <section id="create" className="py-16 px-6">
        <QuestCreator />
      </section>
    </div>
  )
}
