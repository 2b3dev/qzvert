import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

export type Language = 'th' | 'en'

export const getLanguage = createServerFn({ method: 'GET' }).handler(
  async () => {
    const language = (getCookie('language') as Language) || 'en'
    return { language }
  },
)

export const setLanguage = createServerFn({ method: 'POST' })
  .inputValidator((data: { language: Language }) => data)
  .handler(async ({ data }) => {
    setCookie('language', data.language, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
    return { language: data.language }
  })
