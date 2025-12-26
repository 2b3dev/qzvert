import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect, useRef } from 'react'
import { Toaster } from 'sonner'

import { NotFound } from '../components/ui/not-found'
import { getAuthSession } from '../server/activities'
import { getTheme } from '../server/theme'
import { useAuthStore } from '../stores/auth-store'

import appCss from '../styles.css?url'

const IS_SHOW_DEVTOOL = false

export const Route = createRootRoute({
  loader: async () => {
    const [{ theme }, authData] = await Promise.all([
      getTheme(),
      getAuthSession()
    ])
    return { theme, user: authData.user, session: authData.session }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'qzvert - Transform Learning Into Adventure',
      },
      {
        name: 'description',
        content:
          'AI-powered micro-SaaS that transforms any content into gamified learning quests',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),

  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme, user, session } = Route.useLoaderData()
  const { initialize, hydrateAuth, isInitialized } = useAuthStore()
  const hasHydrated = useRef(false)

  // Hydrate auth state from SSR on first render (before useEffect)
  if (!hasHydrated.current && !isInitialized) {
    hydrateAuth(user, session)
    hasHydrated.current = true
  }

  useEffect(() => {
    // Initialize sets up the auth listener for client-side changes
    initialize()
  }, [initialize])

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased transition-colors duration-300">
        {children}
        {IS_SHOW_DEVTOOL && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Toaster richColors position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
