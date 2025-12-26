import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { Toaster } from 'sonner'

import Header from '../components/Header'
import Footer from '../components/Footer'
import { NotFound } from '../components/ui/not-found'
import { getTheme } from '../server/theme'
import { useAuthStore } from '../stores/auth-store'

import appCss from '../styles.css?url'

const IS_SHOW_DEVTOOL = false

export const Route = createRootRoute({
  loader: async () => {
    const { theme } = await getTheme()
    return { theme }
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
  const { theme } = Route.useLoaderData()
  const { initialize, isInitialized } = useAuthStore()
  const routerState = useRouterState()

  // Hide default header on edit page (uses custom header)
  const isEditPage = routerState.location.pathname.startsWith('/creation/edit/')

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased transition-colors duration-300">
        {!isEditPage && <Header />}
        <main className={isEditPage ? '' : 'min-h-screen'}>{children}</main>
        {!isEditPage && <Footer />}
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
