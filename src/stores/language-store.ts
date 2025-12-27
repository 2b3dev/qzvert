import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'th' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'th',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set({ language: get().language === 'th' ? 'en' : 'th' }),
    }),
    {
      name: 'qzvert-language',
    },
  ),
)
