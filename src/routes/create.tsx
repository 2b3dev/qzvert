import { createFileRoute } from '@tanstack/react-router'
import { DefaultLayout } from '../components/layouts/DefaultLayout'
import { QuestCreator } from '../components/QuestCreator'

export const Route = createFileRoute('/create')({ component: CreatePage })

function CreatePage() {
  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background">
        <div className="py-16 px-6">
          <QuestCreator />
        </div>
      </div>
    </DefaultLayout>
  )
}
