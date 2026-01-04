'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, Coins, Loader2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { previewCreditCost } from '../../server/credit-calculator'
import type { CreditCalculation, CreditProcessMode, UserRole } from '../../types/database'

export interface CreditPreviewProps {
  content: string
  mode: CreditProcessMode
  easyExplainEnabled: boolean
  className?: string
  onCalculationComplete?: (calculation: CreditCalculation & { userCredits: number }) => void
}

export function CreditPreview({
  content,
  mode,
  easyExplainEnabled,
  className,
  onCalculationComplete,
}: CreditPreviewProps) {
  const [calculation, setCalculation] = useState<
    (CreditCalculation & { userRole: UserRole; userCredits: number; isAdmin: boolean }) | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdminDetails, setShowAdminDetails] = useState(false)

  // Debounced calculation
  useEffect(() => {
    // Don't calculate for original mode or empty content
    if (mode === 'original' || !content.trim()) {
      setCalculation(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await previewCreditCost({
          data: {
            content,
            mode,
            easyExplainEnabled,
          },
        })
        setCalculation(result)
        if (onCalculationComplete) {
          onCalculationComplete(result)
        }
      } catch (err) {
        console.error('Failed to calculate credits:', err)
        setError('Failed to estimate credits')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [content, mode, easyExplainEnabled, onCalculationComplete])

  // Don't show anything for original mode
  if (mode === 'original') {
    return null
  }

  // Don't show for empty content
  if (!content.trim()) {
    return null
  }

  const hasInsufficientCredits =
    calculation &&
    !calculation.isAdmin &&
    calculation.userCredits < calculation.creditsRequired

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-xl border px-3 py-2',
        hasInsufficientCredits
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-card/50 border-border/50',
        className,
      )}
    >
      {/* Simple view for users - just credits */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">Credit</span>
        </div>

        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}

        {!loading && calculation && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-bold',
                hasInsufficientCredits ? 'text-red-500' : 'text-amber-500',
              )}
            >
              {calculation.creditsRequired}
            </span>
            {/* Show balance for users if insufficient */}
            {hasInsufficientCredits && (
              <span className="text-xs text-red-500">
                (มี {calculation.userCredits})
              </span>
            )}
            {/* Admin toggle */}
            {calculation.isAdmin && (
              <button
                onClick={() => setShowAdminDetails(!showAdminDetails)}
                className="p-1 rounded hover:bg-muted/50 transition-colors"
              >
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-muted-foreground transition-transform',
                    showAdminDetails && 'rotate-180',
                  )}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Insufficient Credits Warning for users */}
      {hasInsufficientCredits && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Credit ไม่พอ ต้องการอีก {calculation.creditsRequired - calculation.userCredits}
          </span>
        </div>
      )}

      {/* Admin Only: Detailed breakdown */}
      <AnimatePresence>
        {showAdminDetails && calculation?.isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
              {/* Token Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Input</span>
                  <p className="font-medium">~{calculation.tokens.inputTokens.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Output ({Math.round(
                      (calculation.tokens.estimatedOutputTokens /
                        calculation.tokens.inputTokens) *
                        100,
                    )}%)
                  </span>
                  <p className="font-medium">
                    ~{calculation.tokens.estimatedOutputTokens.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total</span>
                  <p className="font-medium">~{calculation.tokens.totalTokens.toLocaleString()}</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="w-3 h-3" />
                  <span>Admin View</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Cost</span>
                    <p className="font-medium">
                      ${calculation.actualCostUSD.toFixed(6)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      ฿{calculation.actualCostTHB.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Charge</span>
                    <p className="font-medium">฿{calculation.finalCostTHB.toFixed(4)}</p>
                    <p className="text-muted-foreground text-[10px]">
                      {calculation.pricingMode === 'markup'
                        ? `${calculation.tierMarkup}% markup`
                        : `฿${calculation.tierMarkup}/1K`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profit</span>
                    <p
                      className={cn(
                        'font-medium',
                        calculation.profitMarginTHB >= 0
                          ? 'text-emerald-500'
                          : 'text-red-500',
                      )}
                    >
                      {calculation.profitMarginTHB >= 0 ? '+' : ''}฿
                      {calculation.profitMarginTHB.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
