import { create } from 'zustand'
import { setLanguage as setLanguageServer } from '../server/language'

import type { Language } from '../server/language'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  toggleLanguage: () => Promise<void>
  initLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>()((set, get) => ({
  language: 'en',
  setLanguage: async (language) => {
    await setLanguageServer({ data: { language } })
    set({ language })
  },
  toggleLanguage: async () => {
    const newLang = get().language === 'th' ? 'en' : 'th'
    await setLanguageServer({ data: { language: newLang } })
    set({ language: newLang })
  },
  initLanguage: (language) => set({ language }),
}))
