import { createFileRoute, redirect } from '@tanstack/react-router'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  Map,
  MoreVertical,
  Pencil,
  Play,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import {
  PaginatedTable,
  TableCellBadge,
  TableCellMuted,
} from '../../components/ui/paginated-table'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  getAdminActivities,
  getAdminActivityStats,
  updateActivityStatus,
  deleteActivityAdmin,
} from '../../server/admin-activities'
import type { ActivityStatus } from '../../types/database'

type ActivityType = 'quiz' | 'quest' | 'flashcard' | 'roleplay' | 'lesson'

interface AdminActivity {
  id: string
  title: string
  thumbnail: string | null
  type: ActivityType
  status: ActivityStatus
  play_count: number
  created_at: string
  user_id: string | null
  profile: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

export const Route = createFileRoute('/admin/activities')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminActivities,
})

function AdminActivities() {
  const [activities, setActivities] = useState<Array<AdminActivity>>([])
  const [totalActivities, setTotalActivities] = useState(0)
  const [stats, setStats] = useState<{
    total: number
    public: number
    draft: number
    private_group: number
    link: number
    quiz: number
    quest: number
    lesson: number
    thisWeek: number
    thisMonth: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>(
    'all',
  )
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ])

  // Map column id to server sortBy field
  const columnIdToSortBy: Record<
    string,
    'created_at' | 'title' | 'play_count'
  > = {
    title: 'title',
    created_at: 'created_at',
    play_count: 'play_count',
  }

  // Fetch activities and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const columnId = sorting[0]?.id || 'created_at'
        const sortBy = columnIdToSortBy[columnId] || 'created_at'
        const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'

        const [activitiesData, statsData] = await Promise.all([
          getAdminActivities({
            data: {
              search: searchQuery || undefined,
              status: statusFilter === 'all' ? undefined : statusFilter,
              type: typeFilter === 'all' ? undefined : typeFilter,
              sortBy,
              sortOrder,
              page: pageIndex + 1,
              pageSize,
            },
          }),
          getAdminActivityStats(),
        ])
        setActivities(activitiesData.activities)
        setTotalActivities(activitiesData.total)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch activities:', error)
        toast.error('Failed to load activities')
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchData, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, statusFilter, typeFilter, sorting, pageIndex, pageSize])

  const handleStatusUpdate = async (
    activityId: string,
    newStatus: ActivityStatus,
  ) => {
    setUpdatingStatus(activityId)
    try {
      await updateActivityStatus({ data: { activityId, status: newStatus } })

      // Update local state
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, status: newStatus } : a,
        ),
      )

      toast.success(`Activity status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status',
      )
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    setDeletingId(activityId)
    try {
      await deleteActivityAdmin({ data: { activityId } })

      // Remove from local state
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
      setTotalActivities((prev) => prev - 1)

      toast.success('Activity deleted successfully')
    } catch (error) {
      console.error('Failed to delete activity:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete activity',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'quiz':
        return <Sparkles className="w-4 h-4" />
      case 'quest':
        return <Map className="w-4 h-4" />
      case 'lesson':
        return <BookOpen className="w-4 h-4" />
      case 'flashcard':
        return <GraduationCap className="w-4 h-4" />
      case 'roleplay':
        return <Users className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'public':
        return 'success'
      case 'draft':
        return 'default'
      case 'private_group':
        return 'info'
      case 'link':
        return 'warning'
      default:
        return 'default'
    }
  }

  // Define columns for the table
  const columns = useMemo<Array<ColumnDef<AdminActivity>>>(() => {
    return [
      {
        id: 'title',
        header: 'Activity',
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => {
          const activity = row.original
          return (
            <div className="flex items-center gap-3">
              {activity.thumbnail ? (
                <img
                  src={activity.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getTypeIcon(activity.type)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.profile?.display_name || 'Anonymous'}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        cell: ({ row }) => {
          const activity = row.original
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {getTypeIcon(activity.type)}
              <span className="capitalize text-sm">{activity.type}</span>
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const activity = row.original
          return (
            <TableCellBadge variant={getStatusColor(activity.status)}>
              {activity.status === 'private_group'
                ? 'Private'
                : activity.status}
            </TableCellBadge>
          )
        },
      },
      {
        id: 'play_count',
        header: 'Plays',
        accessorKey: 'play_count',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground">
              {row.original.play_count.toLocaleString()}
            </span>
          </div>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        accessorKey: 'created_at',
        enableSorting: true,
        cell: ({ row }) => (
          <TableCellMuted>{formatDate(row.original.created_at)}</TableCellMuted>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const activity = row.original
          const isUpdating = updatingStatus === activity.id
          const isDeleting = deletingId === activity.id

          return (
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isUpdating || isDeleting}
                  >
                    {isUpdating || isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreVertical className="w-4 h-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a
                      href={`/activity/play/${activity.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      View Activity
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={`/activity/upload/quiz/${activity.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Activity
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Change Status
                  </DropdownMenuLabel>
                  {(
                    ['public', 'draft', 'private_group', 'link'] as const
                  ).map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusUpdate(activity.id, status)}
                      disabled={isUpdating || activity.status === status}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer',
                        activity.status === status && 'opacity-50',
                        status === 'public' &&
                          'text-green-500 focus:text-green-500',
                        status === 'draft' &&
                          'text-gray-400 focus:text-gray-400',
                        status === 'private_group' &&
                          'text-blue-500 focus:text-blue-500',
                        status === 'link' &&
                          'text-amber-500 focus:text-amber-500',
                      )}
                    >
                      {status === 'public' && <Sparkles className="w-4 h-4" />}
                      {status === 'draft' && <Pencil className="w-4 h-4" />}
                      {status === 'private_group' && (
                        <Users className="w-4 h-4" />
                      )}
                      {status === 'link' && <ExternalLink className="w-4 h-4" />}
                      {status === 'private_group' ? 'Private Group' : status}
                      {activity.status === status && ' (current)'}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(activity.id)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Activity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ]
  }, [updatingStatus, deletingId])

  const pageCount = Math.ceil(totalActivities / pageSize)

  return (
    <AdminLayout title="Activities" activeItem="activities">
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <FileText className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Activities</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Sparkles className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.public}
              </p>
              <p className="text-sm text-muted-foreground">Public</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gray-500/20">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.thisWeek}
              </p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.thisMonth}
              </p>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPageIndex(0)
              }}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFilterMenu(!showFilterMenu)
                setShowTypeMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>
                {statusFilter === 'all'
                  ? 'All Status'
                  : statusFilter === 'private_group'
                    ? 'Private'
                    : statusFilter}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-0 w-40 bg-card border border-border rounded-lg shadow-lg py-2 z-10"
                >
                  {(
                    ['all', 'public', 'draft', 'private_group', 'link'] as const
                  ).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status)
                        setShowFilterMenu(false)
                        setPageIndex(0)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2',
                        statusFilter === status && 'text-primary',
                      )}
                    >
                      {status === 'all' && <FileText className="w-4 h-4" />}
                      {status === 'public' && <Sparkles className="w-4 h-4" />}
                      {status === 'draft' && <Pencil className="w-4 h-4" />}
                      {status === 'private_group' && (
                        <Users className="w-4 h-4" />
                      )}
                      {status === 'link' && <ExternalLink className="w-4 h-4" />}
                      {status === 'all'
                        ? 'All Status'
                        : status === 'private_group'
                          ? 'Private'
                          : status}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTypeMenu(!showTypeMenu)
                setShowFilterMenu(false)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              {typeFilter === 'all' ? (
                <FileText className="w-4 h-4" />
              ) : (
                getTypeIcon(typeFilter)
              )}
              <span className="capitalize">
                {typeFilter === 'all' ? 'All Types' : typeFilter}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showTypeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-0 w-40 bg-card border border-border rounded-lg shadow-lg py-2 z-10"
                >
                  {(
                    ['all', 'quiz', 'quest', 'lesson'] as const
                  ).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilter(type)
                        setShowTypeMenu(false)
                        setPageIndex(0)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2',
                        typeFilter === type && 'text-primary',
                      )}
                    >
                      {type === 'all' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        getTypeIcon(type)
                      )}
                      <span className="capitalize">
                        {type === 'all' ? 'All Types' : type}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-sm text-muted-foreground ml-auto">
            {totalActivities} activit{totalActivities !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        {/* Activities Table */}
        <PaginatedTable
          columns={columns}
          data={activities}
          loading={loading}
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={(updater) => {
            const newState =
              typeof updater === 'function'
                ? updater({ pageIndex, pageSize })
                : updater
            setPageIndex(newState.pageIndex)
          }}
          manualPagination
          sorting={sorting}
          onSortingChange={setSorting}
          manualSorting
          emptyMessage="No activities found"
          emptyIcon={
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          }
        />
      </div>

      {/* Click outside handler for filter dropdowns */}
      {(showFilterMenu || showTypeMenu) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowFilterMenu(false)
            setShowTypeMenu(false)
          }}
        />
      )}
    </AdminLayout>
  )
}
