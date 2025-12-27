import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect, useRef } from 'react'
import { Toaster } from 'sonner'

import { NotFound } from '../components/ui/not-found'
import en from '../locales/en.json'
import th from '../locales/th.json'
import { getAuthSession } from '../server/activities'
import { getLanguage } from '../server/language'
import { getTheme } from '../server/theme'
import { useAuthStore } from '../stores/auth-store'
import { useLanguageStore } from '../stores/language-store'

import type { Language } from '../server/language'

import appCss from '../styles.css?url'

const translations = { th, en }

function getSeoData(language: Language) {
  return translations[language].seo
}

export const Route = createRootRoute({
  loader: async () => {
    const [{ theme }, { language }, authData] = await Promise.all([
      getTheme(),
      getLanguage(),
      getAuthSession(),
    ])
    return { theme, language, user: authData.user, session: authData.session }
  },
  head: ({ loaderData }) => {
    const seo = getSeoData(loaderData?.language || 'en')
    const locale = loaderData?.language === 'en' ? 'en_US' : 'th_TH'
    const alternateLocale = loaderData?.language === 'en' ? 'th_TH' : 'en_US'

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: seo.title },
        { name: 'description', content: seo.description },
        { name: 'keywords', content: seo.keywords },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: seo.siteName },
        { property: 'og:title', content: seo.ogTitle },
        { property: 'og:description', content: seo.ogDescription },
        { property: 'og:locale', content: locale },
        { property: 'og:locale:alternate', content: alternateLocale },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: seo.ogTitle },
        { name: 'twitter:description', content: seo.ogDescription },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', href: '/favicon.ico' },
      ],
    }
  },

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
  const { theme, language, user, session } = Route.useLoaderData()
  const { initialize, hydrateAuth, isInitialized } = useAuthStore()
  const { initLanguage } = useLanguageStore()
  const hasHydrated = useRef(false)

  // Hydrate auth state from SSR on first render (before useEffect)
  if (!hasHydrated.current && !isInitialized) {
    hydrateAuth(user, session)
    initLanguage(language)
    hasHydrated.current = true
  }

  useEffect(() => {
    // Initialize sets up the auth listener for client-side changes
    initialize()
  }, [initialize])

  return (
    <html lang={language} className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased transition-colors duration-300">
        {children}
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
        <Toaster richColors position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
