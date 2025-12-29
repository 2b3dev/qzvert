import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  ChevronDown,
  FileText,
  Flag,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth-store'
import { useProfileStore } from '../../stores/profile-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  activeItem:
    | 'dashboard'
    | 'reports'
    | 'users'
    | 'activities'
    | 'analytics'
    | 'settings'
  /** Optional badge count for reports in sidebar */
  pendingReportsCount?: number
  /** Optional custom header actions (right side of header) */
  headerActions?: ReactNode
}

type SidebarItem = {
  id: string
  label: string
  icon: typeof LayoutDashboard
  href?: string
  disabled?: boolean
  gradient?: string
}

const sidebarItems: Array<SidebarItem> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/admin/users',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: FileText,
    href: '/admin/activities',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'reports',
    label: 'Problem Reports',
    icon: Flag,
    href: '/admin/reports',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    gradient: 'from-slate-500 to-gray-500',
  },
]

export function AdminLayout({
  children,
  title,
  activeItem,
  pendingReportsCount,
  headerActions,
}: AdminLayoutProps) {
  const { user, signOut } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch profile
  useEffect(() => {
    if (user?.id && !profile) {
      fetchProfile(user.id)
    }
  }, [user?.id, profile, fetchProfile])

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-violet-950/20 flex">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-screen">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
              >
                <Shield className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <span className="font-bold text-foreground">Admin</span>
                <span className="text-xs text-muted-foreground block -mt-0.5">Control Panel</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {sidebarItems.map((item) =>
              item.disabled ? (
                <div
                  key={item.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground/50 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                </div>
              ) : (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                    activeItem === item.id
                      ? `bg-linear-to-r ${item.gradient} text-white shadow-lg`
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  {/* Active glow effect */}
                  {activeItem === item.id && (
                    <div className={`absolute inset-0 rounded-xl bg-linear-to-r ${item.gradient} blur-xl opacity-30 -z-10`} />
                  )}
                  <item.icon className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    activeItem !== item.id && 'group-hover:scale-110',
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'reports' &&
                    pendingReportsCount !== undefined &&
                    pendingReportsCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'ml-auto px-2 py-0.5 rounded-full text-xs font-semibold',
                          activeItem === 'reports'
                            ? 'bg-white/20 text-white'
                            : 'bg-rose-500/20 text-rose-500',
                        )}
                      >
                        {pendingReportsCount}
                      </motion.span>
                    )}
                </Link>
              ),
            )}
          </nav>

          {/* Sidebar Footer - User Info */}
          <div className="p-4 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-accent/50 transition-all duration-200 group">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-border/50 group-hover:ring-primary/50 transition-all"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                      <span className="text-sm font-bold bg-linear-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                        {(profile?.display_name ||
                          user?.email ||
                          'A')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile?.display_name || 'Admin'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    Go to Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    User Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 relative lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={title}
                className="text-xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
              >
                {title}
              </motion.h1>
            </div>
            {headerActions && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {headerActions}
              </motion.div>
            )}
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
