import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import {
  checkAdminAccess,
  clearAllReports,
  clearOldPlayRecords,
  getDatabaseStats,
  getStorageStats,
  type DatabaseStats,
  type StorageStats,
} from '../../server/admin-settings'

export const Route = createFileRoute('/admin/usages')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminUsages,
})

function AdminUsages() {
  const [loading, setLoading] = useState(true)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)

  // Danger zone loading states
  const [clearingReports, setClearingReports] = useState(false)
  const [clearingRecords, setClearingRecords] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [storageData, dbData] = await Promise.all([
          getStorageStats(),
          getDatabaseStats(),
        ])
        setStorageStats(storageData)
        setDbStats(dbData)
      } catch (error) {
        console.error('Failed to fetch usage data:', error)
        toast.error('Failed to load usage data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleClearReports = async () => {
    if (
      !confirm(
        'Are you sure you want to delete all resolved reports? This cannot be undone.',
      )
    )
      return

    setClearingReports(true)
    try {
      const result = await clearAllReports()
      toast.success(`Deleted ${result.deletedCount} resolved reports`)
      // Refresh db stats
      const dbData = await getDatabaseStats()
      setDbStats(dbData)
    } catch (error) {
      console.error('Failed to clear reports:', error)
      toast.error('Failed to clear reports')
    } finally {
      setClearingReports(false)
    }
  }

  const handleClearOldRecords = async () => {
    if (
      !confirm(
        'Are you sure you want to delete play records older than 90 days? This cannot be undone.',
      )
    )
      return

    setClearingRecords(true)
    try {
      const result = await clearOldPlayRecords({ data: { daysOld: 90 } })
      toast.success(`Deleted ${result.deletedCount} old play records`)
      // Refresh db stats
      const dbData = await getDatabaseStats()
      setDbStats(dbData)
    } catch (error) {
      console.error('Failed to clear records:', error)
      toast.error('Failed to clear records')
    } finally {
      setClearingRecords(false)
    }
  }

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
          className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-emerald-500/30 transition-all duration-300"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
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
          </div>
        </motion.div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-amber-500/30 transition-all duration-300"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
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
            </div>
          </motion.div>

          {/* Database Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
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
            </div>
          </motion.div>
        </div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 backdrop-blur-sm border border-rose-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-linear-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-rose-500">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">
                  Clear Resolved Reports
                </p>
                <p className="text-sm text-muted-foreground">
                  Delete all reports with &quot;resolved&quot; status
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearReports}
                disabled={clearingReports}
                className="rounded-xl"
              >
                {clearingReports ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Reports
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">
                  Clear Old Play Records
                </p>
                <p className="text-sm text-muted-foreground">
                  Delete play records older than 90 days
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearOldRecords}
                disabled={clearingRecords}
                className="rounded-xl"
              >
                {clearingRecords ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Records
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
