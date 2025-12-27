import { useCallback } from 'react'
import { useLanguageStore } from '../stores/language-store'
import thTranslations from '../locales/th.json'
import enTranslations from '../locales/en.json'

function get(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return path // Return the key if not found
    }
  }

  return typeof result === 'string' ? result : path
}

export function useTranslation() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore()

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translations =
        language === 'th' ? thTranslations : enTranslations
      let text = get(translations as Record<string, unknown>, key)

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v))
        })
      }

      return text
    },
    [language],
  )

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isThaiLanguage: language === 'th',
    isEnglishLanguage: language === 'en',
  }
}
