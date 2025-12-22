import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

export type Theme = 'light' | 'dark'

export const getTheme = createServerFn({ method: 'GET' }).handler(async () => {
  const theme = (getCookie('theme') as Theme) || 'dark'
  return { theme }
})

export const setTheme = createServerFn({ method: 'POST' })
  .inputValidator((data: { theme: Theme }) => data)
  .handler(async ({ data }) => {
    setCookie('theme', data.theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
    return { theme: data.theme }
  })
