import * as React from 'react'
import { cn } from '../../lib/utils'

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  allowDecimal?: boolean
  decimalPlaces?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      min = 0,
      max,
      step = 1,
      allowDecimal = false,
      decimalPlaces = 2,
      onBlur,
      ...props
    },
    ref,
  ) => {
    // Track the display value separately to allow empty input while typing
    const [displayValue, setDisplayValue] = React.useState<string>(value.toString())

    // Sync display value when external value changes
    React.useEffect(() => {
      setDisplayValue(value.toString())
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow empty string while typing
      if (inputValue === '') {
        setDisplayValue('')
        return
      }

      // Allow minus sign at start if min is negative
      if (inputValue === '-' && (min === undefined || min < 0)) {
        setDisplayValue('-')
        return
      }

      // Allow decimal point while typing
      if (allowDecimal && (inputValue === '.' || inputValue === '0.')) {
        setDisplayValue(inputValue)
        return
      }

      // Validate the input
      const regex = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/
      if (!regex.test(inputValue)) {
        return
      }

      setDisplayValue(inputValue)

      // Parse and validate the number
      const numValue = allowDecimal ? parseFloat(inputValue) : parseInt(inputValue, 10)

      if (!isNaN(numValue)) {
        // Clamp value within bounds
        let clampedValue = numValue
        if (min !== undefined && numValue < min) {
          clampedValue = min
        }
        if (max !== undefined && numValue > max) {
          clampedValue = max
        }

        // Round to decimal places if needed
        if (allowDecimal && decimalPlaces !== undefined) {
          clampedValue = Math.round(clampedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
        }

        onChange(clampedValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // On blur, if empty or invalid, reset to min value
      if (displayValue === '' || displayValue === '-' || displayValue === '.') {
        const resetValue = min ?? 0
        setDisplayValue(resetValue.toString())
        onChange(resetValue)
      } else {
        // Ensure display matches the actual value
        const numValue = allowDecimal ? parseFloat(displayValue) : parseInt(displayValue, 10)
        if (!isNaN(numValue)) {
          let finalValue = numValue
          if (min !== undefined && numValue < min) {
            finalValue = min
          }
          if (max !== undefined && numValue > max) {
            finalValue = max
          }
          if (allowDecimal && decimalPlaces !== undefined) {
            finalValue = Math.round(finalValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
          }
          setDisplayValue(finalValue.toString())
          onChange(finalValue)
        }
      }

      onBlur?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow arrow keys to increment/decrement
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const newValue = value + step
        if (max === undefined || newValue <= max) {
          onChange(allowDecimal
            ? Math.round(newValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
            : newValue
          )
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const newValue = value - step
        if (min === undefined || newValue >= min) {
          onChange(allowDecimal
            ? Math.round(newValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
            : newValue
          )
        }
      }
    }

    return (
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'

export { NumberInput }
