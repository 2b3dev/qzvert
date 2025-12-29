//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: ['supabase/functions/**/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'import/order': 'off',
    },
  },
]
