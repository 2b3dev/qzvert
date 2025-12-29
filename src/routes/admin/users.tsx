import { createFileRoute, redirect } from '@tanstack/react-router'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  ChevronDown,
  Clock,
  Crown,
  ExternalLink,
  Filter,
  GraduationCap,
  Loader2,
  MoreVertical,
  Pencil,
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
  TableAvatar,
  TableCellBadge,
  TableCellMuted,
} from '../../components/ui/paginated-table'
import { cn } from '../../lib/utils'
import { checkAdminAccess } from '../../server/reports'
import type { UserProfile, UserRole } from '../../server/users'
import { getUserStats, getUsers, updateUserRole } from '../../server/users'

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
  const [users, setUsers] = useState<Array<UserProfile>>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [stats, setStats] = useState<{
    total: number
    admins: number
    plus: number
    pro: number
    ultra: number
    users: number
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
    { id: 'created_at', desc: true },
  ])

  // Map column id to server sortBy field
  const columnIdToSortBy: Record<
    string,
    'created_at' | 'display_name' | 'activity_count'
  > = {
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
            },
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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      )

      // Update stats
      if (stats) {
        const oldRole = users.find((u) => u.id === userId)?.role
        if (oldRole && oldRole !== newRole) {
          setStats((prev) => {
            if (!prev) return prev
            const updated = { ...prev }
            // Decrease old role count
            if (oldRole === 'admin') updated.admins--
            else if (oldRole === 'plus') updated.plus--
            else if (oldRole === 'pro') updated.pro--
            else if (oldRole === 'ultra') updated.ultra--
            else if (oldRole === 'user') updated.users--
            // Increase new role count
            if (newRole === 'admin') updated.admins++
            else if (newRole === 'plus') updated.plus++
            else if (newRole === 'pro') updated.pro++
            else if (newRole === 'ultra') updated.ultra++
            else if (newRole === 'user') updated.users++
            return updated
          })
        }
      }

      toast.success(`User role updated to ${newRole}`)
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update role',
      )
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
    const hardDeleteDate = new Date(
      deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000,
    )
    const now = new Date()
    const daysRemaining = Math.ceil(
      (hardDeleteDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    )
    return daysRemaining
  }

  // Define columns for the table
  const columns = useMemo<Array<ColumnDef<UserProfile>>>(() => {
    const baseColumns: Array<ColumnDef<UserProfile>> = [
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
          const variant =
            user.role === 'admin'
              ? 'warning'
              : user.role === 'ultra'
                ? 'danger'
                : user.role === 'pro'
                  ? 'success'
                  : user.role === 'plus'
                    ? 'info'
                    : 'default'
          return (
            <TableCellBadge variant={variant}>
              {user.role === 'admin' && <Crown className="w-3 h-3" />}
              {user.role === 'ultra' && <Crown className="w-3 h-3" />}
              {user.role === 'pro' && <Pencil className="w-3 h-3" />}
              {user.role === 'plus' && <Pencil className="w-3 h-3" />}
              {user.role === 'user' && <GraduationCap className="w-3 h-3" />}
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
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.activity_count}</span>
        ),
      },
      {
        id: 'created_at',
        header: 'Joined',
        accessorKey: 'created_at',
        enableSorting: true,
        cell: ({ row }) => (
          <TableCellMuted>{formatDate(row.original.created_at)}</TableCellMuted>
        ),
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
                <span
                  className={cn(
                    days <= 7
                      ? 'text-red-500 font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {days > 0
                    ? `${days} days until hard delete`
                    : 'Pending hard delete'}
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
                {(['admin', 'ultra', 'pro', 'plus', 'user'] as const).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleRoleUpdate(user.id, role)}
                    disabled={updatingRole === user.id || user.role === role}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      user.role === role && 'opacity-50',
                      role === 'admin' && 'text-amber-500 focus:text-amber-500',
                      role === 'ultra' && 'text-purple-500 focus:text-purple-500',
                      role === 'pro' && 'text-emerald-500 focus:text-emerald-500',
                      role === 'plus' && 'text-blue-500 focus:text-blue-500',
                      role === 'user' && 'text-gray-400 focus:text-gray-400',
                    )}
                  >
                    {updatingRole === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {role === 'admin' && <Crown className="w-4 h-4" />}
                        {role === 'ultra' && <Crown className="w-4 h-4" />}
                        {role === 'pro' && <Pencil className="w-4 h-4" />}
                        {role === 'plus' && <Pencil className="w-4 h-4" />}
                        {role === 'user' && (
                          <GraduationCap className="w-4 h-4" />
                        )}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.admins}</p>
              <p className="text-sm text-muted-foreground mt-1">Admins</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.thisWeek}</p>
              <p className="text-sm text-muted-foreground mt-1">This Week</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.thisMonth}</p>
              <p className="text-sm text-muted-foreground mt-1">This Month</p>
            </motion.div>
          </div>
        )}

        {/* Role Distribution */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Role Distribution</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Ultra', value: stats.ultra, color: 'bg-purple-500', icon: Crown },
                { label: 'Pro', value: stats.pro, color: 'bg-emerald-500', icon: Sparkles },
                { label: 'Plus', value: stats.plus, color: 'bg-blue-500', icon: Pencil },
                { label: 'Users', value: stats.users, color: 'bg-gray-500', icon: GraduationCap },
              ].map((role) => (
                <div
                  key={role.label}
                  className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-center border border-transparent hover:border-border/50"
                >
                  <div className={`p-2 rounded-xl mx-auto w-fit mb-2 ${role.color}`}>
                    <role.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{role.value}</p>
                  <p className="text-xs text-muted-foreground">{role.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPageIndex(0)
              }}
              className="pl-9 bg-card/50 backdrop-blur-sm border-border/50 rounded-xl focus:border-primary/50"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">
                {roleFilter === 'all'
                  ? 'All Roles'
                  : roleFilter === 'admin'
                    ? 'Admins'
                    : roleFilter === 'ultra'
                      ? 'Ultra'
                      : roleFilter === 'pro'
                        ? 'Pro'
                        : roleFilter === 'plus'
                          ? 'Plus'
                          : 'Users'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full mt-2 left-0 w-44 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl py-2 z-10"
                >
                  {(['all', 'admin', 'ultra', 'pro', 'plus', 'user'] as const).map(
                    (role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setRoleFilter(role)
                          setShowFilterMenu(false)
                          setPageIndex(0)
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm hover:bg-accent/50 transition-all duration-200 flex items-center gap-2',
                          roleFilter === role && 'text-primary bg-primary/10',
                        )}
                      >
                        {role === 'admin' && <Crown className="w-4 h-4" />}
                        {role === 'ultra' && <Crown className="w-4 h-4" />}
                        {role === 'pro' && <Pencil className="w-4 h-4" />}
                        {role === 'plus' && <Pencil className="w-4 h-4" />}
                        {role === 'user' && <GraduationCap className="w-4 h-4" />}
                        {role === 'all' && <Users className="w-4 h-4" />}
                        <span className="font-medium">
                          {role === 'all'
                            ? 'All Roles'
                            : role === 'admin'
                              ? 'Admins'
                              : role === 'ultra'
                                ? 'Ultra'
                                : role === 'pro'
                                  ? 'Pro'
                                  : role === 'plus'
                                    ? 'Plus'
                                    : 'Users'}
                        </span>
                      </button>
                    ),
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deleted Filter Toggle */}
          <button
            onClick={() => {
              setShowDeleted(!showDeleted)
              setPageIndex(0)
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200',
              showDeleted
                ? 'border-rose-500/50 bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/10'
                : 'border-border/50 bg-card/50 backdrop-blur-sm hover:bg-accent/50',
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showDeleted ? 'Deleted Users' : 'Show Deleted'}
            </span>
          </button>

          <p className="text-sm text-muted-foreground ml-auto font-medium">
            {totalUsers} user{totalUsers !== 1 && 's'}
          </p>
        </motion.div>

        {/* Users Table */}
        <PaginatedTable
          columns={columns}
          data={users}
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
          emptyMessage="No users found"
          emptyIcon={
            <Users className="w-12 h-12 text-muted-foreground mx-auto" />
          }
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
