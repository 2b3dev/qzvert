import { Loader2, PenLine, Sparkles, Wand2 } from 'lucide-react'
import { useTranslation } from '../../../hooks/useTranslation'
import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'

interface AIGenerateButtonProps {
  onGenerate: () => void
  onManualCreate?: () => void
  isGenerating: boolean
  disabled?: boolean
  credits?: number | null
  isAdmin?: boolean
  showManualButton?: boolean
  aiDisabled?: boolean
}

export function AIGenerateButton({
  onGenerate,
  onManualCreate,
  isGenerating,
  disabled = false,
  credits = null,
  isAdmin = false,
  showManualButton = true,
  aiDisabled = false,
}: AIGenerateButtonProps) {
  const { t } = useTranslation()

  const isButtonDisabled = isGenerating || disabled || aiDisabled

  return (
    <div
      className={showManualButton ? 'grid grid-cols-2 gap-3' : 'flex flex-col'}
    >
      <div className="space-y-1">
        <div className="relative group">
          <Button
            size="lg"
            className={cn('w-full', aiDisabled && 'opacity-50 cursor-not-allowed')}
            onClick={onGenerate}
            disabled={isButtonDisabled}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.generating')}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                {t('create.actions.generate')}
              </>
            )}
          </Button>
          {aiDisabled && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {t('common.aiDisabled')}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
            </div>
          )}
        </div>
        {credits !== null && !aiDisabled && (
          <p className="text-xs text-muted-foreground text-center">
            <Sparkles className="w-3 h-3 inline mr-1" />
            {t('create.actions.creditUsed')} •{' '}
            {isAdmin ? '∞' : credits} {t('create.actions.remaining')}
          </p>
        )}
      </div>
      {showManualButton && onManualCreate && (
        <Button size="lg" variant="outline" onClick={onManualCreate}>
          <PenLine className="w-5 h-5" />
          {t('create.actions.manual')}
        </Button>
      )}
    </div>
  )
}
