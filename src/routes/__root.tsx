import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useLocation,
} from '@tanstack/react-router'
import { Construction, Loader2, Lock, Mail, Shield } from 'lucide-react'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Toaster } from 'sonner'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { NotFound } from '../components/ui/not-found'
import en from '../locales/en.json'
import th from '../locales/th.json'
import { getAuthSession } from '../server/activities'
import { getPublicSiteSettings, isMaintenanceMode } from '../server/admin-settings'
import { getLanguage } from '../server/language'
import { getTheme } from '../server/theme'
import { useAuthStore } from '../stores/auth-store'
import { useLanguageStore } from '../stores/language-store'

import type { Language } from '../server/language'

import appCss from '../styles.css?url'

// Lazy load devtools - only bundled in development
const TanStackDevtools = lazy(() =>
  import('@tanstack/react-devtools').then((m) => ({ default: m.TanStackDevtools }))
)
const TanStackRouterDevtoolsPanel = lazy(() =>
  import('@tanstack/react-router-devtools').then((m) => ({
    default: m.TanStackRouterDevtoolsPanel,
  }))
)

const translations = { th, en }

function getSeoData(language: Language) {
  return translations[language].seo
}

export const Route = createRootRoute({
  loader: async () => {
    const [{ theme }, { language }, authData, maintenance, siteSettings] = await Promise.all([
      getTheme(),
      getLanguage(),
      getAuthSession(),
      isMaintenanceMode(),
      getPublicSiteSettings(),
    ])
    return {
      theme,
      language,
      user: authData.user,
      session: authData.session,
      profile: authData.profile,
      maintenance,
      siteSettings,
    }
  },
  head: ({ loaderData }) => {
    const seo = getSeoData(loaderData?.language || 'en')
    const locale = loaderData?.language === 'en' ? 'en_US' : 'th_TH'
    const alternateLocale = loaderData?.language === 'en' ? 'th_TH' : 'en_US'
    const siteName = loaderData?.siteSettings?.siteName || seo.siteName
    const siteDescription = loaderData?.siteSettings?.siteDescription || seo.description

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: `${siteName} - ${siteDescription}` },
        { name: 'description', content: siteDescription },
        { name: 'keywords', content: seo.keywords },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: siteName },
        { property: 'og:title', content: `${siteName} - ${siteDescription}` },
        { property: 'og:description', content: siteDescription },
        { property: 'og:locale', content: locale },
        { property: 'og:locale:alternate', content: alternateLocale },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: `${siteName} - ${siteDescription}` },
        { name: 'twitter:description', content: siteDescription },
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

function MaintenancePage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
          <Construction className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Under Maintenance
          </h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please check back later. We apologize for any inconvenience.
        </p>
      </div>
    </div>
  )
}

function AdminLoginPage() {
  const { signInWithEmail } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: authError } = await signInWithEmail(email, password)
      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Invalid email or password')
        } else {
          setError(authError.message)
        }
      } else {
        // Refresh to reload auth state from server
        window.location.href = '/admin'
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
            <p className="text-muted-foreground mt-2">
              The site is currently under maintenance. Please login to access
              the admin panel.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Login Admin
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme, language, user, session, maintenance, profile } =
    Route.useLoaderData()
  const { initialize, hydrateAuth, isInitialized } = useAuthStore()
  const { initLanguage } = useLanguageStore()
  const location = useLocation()
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

  // Check if maintenance mode is enabled and user is not admin
  // Use profile from SSR loader data (includes role)
  const isAdmin = profile?.role === 'admin'
  // Allow access to /login route even during maintenance (so admin can login)
  const isLoginRoute = location.pathname === '/login'
  const isAdminRoute = location.pathname.startsWith('/admin')
  const showMaintenance = maintenance.enabled && !isAdmin && !isLoginRoute
  // If trying to access /admin during maintenance without being admin, redirect to login
  const showAdminLogin = showMaintenance && isAdminRoute

  return (
    <html lang={language} className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased transition-colors duration-300">
        {showAdminLogin ? (
          <AdminLoginPage />
        ) : showMaintenance ? (
          <MaintenancePage message={maintenance.message} />
        ) : (
          children
        )}
{import.meta.env.DEV && (
          <Suspense fallback={null}>
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: (
                    <Suspense fallback={null}>
                      <TanStackRouterDevtoolsPanel />
                    </Suspense>
                  ),
                },
              ]}
            />
          </Suspense>
        )}
        <Toaster richColors position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
