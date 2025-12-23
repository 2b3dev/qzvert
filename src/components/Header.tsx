import IconApp from '@/components/icon/icon-app'
import { setTheme, type Theme } from '@/server/theme'
import { Link, useRouter } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, CreditCard, Home, Menu, Moon, Plus, Sun, X, User, LogOut, LogIn } from 'lucide-react'
import { useState } from 'react'
import { Route } from '../routes/__root'
import { useAuthStore } from '../stores/auth-store'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { theme } = Route.useLoaderData()
  const router = useRouter()
  const { user, signOut } = useAuthStore()

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    await setTheme({ data: { theme: newTheme } })
    router.invalidate()
  }

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/pricing', label: 'Pricing', icon: CreditCard },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <IconApp className="w-6 h-6" color={'hsl(var(--foreground))'} />
              </motion.div>
              <span className="font-black text-xl text-foreground group-hover:text-primary transition-colors">
                QzVert
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  activeProps={{
                    className:
                      'flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <Link
                to="/"
                hash="create"
                className="flex items-center gap-2 ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create
              </Link>
              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </motion.div>
              </button>

              {/* User Menu */}
              {user ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 rounded-lg bg-card border border-border shadow-lg py-2"
                      >
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          ออกจากระบบ
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-72 bg-card border-l border-border z-50 md:hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-lg text-foreground">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary',
              }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <Link
            to="/"
            hash="create"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-4"
          >
            <Plus className="w-5 h-5" />
            Create Quest
          </Link>

          {/* Mobile User Section */}
          <div className="mt-4 pt-4 border-t border-border">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-muted-foreground truncate">
                  {user.email}
                </div>
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogIn className="w-5 h-5" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </nav>
      </motion.div>

      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}
    </>
  )
}
