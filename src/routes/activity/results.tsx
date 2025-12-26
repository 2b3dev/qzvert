import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { useAuthStore } from '../../stores/auth-store'
import {
  getActivityResults,
  getUserStats,
  type ActivityResult,
  type ActivityResultsResponse,
  type UserStats,
} from '../../server/activities'
import { DefaultLayout } from '../../components/layouts/DefaultLayout'

export const Route = createFileRoute('/activity/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const navigate = useNavigate()
  const { user, session, isInitialized } = useAuthStore()

  const [stats, setStats] = useState<UserStats | null>(null)
  const [results, setResults] = useState<ActivityResult[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const pageSize = 20

  // Redirect if not logged in (only after auth is initialized)
  useEffect(() => {
    if (isInitialized && !user) {
      navigate({ to: '/login' })
    }
  }, [user, navigate, isInitialized])

  // Load stats and initial results
  useEffect(() => {
    const loadData = async () => {
      if (!user || !session?.access_token) return

      setIsLoading(true)
      try {
        // Load stats and first page of results in parallel
        const [userStats, resultsData] = await Promise.all([
          getUserStats({ data: { accessToken: session.access_token } }),
          getActivityResults({
            data: { accessToken: session.access_token, page: 1, pageSize },
          }),
        ])

        setStats(userStats)
        setResults(resultsData.results)
        setTotal(resultsData.total)
        setHasMore(resultsData.hasMore)
        setPage(1)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, session])

  // Load more results
  const loadMore = async () => {
    if (!session?.access_token || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const resultsData = await getActivityResults({
        data: { accessToken: session.access_token, page: nextPage, pageSize },
      })

      setResults((prev) => [...prev, ...resultsData.results])
      setHasMore(resultsData.hasMore)
      setPage(nextPage)
    } catch (error) {
      console.error('Failed to load more:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Load specific page
  const goToPage = async (newPage: number) => {
    if (!session?.access_token || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const resultsData = await getActivityResults({
        data: { accessToken: session.access_token, page: newPage, pageSize },
      })

      setResults(resultsData.results)
      setHasMore(resultsData.hasMore)
      setPage(newPage)
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Failed to load page:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return `${mins}m ${secs}s`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const totalPages = Math.ceil(total / pageSize)

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button variant="ghost" onClick={() => navigate({ to: '/profile' })}>
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Activity Results
          </h1>
          <p className="text-muted-foreground mt-2">
            Your complete activity history and scores
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-primary/10">
                        <div className="text-2xl font-bold text-primary">
                          {stats.totalActivitiesPlayed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Activities Played
                        </div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                        <div className="text-2xl font-bold text-emerald-500">
                          {stats.completedActivities}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Completed
                        </div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-amber-500/10">
                        <div className="text-2xl font-bold text-amber-500">
                          {stats.totalScore.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Score
                        </div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-blue-500/10">
                        <div className="text-2xl font-bold text-blue-500">
                          {total}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Plays
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No stats available
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Results List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    All Results
                  </CardTitle>
                  <CardDescription>
                    {total} total plays
                    {totalPages > 1 && ` - Page ${page} of ${totalPages}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length > 0 ? (
                    <>
                      {/* Results Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                                Activity
                              </th>
                              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                                Type
                              </th>
                              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                                Date
                              </th>
                              <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground hidden md:table-cell">
                                Time
                              </th>
                              <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                                Score
                              </th>
                              <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((result, index) => (
                              <motion.tr
                                key={result.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                              >
                                <td className="py-3 px-2">
                                  <Link
                                    to="/activity/play/$id"
                                    params={{ id: result.activity_id }}
                                    className="flex items-center gap-3 hover:text-primary transition-colors"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                      {result.activity_thumbnail ? (
                                        <img
                                          src={result.activity_thumbnail}
                                          alt={result.activity_title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                          <Play className="w-4 h-4" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                                      {result.activity_title}
                                    </span>
                                  </Link>
                                </td>
                                <td className="py-3 px-2 hidden sm:table-cell">
                                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                                    {result.activity_type}
                                  </span>
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span className="hidden sm:inline">
                                      {formatDate(result.played_at)}
                                    </span>
                                    <span className="sm:hidden">
                                      {new Date(
                                        result.played_at,
                                      ).toLocaleDateString('th-TH', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center hidden md:table-cell">
                                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(result.time_spent)}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  {result.score !== null ? (
                                    <span className="font-medium text-primary">
                                      {result.score.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  {result.completed ? (
                                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      Incomplete
                                    </span>
                                  )}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(page - 1)}
                            disabled={page === 1 || isLoadingMore}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                  pageNum = i + 1
                                } else if (page <= 3) {
                                  pageNum = i + 1
                                } else if (page >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i
                                } else {
                                  pageNum = page - 2 + i
                                }
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={
                                      page === pageNum ? 'default' : 'ghost'
                                    }
                                    size="sm"
                                    onClick={() => goToPage(pageNum)}
                                    disabled={isLoadingMore}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                )
                              },
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(page + 1)}
                            disabled={page === totalPages || isLoadingMore}
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {isLoadingMore && (
                        <div className="flex justify-center mt-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No activity results yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start playing activities to see your results here!
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => navigate({ to: '/explore' })}
                      >
                        Explore Activities
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
        </div>
      </div>
    </DefaultLayout>
  )
}
