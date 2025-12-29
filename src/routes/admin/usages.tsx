import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Loader2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import {
  checkAdminAccess,
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
