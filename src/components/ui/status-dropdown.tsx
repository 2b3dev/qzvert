import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, EyeOff, Globe, Link2, Users } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { CreationStatus } from '../../types/database'
import { CREATION_STATUS_OPTIONS } from '../../types/database'
import { UserSearchSelect, type SelectedUser } from './user-search-select'

const statusIcons: Record<CreationStatus, React.ReactNode> = {
  draft: <EyeOff className="w-4 h-4" />,
  private_group: <Users className="w-4 h-4" />,
  link: <Link2 className="w-4 h-4" />,
  public: <Globe className="w-4 h-4" />,
}

const statusColors: Record<CreationStatus, string> = {
  draft: 'text-muted-foreground',
  private_group: 'text-amber-500',
  link: 'text-blue-500',
  public: 'text-emerald-500',
}

interface StatusDropdownProps {
  value: CreationStatus
  onChange: (value: CreationStatus) => void
  disabled?: boolean
  allowedUsers?: SelectedUser[]
  onAllowedUsersChange?: (users: SelectedUser[]) => void
}

export function StatusDropdown({
  value,
  onChange,
  disabled,
  allowedUsers = [],
  onAllowedUsersChange
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = CREATION_STATUS_OPTIONS.find((opt) => opt.value === value)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background',
          'hover:bg-secondary/50 transition-colors text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={statusColors[value]}>{statusIcons[value]}</span>
        <span className="text-foreground">
          {selectedOption?.label}
          {value === 'private_group' && allowedUsers.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({allowedUsers.length})
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 mt-2 z-50',
              'min-w-[320px] p-1 rounded-xl border border-border bg-background shadow-lg'
            )}
          >
            {CREATION_STATUS_OPTIONS.map((option) => (
              <div key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    if (option.value !== 'private_group') {
                      setIsOpen(false)
                    }
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left',
                    'hover:bg-secondary/50 transition-colors',
                    value === option.value && 'bg-secondary/70'
                  )}
                >
                  <span className={cn('mt-0.5', statusColors[option.value])}>
                    {statusIcons[option.value]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{option.label}</span>
                      {value === option.value && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </button>

                {/* User selection UI for private_group */}
                {option.value === 'private_group' && value === 'private_group' && onAllowedUsersChange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 pb-3"
                  >
                    <div className="pt-2 border-t border-border mt-2">
                      <UserSearchSelect
                        selectedUsers={allowedUsers}
                        onChange={onAllowedUsersChange}
                        placeholder="Search users to add..."
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
