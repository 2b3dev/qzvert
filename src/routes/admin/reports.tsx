import { createFileRoute, redirect, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  AlertTriangle,
  Shield,
  Ban,
  FileWarning,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Filter,
  ChevronDown,
  ExternalLink,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import {
  checkAdminAccess,
  getReports,
  getReportStats,
  updateReportStatus,
  type ReportWithContent,
  type ReportStatus,
  type ReportReason
} from '../../server/reports'

export const Route = createFileRoute('/admin/reports')({
  validateSearch: (search: Record<string, unknown>): { status?: ReportStatus } => {
    return {
      status: (search.status as ReportStatus) || undefined,
    }
  },
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminReports,
})

const reasonIcons: Record<ReportReason, React.ReactNode> = {
  inappropriate: <AlertTriangle className="w-4 h-4" />,
  spam: <Ban className="w-4 h-4" />,
  copyright: <Shield className="w-4 h-4" />,
  misinformation: <FileWarning className="w-4 h-4" />,
  harassment: <Flag className="w-4 h-4" />,
  other: <AlertTriangle className="w-4 h-4" />,
}

const reasonLabels: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate',
  spam: 'Spam',
  copyright: 'Copyright',
  misinformation: 'Misinformation',
  harassment: 'Harassment',
  other: 'Other',
}

const statusColors: Record<ReportStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-500',
  reviewed: 'bg-blue-500/20 text-blue-500',
  resolved: 'bg-green-500/20 text-green-500',
  dismissed: 'bg-gray-500/20 text-gray-400',
}

const statusIcons: Record<ReportStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  reviewed: <Eye className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  dismissed: <XCircle className="w-4 h-4" />,
}

function AdminReports() {
  const search = useSearch({ from: '/admin/reports' })
  const [reports, setReports] = useState<ReportWithContent[]>([])
  const [stats, setStats] = useState<{ pending: number; reviewed: number; resolved: number; dismissed: number }>({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(search.status || 'all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportWithContent | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Fetch reports and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [reportsData, statsData] = await Promise.all([
          getReports({ data: { status: statusFilter === 'all' ? undefined : statusFilter } }),
          getReportStats(),
        ])
        setReports(reportsData.reports)
        setStats(statsData.byStatus)
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [statusFilter])

  const handleStatusUpdate = async (reportId: string, newStatus: ReportStatus) => {
    setUpdatingStatus(reportId)
    try {
      await updateReportStatus({
        data: {
          reportId,
          status: newStatus,
          adminNotes: adminNotes || undefined,
        },
      })

      // Update local state
      setReports(prev =>
        prev.map(r =>
          r.id === reportId ? { ...r, status: newStatus, admin_notes: adminNotes || null } : r
        )
      )

      // Update stats
      setStats(prev => {
        const report = reports.find(r => r.id === reportId)
        if (!report) return prev

        return {
          ...prev,
          [report.status]: Math.max(0, prev[report.status] - 1),
          [newStatus]: prev[newStatus] + 1,
        }
      })

      setSelectedReport(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminLayout
      title="Reports"
      activeItem="reports"
      pendingReportsCount={stats.pending}
    >
      <div className="space-y-6">
            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-200"
                >
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">{statusFilter === 'all' ? 'All Reports' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full mt-2 left-0 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl py-2 z-10"
                    >
                      <button
                        onClick={() => {
                          setStatusFilter('all')
                          setShowFilterMenu(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm hover:bg-accent/50 transition-all duration-200',
                          statusFilter === 'all' && 'text-primary bg-primary/10'
                        )}
                      >
                        <span className="font-medium">All Reports</span>
                      </button>
                      {(['pending', 'reviewed', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status)
                            setShowFilterMenu(false)
                          }}
                          className={cn(
                            'w-full px-4 py-2.5 text-left text-sm hover:bg-accent/50 transition-all duration-200 flex items-center gap-2',
                            statusFilter === status && 'text-primary bg-primary/10'
                          )}
                        >
                          {statusIcons[status]}
                          <span className="font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-sm text-muted-foreground font-medium">
                {reports.length} report{reports.length !== 1 && 's'}
              </p>
            </motion.div>

            {/* Reports List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center py-16 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl"
              >
                <div className="p-4 rounded-2xl bg-rose-500/20 w-fit mx-auto mb-4">
                  <Flag className="w-12 h-12 text-rose-500" />
                </div>
                <p className="text-lg text-muted-foreground">No reports found</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Report Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={cn('p-2 rounded-xl', statusColors[report.status])}>
                              {statusIcons[report.status]}
                            </div>
                            <span className={cn('text-sm font-semibold', statusColors[report.status].split(' ')[1])}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {reasonIcons[report.reason]}
                              <span className="text-sm font-medium">{reasonLabels[report.reason]}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            {report.content?.thumbnail && (
                              <img
                                src={report.content.thumbnail}
                                alt=""
                                className="w-16 h-12 rounded-xl object-cover ring-2 ring-border/50"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {report.content?.title || 'Unknown Activity'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Reported {formatDate(report.created_at)}
                              </p>
                            </div>
                          </div>

                          {report.additional_info && (
                            <div className="bg-muted/30 rounded-xl p-3 mb-3 hover:bg-muted/50 transition-colors">
                              <p className="text-sm text-muted-foreground flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                                {report.additional_info}
                              </p>
                            </div>
                          )}

                          {report.admin_notes && (
                            <div className="bg-primary/10 rounded-xl p-3">
                              <p className="text-sm text-primary flex items-start gap-2">
                                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                                <span><strong>Admin notes:</strong> {report.admin_notes}</span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <a
                            href={`/activity/play/${report.content_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 text-sm transition-all duration-200 font-medium"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setSelectedReport(report)
                              setAdminNotes(report.admin_notes || '')
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

        {/* Update Status Modal */}
        <AnimatePresence>
          {selectedReport && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReport(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
              >
                <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden mx-4">
                  <div className="p-5 border-b border-border/50 bg-rose-500/10">
                    <h3 className="text-lg font-semibold text-foreground">Update Report Status</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReport.content?.title || 'Unknown Activity'}
                    </p>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Admin Notes (optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this report..."
                        className="w-full px-4 py-3 rounded-xl border border-border/50 bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Set Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['pending', 'reviewed', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
                          <Button
                            key={status}
                            variant={selectedReport.status === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusUpdate(selectedReport.id, status)}
                            disabled={updatingStatus === selectedReport.id}
                            className="justify-start rounded-xl"
                          >
                            {updatingStatus === selectedReport.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <span className="mr-2">{statusIcons[status]}</span>
                            )}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 p-5 border-t border-border/50 bg-muted/30">
                    <Button variant="ghost" onClick={() => setSelectedReport(null)} className="rounded-xl">
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
