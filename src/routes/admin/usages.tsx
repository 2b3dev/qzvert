import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import {
  checkAdminAccess,
  getAIUsageStats,
  getDailyAIUsageChart,
  getDatabaseStats,
  getStorageStats,
  getTodayAIUsage,
  GEMINI_FREE_TIER,
  GEMINI_PRICING,
  type DatabaseStats,
  type StorageStats,
} from '../../server/admin-settings'
import type { AIUsageStats, AIUsageTimeRange } from '../../types/database'
import { cn } from '../../lib/utils'

export const Route = createFileRoute('/admin/usages')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminUsages,
})

interface TodayUsage {
  requests: number
  tokens: number
  requestsLimit: number
  tokensLimit: number
  isFreeTier: boolean
}

interface ChartData {
  date: string
  requests: number
  tokens: number
}

interface ChartSummary {
  totalRequests: number
  totalTokens: number
  estimatedCost: number
}

function AdminUsages() {
  const [loading, setLoading] = useState(true)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [aiStats, setAiStats] = useState<AIUsageStats | null>(null)
  const [todayUsage, setTodayUsage] = useState<TodayUsage | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [chartSummary, setChartSummary] = useState<ChartSummary | null>(null)
  const [chartLoading, setChartLoading] = useState(false)

  // Cost calculator state - editable pricing parameters
  const [calcInputPrice, setCalcInputPrice] = useState<string>(GEMINI_PRICING['gemini-2.0-flash'].input.toString())
  const [calcOutputPrice, setCalcOutputPrice] = useState<string>(GEMINI_PRICING['gemini-2.0-flash'].output.toString())
  const [calcFreeTierQuota, setCalcFreeTierQuota] = useState<string>(GEMINI_FREE_TIER.requestsPerDay.toString())
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '365d' | 'total'>('7d')
  const [showCostCalculator, setShowCostCalculator] = useState(false)

  // Convert selectedPeriod to chart time range
  const getChartTimeRange = (): AIUsageTimeRange => {
    if (selectedPeriod === '365d') return 'year'
    if (selectedPeriod === '30d' || selectedPeriod === 'total') return 'month'
    return 'week' // 1d and 7d use week
  }

  // Calculate cost estimation for different time periods
  const calculateCostEstimation = (
    inputTokens: number,
    outputTokens: number,
    requests: number,
    days: number,
    inputPrice: number,
    outputPrice: number,
    freeTierQuota: number
  ) => {
    // Calculate daily averages
    const avgInputTokensPerDay = inputTokens / Math.max(days, 1)
    const avgOutputTokensPerDay = outputTokens / Math.max(days, 1)
    const avgRequestsPerDay = requests / Math.max(days, 1)

    // For pay-as-you-go, only requests over free tier per day would trigger billing
    const paidRequestsPerDay = Math.max(0, avgRequestsPerDay - freeTierQuota)
    const freeRequestsPerDay = Math.min(avgRequestsPerDay, freeTierQuota)

    // Calculate daily token cost (using average tokens per request for paid requests)
    const avgInputPerRequest = requests > 0 ? inputTokens / requests : 0
    const avgOutputPerRequest = requests > 0 ? outputTokens / requests : 0

    // Only paid requests cost tokens
    const paidInputTokensPerDay = paidRequestsPerDay * avgInputPerRequest
    const paidOutputTokensPerDay = paidRequestsPerDay * avgOutputPerRequest

    const dailyCost = (paidInputTokensPerDay / 1_000_000) * inputPrice + (paidOutputTokensPerDay / 1_000_000) * outputPrice

    return {
      avgRequestsPerDay,
      freeRequestsPerDay,
      paidRequestsPerDay,
      avgInputTokensPerDay,
      avgOutputTokensPerDay,
      dailyCost,
      weeklyCost: dailyCost * 7,
      monthlyCost: dailyCost * 30,
      yearlyCost: dailyCost * 365,
      totalCost: (inputTokens / 1_000_000) * inputPrice + (outputTokens / 1_000_000) * outputPrice,
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [storageData, dbData, aiData, todayData, chartResult] = await Promise.all([
          getStorageStats(),
          getDatabaseStats(),
          getAIUsageStats({ data: { days: 30 } }),
          getTodayAIUsage(),
          getDailyAIUsageChart({ data: { timeRange: 'week' } }), // Default to week (7d)
        ])
        setStorageStats(storageData)
        setDbStats(dbData)
        setAiStats(aiData)
        setTodayUsage(todayData)
        setChartData(chartResult.data)
        setChartSummary(chartResult.summary)
      } catch (error) {
        console.error('Failed to fetch usage data:', error)
        toast.error('Failed to load usage data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch chart data when time range changes
  useEffect(() => {
    if (loading) return

    const fetchChart = async () => {
      setChartLoading(true)
      try {
        const timeRange = getChartTimeRange()
        const result = await getDailyAIUsageChart({ data: { timeRange } })
        setChartData(result.data)
        setChartSummary(result.summary)
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
      } finally {
        setChartLoading(false)
      }
    }

    fetchChart()
  }, [selectedPeriod, loading])

  if (loading) {
    return (
      <AdminLayout title="Usages" activeItem="usages">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  // Get Supabase project URL from env
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
  const dashboardUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/reports`
    : 'https://supabase.com/dashboard'

  return (
    <AdminLayout title="Usages" activeItem="usages">
      <div className="space-y-6 max-w-4xl">
        {/* Supabase Dashboard Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Server Metrics
                </h2>
                <p className="text-sm text-muted-foreground">
                  CPU, RAM, Connections
                </p>
              </div>
            </div>
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-medium transition-colors"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            View detailed server metrics including CPU usage, memory consumption,
            database connections, and API request statistics in the Supabase Dashboard.
          </p>
        </motion.div>

        {/* Gemini API Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Gemini API Usage
                </h2>
                <p className="text-sm text-muted-foreground">
                  AI generation statistics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://ai.google.dev/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-medium transition-colors"
              >
                <span>Pricing</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-medium transition-colors"
              >
                <span>AI Studio</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Cost Estimation - Always Visible */}
          {aiStats && (() => {
            const inputPrice = parseFloat(calcInputPrice) || 0
            const outputPrice = parseFloat(calcOutputPrice) || 0
            const freeTierQuota = parseFloat(calcFreeTierQuota) || 0
            const days = 30
            const estimation = calculateCostEstimation(
              aiStats.totalInputTokens,
              aiStats.totalOutputTokens,
              aiStats.totalRequests,
              days,
              inputPrice,
              outputPrice,
              freeTierQuota
            )

            return (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Estimated Cost</p>
                    <p className="text-xl font-bold text-foreground">
                      ${selectedPeriod === '7d' ? estimation.weeklyCost.toFixed(4) :
                        selectedPeriod === '30d' ? estimation.monthlyCost.toFixed(4) :
                        selectedPeriod === '365d' ? estimation.yearlyCost.toFixed(2) :
                        estimation.totalCost.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50">
                    {[
                      { key: '7d', label: '7D' },
                      { key: '30d', label: '30D' },
                      { key: '365d', label: '1Y' },
                      { key: 'total', label: 'All' },
                    ].map((period) => (
                      <button
                        key={period.key}
                        onClick={() => setSelectedPeriod(period.key as typeof selectedPeriod)}
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                          selectedPeriod === period.key
                            ? 'bg-purple-500 text-white'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Cost Calculator Settings - Collapsible */}
          <div className="mb-6">
            <button
              onClick={() => setShowCostCalculator(!showCostCalculator)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Cost Settings & Free Tier Limits</span>
              </div>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition-transform', showCostCalculator && 'rotate-180')} />
            </button>

            {showCostCalculator && (
              <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border space-y-3">
                {/* Free Tier Limits */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground text-[10px]">Free Tier</p>
                    <p className="font-medium text-foreground">
                      {GEMINI_FREE_TIER.requestsPerDay.toLocaleString()} req/day
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">RPM</p>
                    <p className="font-medium text-foreground">
                      {GEMINI_FREE_TIER.requestsPerMinute} req/min
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">TPM</p>
                    <p className="font-medium text-foreground">
                      {(GEMINI_FREE_TIER.tokensPerMinute / 1_000_000).toFixed(0)}M/min
                    </p>
                  </div>
                </div>

                {/* Editable Pricing Parameters */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Pricing Settings</p>
                    <button
                      onClick={() => {
                        setCalcInputPrice(GEMINI_PRICING['gemini-2.0-flash'].input.toString())
                        setCalcOutputPrice(GEMINI_PRICING['gemini-2.0-flash'].output.toString())
                        setCalcFreeTierQuota(GEMINI_FREE_TIER.requestsPerDay.toString())
                      }}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[10px] transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Input $/1M</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcInputPrice}
                        onChange={(e) => setCalcInputPrice(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Output $/1M</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcOutputPrice}
                        onChange={(e) => setCalcOutputPrice(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Free/Day</label>
                      <input
                        type="number"
                        value={calcFreeTierQuota}
                        onChange={(e) => setCalcFreeTierQuota(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Usage & Quota */}
          {todayUsage && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Today's Usage
                </h3>
                {todayUsage.isFreeTier ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500">
                    Free Tier
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500">
                    Pay-as-you-go
                  </span>
                )}
              </div>

              {/* Requests Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Requests</span>
                  <span className="font-medium">
                    {todayUsage.requests.toLocaleString()} / {todayUsage.requestsLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      todayUsage.requests / todayUsage.requestsLimit > 0.8
                        ? 'bg-red-500'
                        : todayUsage.requests / todayUsage.requestsLimit > 0.5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min((todayUsage.requests / todayUsage.requestsLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Status Message */}
              <div className="flex items-center gap-2 text-sm">
                {todayUsage.requests / todayUsage.requestsLimit > 0.8 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">
                      Approaching daily limit! Consider upgrading.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-muted-foreground">
                      {(todayUsage.requestsLimit - todayUsage.requests).toLocaleString()} requests remaining today
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Usage Chart */}
          <div className="mb-6">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Usage History
            </h3>

            {/* Chart */}
            <div className="relative h-48 rounded-xl bg-muted/30 border border-border p-4">
              {chartLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-full flex items-end gap-1">
                  {chartData.map((day, index) => {
                    const maxRequests = Math.max(
                      ...chartData.map((d) => d.requests),
                      1
                    )
                    const barHeight = (day.requests / maxRequests) * 100

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                            <p className="font-medium text-foreground mb-1">
                              {getChartTimeRange() === 'year'
                                ? new Date(day.date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                : new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-purple-500">{day.requests} requests</p>
                            <p className="text-muted-foreground">{(day.tokens / 1000).toFixed(1)}K tokens</p>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="w-full flex flex-col justify-end h-32">
                          {barHeight > 0 ? (
                            <div
                              className="w-full bg-purple-500 rounded-t transition-all"
                              style={{ height: `${barHeight}%`, minHeight: '2px' }}
                            />
                          ) : (
                            <div className="w-full h-0.5 bg-muted rounded" />
                          )}
                        </div>

                        {/* Date label - show every few bars based on data length */}
                        {(index === 0 ||
                          index === chartData.length - 1 ||
                          (getChartTimeRange() === 'week') ||
                          (getChartTimeRange() === 'month' && index % 5 === 0) ||
                          (getChartTimeRange() === 'year')) && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-full">
                            {getChartTimeRange() === 'year'
                              ? new Date(day.date + '-01').toLocaleDateString('en-US', { month: 'short' })
                              : new Date(day.date).toLocaleDateString('en-US', { day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No usage data for this period
                </div>
              )}
            </div>

            {/* Summary */}
            {chartSummary && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500" />
                  <span className="text-muted-foreground">Requests</span>
                  <span className="font-medium">{chartSummary.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tokens</span>
                  <span className="font-medium">{(chartSummary.totalTokens / 1000).toFixed(1)}K</span>
                </div>
              </div>
            )}
          </div>

        </motion.div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-500">
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Storage</h2>
            </div>

            {storageStats && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Thumbnails</span>
                  <span className="font-medium text-foreground">
                    {storageStats.thumbnailsCount} files (
                    {storageStats.thumbnailsSizeMB} MB)
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Total Used</span>
                  <span className="font-medium text-foreground">
                    {storageStats.totalStorageMB} MB
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Database Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-blue-500">
                <Database className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Database
              </h2>
            </div>

            {dbStats && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Profiles</span>
                  <span className="font-medium text-foreground">
                    {dbStats.profilesCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Activities</span>
                  <span className="font-medium text-foreground">
                    {dbStats.activitiesCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Stages</span>
                  <span className="font-medium text-foreground">
                    {dbStats.stagesCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Questions</span>
                  <span className="font-medium text-foreground">
                    {dbStats.questionsCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Reports</span>
                  <span className="font-medium text-foreground">
                    {dbStats.reportsCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Play Records</span>
                  <span className="font-medium text-foreground">
                    {dbStats.playRecordsCount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
