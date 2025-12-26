'use client'

import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

// Output format types
type OutputFormat =
  | 'iso' // Full ISO 8601 UTC: 2025-12-26T10:30:00.000Z
  | 'datetime-local' // HTML datetime-local: 2025-12-26T10:30
  | 'date' // Date only: 2025-12-26
  | 'time' // Time only: 10:30

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  isTimeDisabled?: boolean
  isDateDisabled?: boolean
  outputFormat?: OutputFormat
  minDate?: Date | string
  maxDate?: Date | string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date and time',
  disabled = false,
  className,
  isTimeDisabled = false,
  isDateDisabled = false,
  outputFormat = 'datetime-local',
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Internal state for pending changes (not committed until "Set Time" is clicked)
  const [pendingDate, setPendingDate] = React.useState<Date | undefined>(
    undefined,
  )
  const [pendingTime, setPendingTime] = React.useState<string>('00:00')

  // Parse the value into date and time parts
  const dateValue = value ? new Date(value) : undefined
  const timeValue = value ? value.slice(11, 16) : '00:00' // HH:mm

  // Parse min/max dates
  const parsedMinDate = minDate
    ? typeof minDate === 'string'
      ? new Date(minDate)
      : minDate
    : undefined
  const parsedMaxDate = maxDate
    ? typeof maxDate === 'string'
      ? new Date(maxDate)
      : maxDate
    : undefined

  // Sync internal state when popover opens
  React.useEffect(() => {
    if (open) {
      setPendingDate(dateValue)
      setPendingTime(timeValue)
    }
  }, [open])

  const handleDateSelect = (date: Date | undefined) => {
    setPendingDate(date)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingTime(e.target.value)
  }

  // Format helpers
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const formatOutput = (date: Date): string => {
    switch (outputFormat) {
      case 'iso':
        return date.toISOString()
      case 'date':
        return formatDate(date)
      case 'time':
        return formatTime(date)
      case 'datetime-local':
      default:
        return `${formatDate(date)}T${formatTime(date)}`
    }
  }

  const handleConfirm = () => {
    const date = pendingDate ? new Date(pendingDate) : new Date()

    if (!isTimeDisabled) {
      const [hours, minutes] = pendingTime.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)
    } else {
      date.setHours(0, 0, 0, 0)
    }

    onChange(formatOutput(date))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <span className="flex-1">
              {isDateDisabled
                ? timeValue
                : isTimeDisabled
                  ? format(dateValue!, 'PPP')
                  : `${format(dateValue!, 'PPP')} at ${format(dateValue!, 'HH:mm')}`}
            </span>
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {value && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {!isDateDisabled && (
          <Calendar
            mode="single"
            selected={pendingDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => {
              if (parsedMinDate && date < parsedMinDate) return true
              if (parsedMaxDate && date > parsedMaxDate) return true
              return false
            }}
          />
        )}
        <div className={cn('p-3 space-y-3', !isDateDisabled && 'border-t')}>
          {!isTimeDisabled && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={pendingTime}
                onChange={handleTimeChange}
                className="flex-1"
              />
            </div>
          )}
          <Button className="w-full" size="sm" onClick={handleConfirm}>
            {isDateDisabled
              ? 'Set Time'
              : isTimeDisabled
                ? 'Set Date'
                : 'Set Time'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
