import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Compass,
  FileText,
  Folder,
  Gamepad2,
  Layers,
  Loader2,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { PostCard } from '../../components/blog/PostCard'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import {
  getActivitiesByCategory,
  getCategoriesWithCount,
  getCategoryBySlug,
} from '../../server/categories'
import { getPublishedPosts } from '../../server/posts'

export const Route = createFileRoute('/categories/$slug')({
  component: CategoryDetailPage,
  loader: async ({ params }) => {
    const category = await getCategoryBySlug({ slug: params.slug })
    if (!category) {
      throw notFound()
    }
    return { category }
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category
    return {
      meta: [
        { title: `${category?.name || 'Category'} - QzVert` },
        { name: 'description', content: category?.description || `Browse posts and activities in ${category?.name}` },
      ],
    }
  },
})

type TabType = 'all' | 'posts' | 'activities'

// Get icon and gradient for each activity type
const getActivityTypeStyle = (type: string) => {
  switch (type) {
    case 'quiz':
      return {
        icon: BrainCircuit,
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      }
    case 'quest':
      return {
        icon: Compass,
        gradient: 'from-amber-500 via-orange-500 to-red-500',
      }
    case 'lesson':
      return {
        icon: BookOpen,
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      }
    case 'flashcard':
      return {
        icon: Layers,
        gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      }
    case 'roleplay':
      return {
        icon: MessageSquare,
        gradient: 'from-pink-500 via-rose-500 to-red-500',
      }
    default:
      return {
        icon: Sparkles,
        gradient: 'from-primary via-purple-500 to-pink-500',
      }
  }
}

interface ActivityCardProps {
  activity: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    type: string
    play_count: number
    profiles: { display_name: string | null; avatar_url: string | null } | null
  }
}

function ActivityCard({ activity }: ActivityCardProps) {
  const typeStyle = getActivityTypeStyle(activity.type)
  const TypeIcon = typeStyle.icon

  return (
    <Link
      to="/activity/play/$id"
      params={{ id: activity.id }}
      className="group block"
    >
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
        {/* Thumbnail or gradient */}
        {activity.thumbnail ? (
          <div className="relative w-full h-40 overflow-hidden">
            <img
              src={activity.thumbnail}
              alt={activity.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className={cn('relative w-full h-40 bg-gradient-to-br', typeStyle.gradient)}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-white/30 rounded-full scale-150" />
                <TypeIcon className="relative w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
                <Zap className="absolute -top-2 -right-3 w-5 h-5 text-white/80 rotate-12" />
                <Sparkles className="absolute -bottom-1 -left-4 w-4 h-4 text-white/70" />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {activity.type}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {activity.play_count.toLocaleString()}
            </span>
          </div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {activity.description.replace(/<[^>]*>/g, '')}
            </p>
          )}
          {activity.profiles && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {activity.profiles.avatar_url ? (
                <img
                  src={activity.profiles.avatar_url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {(activity.profiles.display_name || 'A')[0].toUpperCase()}
                </div>
              )}
              <span className="truncate">{activity.profiles.display_name || 'Anonymous'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function CategoryDetailPage() {
  const { category } = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [postsPage, setPostsPage] = useState(1)
  const [activitiesPage, setActivitiesPage] = useState(1)

  // Fetch posts in this category
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'published', 'category', category.slug, postsPage],
    queryFn: () => getPublishedPosts({ page: postsPage, limit: 6, categorySlug: category.slug }),
  })

  // Fetch activities in this category
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'category', category.slug, activitiesPage],
    queryFn: () => getActivitiesByCategory({ categorySlug: category.slug, page: activitiesPage, limit: 6 }),
  })

  // Fetch all categories for sidebar
  const { data: categories } = useQuery({
    queryKey: ['categories', 'withCount'],
    queryFn: getCategoriesWithCount,
  })

  const tabs = [
    { id: 'all' as const, label: 'All', icon: Folder },
    { id: 'posts' as const, label: 'Posts', icon: FileText, count: postsData?.total || 0 },
    { id: 'activities' as const, label: 'Activities', icon: Gamepad2, count: activitiesData?.total || 0 },
  ]

  const showPosts = activeTab === 'all' || activeTab === 'posts'
  const showActivities = activeTab === 'all' || activeTab === 'activities'

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background py-12">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/categories" className="hover:text-foreground transition-colors">
                Categories
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{category.name}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Folder className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
                {category.description && (
                  <p className="text-muted-foreground mt-1">{category.description}</p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mt-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-xs',
                        activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-background'
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Posts Section */}
              {showPosts && (
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Posts
                    </h2>
                    {activeTab === 'all' && (postsData?.total || 0) > 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('posts')}
                        className="gap-1"
                      >
                        View all
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {postsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : postsData?.posts.length ? (
                    <>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {postsData.posts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>

                      {/* Posts Pagination */}
                      {activeTab === 'posts' && postsData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                            disabled={postsPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground px-4">
                            Page {postsPage} of {postsData.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPostsPage((p) => Math.min(postsData.totalPages, p + 1))}
                            disabled={postsPage === postsData.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No posts in this category yet.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Activities Section */}
              {showActivities && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-primary" />
                      Activities
                    </h2>
                    {activeTab === 'all' && (activitiesData?.total || 0) > 6 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('activities')}
                        className="gap-1"
                      >
                        View all
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {activitiesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : activitiesData?.activities.length ? (
                    <>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activitiesData.activities.map((activity) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <ActivityCard activity={activity} />
                          </motion.div>
                        ))}
                      </div>

                      {/* Activities Pagination */}
                      {activeTab === 'activities' && activitiesData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivitiesPage((p) => Math.max(1, p - 1))}
                            disabled={activitiesPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground px-4">
                            Page {activitiesPage} of {activitiesData.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivitiesPage((p) => Math.min(activitiesData.totalPages, p + 1))}
                            disabled={activitiesPage === activitiesData.totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
                      <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No activities in this category yet.</p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="bg-card border rounded-xl p-5 sticky top-24">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Categories
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to="/categories/$slug"
                          params={{ slug: cat.slug }}
                          className={cn(
                            'flex items-center justify-between py-2 px-3 rounded-lg transition-colors',
                            cat.slug === category.slug
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )}
                        >
                          <span className="text-sm">{cat.name}</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded',
                              cat.slug === category.slug
                                ? 'bg-primary-foreground/20'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {cat.post_count + cat.activity_count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}
