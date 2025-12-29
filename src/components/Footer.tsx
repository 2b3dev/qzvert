import { Link } from '@tanstack/react-router'
import { Github, Globe, Heart, Mail, Twitter } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { CONTACT_EMAIL } from '../lib/utils'
import { Route } from '../routes/__root'
import { useLanguageStore } from '../stores/language-store'
import IconApp from '@/components/icon/icon-app'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { language, toggleLanguage } = useLanguageStore()
  const { t } = useTranslation()
  const { siteSettings } = Route.useLoaderData()
  const siteName = siteSettings?.siteName || 'QzVert'

  const productLinks = [
    { to: '/explore', label: t('nav.explore') },
    { to: '/', hash: 'create', label: t('nav.createQuest') },
    { to: '/pricing', label: t('nav.pricing') },
  ]

  const toolsLinks = [
    { to: '/text-to-loud', label: t('footer.textToLoud') },
  ]

  const companyLinks = [
    { to: '/about', label: t('footer.aboutUs') },
    { to: '/contact', label: t('nav.contact') },
    { to: '/privacy', label: t('footer.privacyPolicy') },
    { to: '/terms', label: t('footer.termsOfService') },
  ]

  const socialLinks = [
    { href: 'https://github.com/qzvert', icon: Github, label: 'GitHub' },
    { href: 'https://twitter.com/qzvert', icon: Twitter, label: 'Twitter' },
    { href: `mailto:${CONTACT_EMAIL}`, icon: Mail, label: 'Email' },
  ]

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <IconApp className="w-6 h-6" color={'hsl(var(--foreground))'} />
              <span className="font-black text-xl text-foreground">
                {siteName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.product')}</h3>
            <ul className="space-y-3">
              {productLinks.map(({ to, hash, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    hash={hash}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.tools')}</h3>
            <ul className="space-y-3">
              {toolsLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.company')}</h3>
            <ul className="space-y-3">
              {companyLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {t('footer.startLearning')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.ctaText')}
            </p>
            <Link
              to="/"
              hash="create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('footer.createFreeQuest')}
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {siteName}. {t('footer.allRightsReserved')}
          </p>
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              {language === 'th' ? 'ไทย' : 'English'}
            </button>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {t('footer.madeWith')} <Heart className="w-4 h-4 text-destructive fill-destructive" /> {t('footer.inThailand')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
