import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import {
  Loader2,
  Users,
  Search,
  ChevronDown,
  Filter,
  Crown,
  Calendar,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  GraduationCap,
  Pencil,
  Trash2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '../../components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  PaginatedTable,
  TableAvatar,
  TableCellBadge,
  TableCellMuted,
} from '../../components/ui/paginated-table'
import { cn } from '../../lib/utils'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { checkAdminAccess } from '../../server/reports'
import {
  getUsers,
  getUserStats,
  updateUserRole,
  type UserProfile,
  type UserRole,
} from '../../server/users'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminUsers,
})

function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [stats, setStats] = useState<{
    total: number
    admins: number
    creators: number
    learners: number
    thisWeek: number
    thisMonth: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ])

  // Map column id to server sortBy field
  const columnIdToSortBy: Record<string, 'created_at' | 'display_name' | 'activity_count'> = {
    user: 'display_name',
    display_name: 'display_name',
    created_at: 'created_at',
    activity_count: 'activity_count',
  }

  // Fetch users and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const columnId = sorting[0]?.id || 'created_at'
        const sortBy = columnIdToSortBy[columnId] || 'created_at'
        const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'

        const [usersData, statsData] = await Promise.all([
          getUsers({
            data: {
              search: searchQuery || undefined,
              role: roleFilter === 'all' ? undefined : roleFilter,
              sortBy,
              sortOrder,
              showDeleted,
              page: pageIndex + 1,
              pageSize,
            }
          }),
          getUserStats(),
        ])
        setUsers(usersData.users)
        setTotalUsers(usersData.total)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchData, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, roleFilter, sorting, showDeleted, pageIndex, pageSize])

  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId)
    try {
      await updateUserRole({ data: { userId, role: newRole } })

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      )

      // Update stats
      if (stats) {
        const oldRole = users.find(u => u.id === userId)?.role
        if (oldRole && oldRole !== newRole) {
          setStats(prev => {
            if (!prev) return prev
            const updated = { ...prev }
            // Decrease old role count
            if (oldRole === 'admin') updated.admins--
            else if (oldRole === 'creator') updated.creators--
            else if (oldRole === 'learner') updated.learners--
            // Increase new role count
            if (newRole === 'admin') updated.admins++
            else if (newRole === 'creator') updated.creators++
            else if (newRole === 'learner') updated.learners++
            return updated
          })
        }
      }

      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setUpdatingRole(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDaysUntilHardDelete = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt)
    const hardDeleteDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const daysRemaining = Math.ceil((hardDeleteDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    return daysRemaining
  }

  // Define columns for the table
  const columns = useMemo<ColumnDef<UserProfile>[]>(() => {
    const baseColumns: ColumnDef<UserProfile>[] = [
      {
        id: 'display_name',
        header: 'Display Name',
        accessorKey: 'display_name',
        enableSorting: true,
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-3">
              <TableAvatar
                src={user.avatar_url}
                fallback={user.display_name || user.email || 'U'}
              />
              <p className="font-medium text-foreground">
                {user.display_name || 'Anonymous'}
              </p>
            </div>
          )
        },
      },
      {
        id: 'email',
        header: 'Email',
        accessorKey: 'email',
        cell: ({ row }) => (
          <TableCellMuted className="truncate max-w-[200px]">
            {row.original.email || 'No email'}
          </TableCellMuted>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        accessorKey: 'role',
        cell: ({ row }) => {
          const user = row.original
          const variant = user.role === 'admin' ? 'warning' : user.role === 'creator' ? 'success' : 'default'
          return (
            <TableCellBadge variant={variant}>
              {user.role === 'admin' && <Crown className="w-3 h-3" />}
              {user.role === 'creator' && <Pencil className="w-3 h-3" />}
              {user.role === 'learner' && <GraduationCap className="w-3 h-3" />}
              {user.role}
            </TableCellBadge>
          )
        },
      },
      {
        id: 'activity_count',
        header: 'Activities',
        accessorKey: 'activity_count',
        enableSorting: true,
        cell: ({ row }) => <span className="text-foreground">{row.original.activity_count}</span>,
      },
      {
        id: 'created_at',
        header: 'Joined',
        accessorKey: 'created_at',
        enableSorting: true,
        cell: ({ row }) => <TableCellMuted>{formatDate(row.original.created_at)}</TableCellMuted>,
      },
    ]

    // Add deletion status column when showing deleted users
    if (showDeleted) {
      baseColumns.push({
        id: 'deletion_status',
        header: 'Deletion Status',
        cell: ({ row }) => {
          const user = row.original
          if (!user.deleted_at) return null
          const days = getDaysUntilHardDelete(user.deleted_at)
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-red-500 text-sm">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{formatDate(user.deleted_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3 h-3" />
                <span className={cn(
                  days <= 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'
                )}>
                  {days > 0 ? `${days} days until hard delete` : 'Pending hard delete'}
                </span>
              </div>
            </div>
          )
        },
      })
    }

    // Add actions column
    baseColumns.push({
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <a
                    href={`/profile/${user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Change Role
                </DropdownMenuLabel>
                {(['admin', 'creator', 'learner'] as const).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleRoleUpdate(user.id, role)}
                    disabled={updatingRole === user.id || user.role === role}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      user.role === role && 'opacity-50',
                      role === 'admin' && 'text-amber-500 focus:text-amber-500',
                      role === 'creator' && 'text-emerald-500 focus:text-emerald-500',
                      role === 'learner' && 'text-gray-400 focus:text-gray-400'
                    )}
                  >
                    {updatingRole === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {role === 'admin' && <Crown className="w-4 h-4" />}
                        {role === 'creator' && <Pencil className="w-4 h-4" />}
                        {role === 'learner' && <GraduationCap className="w-4 h-4" />}
                      </>
                    )}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                    {user.role === role && ' (current)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    })

    return baseColumns
  }, [showDeleted, updatingRole, users])

  const pageCount = Math.ceil(totalUsers / pageSize)

  return (
    <AdminLayout title="Users" activeItem="users">
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Pencil className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.creators}</p>
              <p className="text-sm text-muted-foreground">Creators</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gray-500/20">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.learners}</p>
              <p className="text-sm text-muted-foreground">Learners</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Calendar className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPageIndex(0) // Reset to first page on search
              }}
              className="pl-9"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>
                {roleFilter === 'all' ? 'All Roles' :
                  roleFilter === 'admin' ? 'Admins' :
                    roleFilter === 'creator' ? 'Creators' : 'Learners'}
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
                  {(['all', 'admin', 'creator', 'learner'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setRoleFilter(role)
                        setShowFilterMenu(false)
                        setPageIndex(0) // Reset to first page on filter change
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2',
                        roleFilter === role && 'text-primary'
                      )}
                    >
                      {role === 'admin' && <Crown className="w-4 h-4" />}
                      {role === 'creator' && <Pencil className="w-4 h-4" />}
                      {role === 'learner' && <GraduationCap className="w-4 h-4" />}
                      {role === 'all' && <Users className="w-4 h-4" />}
                      {role === 'all' ? 'All Roles' :
                        role === 'admin' ? 'Admins' :
                          role === 'creator' ? 'Creators' : 'Learners'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deleted Filter Toggle */}
          <button
            onClick={() => {
              setShowDeleted(!showDeleted)
              setPageIndex(0) // Reset to first page on filter change
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              showDeleted
                ? 'border-red-500 bg-red-500/10 text-red-500'
                : 'border-border bg-card hover:bg-accent'
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">{showDeleted ? 'Deleted Users' : 'Show Deleted'}</span>
          </button>

          <p className="text-sm text-muted-foreground ml-auto">
            {totalUsers} user{totalUsers !== 1 && 's'}
          </p>
        </div>

        {/* Users Table */}
        <PaginatedTable
          columns={columns}
          data={users}
          loading={loading}
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={(updater) => {
            const newState = typeof updater === 'function'
              ? updater({ pageIndex, pageSize })
              : updater
            setPageIndex(newState.pageIndex)
          }}
          manualPagination
          sorting={sorting}
          onSortingChange={setSorting}
          manualSorting
          emptyMessage="No users found"
          emptyIcon={<Users className="w-12 h-12 text-muted-foreground mx-auto" />}
        />
      </div>

      {/* Click outside handler for filter dropdown */}
      {showFilterMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </AdminLayout>
  )
}
