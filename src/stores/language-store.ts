import { create } from 'zustand'
import { setLanguage as setLanguageServer } from '../server/language'

import type { Language } from '../server/language'

interface LanguageState {
  language: Language
  isHydrated: boolean
  setLanguage: (lang: Language) => Promise<void>
  toggleLanguage: () => Promise<void>
  initLanguage: (lang: Language) => void
}

// Get initial language from cookie on client side to prevent flash
function getInitialLanguage(): Language {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )language=([^;]*)/)
    if (match && (match[1] === 'th' || match[1] === 'en')) {
      return match[1] as Language
    }
  }
  return 'en'
}

export const useLanguageStore = create<LanguageState>()((set, get) => ({
  language: getInitialLanguage(),
  isHydrated: false,
  setLanguage: async (language) => {
    await setLanguageServer({ data: { language } })
    set({ language })
  },
  toggleLanguage: async () => {
    const newLang = get().language === 'th' ? 'en' : 'th'
    await setLanguageServer({ data: { language: newLang } })
    set({ language: newLang })
  },
  initLanguage: (language) => set({ language, isHydrated: true }),
}))
