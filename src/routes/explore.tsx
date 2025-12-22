import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Search, Compass, BookOpen, Clock, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Input } from '../components/ui/input'

export const Route = createFileRoute('/explore')({
  component: ExplorePage
})

// Mock data for explore page - in production, this would come from Supabase
const mockQuests = [
  {
    id: '1',
    title: 'JavaScript Fundamentals',
    description: 'Master the basics of JavaScript programming',
    stages: 5,
    plays: 1234,
    category: 'Programming',
    created_at: '2024-01-15'
  },
  {
    id: '2',
    title: 'React Hooks Deep Dive',
    description: 'Understanding useState, useEffect, and custom hooks',
    stages: 4,
    plays: 892,
    category: 'Programming',
    created_at: '2024-01-20'
  },
  {
    id: '3',
    title: 'World War II History',
    description: 'Key events and turning points of WWII',
    stages: 6,
    plays: 567,
    category: 'History',
    created_at: '2024-01-18'
  },
  {
    id: '4',
    title: 'Basic Chemistry',
    description: 'Atoms, molecules, and chemical reactions',
    stages: 5,
    plays: 445,
    category: 'Science',
    created_at: '2024-01-22'
  },
  {
    id: '5',
    title: 'Spanish for Beginners',
    description: 'Essential vocabulary and grammar',
    stages: 8,
    plays: 1567,
    category: 'Language',
    created_at: '2024-01-10'
  },
  {
    id: '6',
    title: 'Machine Learning Basics',
    description: 'Introduction to ML concepts and algorithms',
    stages: 7,
    plays: 789,
    category: 'Programming',
    created_at: '2024-01-25'
  }
]

const categories = ['All', 'Programming', 'History', 'Science', 'Language', 'Math']

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredQuests = mockQuests.filter(quest => {
    const matchesSearch = quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || quest.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Compass className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-black text-white">
              Explore Quests
            </h1>
          </div>
          <p className="text-xl text-slate-400">
            Discover learning adventures created by the community
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search quests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <Button variant="default" asChild>
              <Link to="/">
                <Sparkles className="w-4 h-4" />
                Create New Quest
              </Link>
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quest Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredQuests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="h-full hover:border-purple-500/50 transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium mb-2">
                        {quest.category}
                      </span>
                      <CardTitle className="text-xl group-hover:text-purple-300 transition-colors">
                        {quest.title}
                      </CardTitle>
                    </div>
                    <BookOpen className="w-6 h-6 text-slate-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {quest.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {quest.stages} stages
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {quest.plays.toLocaleString()}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(quest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Start Quest
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredQuests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No quests found</h3>
            <p className="text-slate-400 mb-6">
              Try adjusting your search or create a new quest
            </p>
            <Button asChild>
              <Link to="/">
                <Sparkles className="w-4 h-4" />
                Create New Quest
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30">
            <CardContent className="py-6 text-center">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Semantic Search Coming Soon
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                We're building AI-powered semantic search to help you find the perfect quest.
                Connect your Supabase database to enable full functionality.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
