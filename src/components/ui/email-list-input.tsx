import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface EmailListInputProps {
  emails: string[]
  onChange: (emails: string[]) => void
  placeholder?: string
  className?: string
}

export function EmailListInput({
  emails,
  onChange,
  placeholder = 'Enter email addresses...',
  className
}: EmailListInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    if (!isValidEmail(trimmed)) return

    // Check if already added
    if (emails.includes(trimmed)) return

    onChange([...emails, trimmed])
    setInputValue('')
  }

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter(e => e !== emailToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addEmail(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      removeEmail(emails[emails.length - 1])
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')

    // Split by common separators (comma, semicolon, newline, space)
    const pastedEmails = pastedText.split(/[,;\s\n]+/).filter(Boolean)

    const validEmails = pastedEmails
      .map(email => email.trim().toLowerCase())
      .filter(email => isValidEmail(email) && !emails.includes(email))

    if (validEmails.length > 0) {
      onChange([...emails, ...validEmails])
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Email chips */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {emails.map(email => (
              <motion.div
                key={email}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="text-sm">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => inputValue && addEmail(inputValue)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
            'transition-all'
          )}
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Press Enter, comma, or space to add. You can also paste multiple emails.
      </p>
    </div>
  )
}
