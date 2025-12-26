import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mail, Search, User, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/auth-store'

export interface SelectedUser {
  id: string
  display_name: string | null
  avatar_url: string | null
  email?: string // For email invites
  isPendingInvite?: boolean // True if invited by email but not yet registered
}

interface UserSearchSelectProps {
  selectedUsers: SelectedUser[]
  onChange: (users: SelectedUser[]) => void
  placeholder?: string
  className?: string
}

export function UserSearchSelect({
  selectedUsers,
  onChange,
  placeholder = 'Search users...',
  className
}: UserSearchSelectProps) {
  const { session } = useAuthStore()
  const [query, setQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<SelectedUser[]>([])
  const [showDropdown, setShowDropdown] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!session) {
        console.log('No session available')
        return
      }

      setIsSearching(true)
      try {
        console.log('Searching for:', query)
        const results = await searchUsers({
          data: { query }
        })
        console.log('Search results:', results)
        // Filter out already selected users
        const filtered = results.filter(
          (r: SelectedUser) => !selectedUsers.some(s => s.id === r.id)
        )
        setSearchResults(filtered)
        setShowDropdown(true)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, session, selectedUsers])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addUser = (user: SelectedUser) => {
    onChange([...selectedUsers, user])
    setQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const removeUser = (userId: string) => {
    onChange(selectedUsers.filter(u => u.id !== userId))
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addEmailInvite = () => {
    const email = query.trim().toLowerCase()
    if (!isValidEmail(email)) return

    // Check if already added
    if (selectedUsers.some(u => u.email === email || u.display_name === email)) return

    const newUser: SelectedUser = {
      id: `email:${email}`, // Prefix to identify email invites
      display_name: email,
      avatar_url: null,
      email: email,
      isPendingInvite: true
    }
    onChange([...selectedUsers, newUser])
    setQuery('')
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedUsers.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                user.isPendingInvite
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "bg-primary/20 text-primary"
              )}
            >
              {user.isPendingInvite ? (
                <Mail className="w-4 h-4" />
              ) : user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-medium">
                  {getInitials(user.display_name)}
                </div>
              )}
              <span className="text-sm font-medium">{user.display_name || 'Unknown'}</span>
              {user.isPendingInvite && (
                <span className="text-xs opacity-70">(pending)</span>
              )}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
            'transition-all'
          )}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'max-h-60 overflow-y-auto',
              'rounded-xl border border-border bg-background shadow-lg'
            )}
          >
            {searchResults.length === 0 && !isValidEmail(query) ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isSearching ? 'Searching...' : 'No users found. Try entering an email address.'}
              </div>
            ) : searchResults.length === 0 && isValidEmail(query) ? (
              <div className="p-1">
                <button
                  type="button"
                  onClick={addEmailInvite}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                    'hover:bg-secondary/50 transition-colors'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Invite {query}</span>
                    <p className="text-xs text-muted-foreground">Send invite via email</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-1">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUser(user)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                      'hover:bg-secondary/50 transition-colors'
                    )}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium text-foreground">
                      {user.display_name || 'Unknown User'}
                    </span>
                  </button>
                ))}
                {/* Show invite option if query is valid email */}
                {isValidEmail(query) && (
                  <>
                    <div className="border-t border-border my-1" />
                    <button
                      type="button"
                      onClick={addEmailInvite}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                        'hover:bg-secondary/50 transition-colors'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Invite {query}</span>
                        <p className="text-xs text-muted-foreground">Send invite via email</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-2">
        Search by name or enter an email address to invite
      </p>
    </div>
  )
}
