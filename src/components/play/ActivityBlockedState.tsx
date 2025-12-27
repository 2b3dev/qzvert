import { AlertCircle, Clock, Home, Lock } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import type { CanUserPlayResult } from '../../types/database'

interface ActivityBlockedStateProps {
  canPlayResult: CanUserPlayResult
  onBackHome: () => void
}

// Format date for display
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

export function ActivityBlockedState({
  canPlayResult,
  onBackHome,
}: ActivityBlockedStateProps) {
  if (canPlayResult.can_play) return null

  let icon = <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
  let title = 'Cannot Play'
  let description = 'You cannot play this activity right now.'

  switch (canPlayResult.reason) {
    case 'not_yet_available':
      icon = <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      title = 'Not Yet Available'
      description = canPlayResult.available_from
        ? `This activity will be available on ${formatDate(canPlayResult.available_from)}`
        : 'This activity is not yet available.'
      break
    case 'expired':
      icon = <Clock className="w-12 h-12 text-destructive mx-auto mb-4" />
      title = 'Activity Expired'
      description = canPlayResult.available_until
        ? `This activity was available until ${formatDate(canPlayResult.available_until)}`
        : 'This activity is no longer available.'
      break
    case 'replay_limit_reached':
      icon = <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      title = 'Replay Limit Reached'
      description = `You have already played this activity ${canPlayResult.plays_used} time${(canPlayResult.plays_used ?? 0) > 1 ? 's' : ''} (maximum: ${canPlayResult.replay_limit}).`
      break
    case 'activity_not_found':
      icon = <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      title = 'Activity Not Found'
      description = 'This activity does not exist.'
      break
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-6">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center">
          {icon}
          <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{description}</p>
          <Button onClick={onBackHome}>
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
