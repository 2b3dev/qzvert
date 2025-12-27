import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, LogOut, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import IconApp from '../icon/icon-app'
import type { User as AuthUser } from '@supabase/supabase-js'

interface PlayHeaderProps {
  user: AuthUser | null
  onSignOut: () => void
}

export function PlayHeader({ user, onSignOut }: PlayHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleSignOut = () => {
    onSignOut()
    setIsUserMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
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

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* User Menu */}
            {user ? (
              <div ref={userMenuRef} className="relative">
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
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <User className="w-4 h-4" />
                        โปรไฟล์
                      </Link>
                      <Link
                        to="/activity/results"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        ผลลัพธ์ทั้งหมด
                      </Link>
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
