import { useState, useEffect, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  Shield,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth-store'
import { useProfileStore } from '../../stores/profile-store'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  activeItem: 'dashboard' | 'reports' | 'users' | 'activities' | 'analytics' | 'settings'
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
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { id: 'reports', label: 'Reports', icon: Flag, href: '/admin/reports' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'activities', label: 'Activities', icon: FileText, disabled: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, disabled: true },
  { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
]

export function AdminLayout({ children, title, activeItem, pendingReportsCount, headerActions }: AdminLayoutProps) {
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
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              item.disabled ? (
                <div
                  key={item.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                </div>
              ) : (
                <Link
                  key={item.id}
                  to={item.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    activeItem === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.id === 'reports' && pendingReportsCount !== undefined && pendingReportsCount > 0 && (
                    <span className={cn(
                      'ml-auto px-1.5 py-0.5 rounded-full text-xs font-medium',
                      activeItem === 'reports'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-amber-500/20 text-amber-500'
                    )}>
                      {pendingReportsCount}
                    </span>
                  )}
                </Link>
              )
            ))}
          </nav>

          {/* Sidebar Footer - User Info */}
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {(profile?.display_name || user?.email || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.display_name || 'Admin'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
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
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            {headerActions && (
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
