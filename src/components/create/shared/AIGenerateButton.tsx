import { Loader2, PenLine, Sparkles, Wand2 } from 'lucide-react'
import { useTranslation } from '../../../hooks/useTranslation'
import { Button } from '../../ui/button'

interface AIGenerateButtonProps {
  onGenerate: () => void
  onManualCreate?: () => void
  isGenerating: boolean
  disabled?: boolean
  credits?: number | null
  isAdmin?: boolean
  showManualButton?: boolean
}

export function AIGenerateButton({
  onGenerate,
  onManualCreate,
  isGenerating,
  disabled = false,
  credits = null,
  isAdmin = false,
  showManualButton = true,
}: AIGenerateButtonProps) {
  const { t } = useTranslation()

  return (
    <div
      className={showManualButton ? 'grid grid-cols-2 gap-3' : 'flex flex-col'}
    >
      <div className="space-y-1">
        <Button
          size="lg"
          className="w-full"
          onClick={onGenerate}
          disabled={isGenerating || disabled}
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
        {credits !== null && (
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
