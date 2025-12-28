import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [sortBy, setSortBy] = useState<'created_at' | 'display_name' | 'activity_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // Fetch users and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [usersData, statsData] = await Promise.all([
          getUsers({
            data: {
              search: searchQuery || undefined,
              role: roleFilter === 'all' ? undefined : roleFilter,
              sortBy,
              sortOrder,
            }
          }),
          getUserStats(),
        ])
        setUsers(usersData.users)
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
  }, [searchQuery, roleFilter, sortBy, sortOrder])

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
                  onChange={(e) => setSearchQuery(e.target.value)}
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

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <span className="text-sm">Sort by: {sortBy === 'created_at' ? 'Date' : sortBy === 'display_name' ? 'Name' : 'Activities'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 right-0 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-10"
                    >
                      {[
                        { value: 'created_at', label: 'Join Date' },
                        { value: 'display_name', label: 'Name' },
                        { value: 'activity_count', label: 'Activities' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (sortBy === option.value) {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                              setSortBy(option.value as typeof sortBy)
                              setSortOrder('desc')
                            }
                            setShowSortMenu(false)
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between',
                            sortBy === option.value && 'text-primary'
                          )}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-sm text-muted-foreground ml-auto">
                {users.length} user{users.length !== 1 && 's'}
              </p>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl">
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Activities</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {(user.display_name || user.email || 'U')[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.display_name || 'Anonymous'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {user.email || 'No email'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                              user.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-500'
                                : user.role === 'creator'
                                  ? 'bg-emerald-500/20 text-emerald-500'
                                  : 'bg-gray-500/20 text-gray-400'
                            )}>
                              {user.role === 'admin' && <Crown className="w-3 h-3" />}
                              {user.role === 'creator' && <Pencil className="w-3 h-3" />}
                              {user.role === 'learner' && <GraduationCap className="w-3 h-3" />}
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-foreground">{user.activity_count}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-muted-foreground text-sm">{formatDate(user.created_at)}</span>
                          </td>
                          <td className="px-4 py-3">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
      </div>

      {/* Click outside handler for filter/sort dropdowns */}
      {(showFilterMenu || showSortMenu) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowFilterMenu(false)
            setShowSortMenu(false)
          }}
        />
      )}
    </AdminLayout>
  )
}
