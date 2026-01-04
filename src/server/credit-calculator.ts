import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { createSupabaseServerClient } from '../lib/supabase'
import type {
  CreditCalculation,
  CreditProcessMode,
  CreditSettings,
  TokenEstimation,
  TierPricingConfig,
  TokenEstimationRatios,
  UserRole,
  DEFAULT_CREDIT_SETTINGS,
  DEFAULT_TIER_PRICING_CONFIG,
  DEFAULT_TOKEN_ESTIMATION_RATIOS,
} from '../types/database'

const getSupabaseFromCookies = () => {
  return createSupabaseServerClient(getCookies, setCookie)
}

// ============================================
// Settings Retrieval Functions
// ============================================

export const getCreditSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CreditSettings> => {
    const supabase = getSupabaseFromCookies()

    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'token_estimation_ratios',
        'tier_pricing_config',
        'credit_conversion_rate',
        'usd_to_thb_rate',
        'gemini_input_price',
        'gemini_output_price',
      ])

    const settingsMap: Record<string, unknown> = {}
    if (settings) {
      for (const s of settings) {
        settingsMap[s.key] = s.value
      }
    }

    // Import defaults dynamically to avoid circular dependency
    const defaults = await import('../types/database').then((m) => m.DEFAULT_CREDIT_SETTINGS)

    return {
      tokenEstimationRatios:
        (settingsMap['token_estimation_ratios'] as TokenEstimationRatios) ||
        defaults.tokenEstimationRatios,
      tierPricingConfig:
        (settingsMap['tier_pricing_config'] as TierPricingConfig) ||
        defaults.tierPricingConfig,
      creditConversionRate:
        (settingsMap['credit_conversion_rate'] as number) ||
        defaults.creditConversionRate,
      usdToThbRate:
        (settingsMap['usd_to_thb_rate'] as number) || defaults.usdToThbRate,
      geminiInputPrice:
        (settingsMap['gemini_input_price'] as number) || defaults.geminiInputPrice,
      geminiOutputPrice:
        (settingsMap['gemini_output_price'] as number) || defaults.geminiOutputPrice,
    }
  },
)

// ============================================
// Token Estimation
// ============================================

export const estimateTokens = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      content: string
      mode: CreditProcessMode
      easyExplainEnabled: boolean
    }) => data,
  )
  .handler(async ({ data }): Promise<TokenEstimation> => {
    const settings = await getCreditSettings()
    const ratios = settings.tokenEstimationRatios

    // Approximate token count: characters / 4 (rough estimate for multilingual)
    const inputTokens = Math.ceil(data.content.length / 4)

    // Output ratios by mode
    const outputRatios: Record<CreditProcessMode, number> = {
      original: 0,
      summarize: ratios.summarize,
      lesson: ratios.lesson,
      translate: ratios.translate,
    }

    let estimatedOutputTokens = Math.ceil(inputTokens * outputRatios[data.mode])

    // Easy Explain modifier: +20% additional output
    if (
      data.easyExplainEnabled &&
      (data.mode === 'summarize' || data.mode === 'lesson')
    ) {
      estimatedOutputTokens = Math.ceil(
        estimatedOutputTokens * (1 + ratios.easyExplainModifier),
      )
    }

    return {
      inputTokens,
      estimatedOutputTokens,
      totalTokens: inputTokens + estimatedOutputTokens,
      mode: data.mode,
      easyExplainApplied:
        data.easyExplainEnabled &&
        (data.mode === 'summarize' || data.mode === 'lesson'),
    }
  })

// ============================================
// Credit Calculation
// ============================================

export const calculateCredits = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      tokens: TokenEstimation
      userRole: UserRole
    }) => data,
  )
  .handler(async ({ data }): Promise<CreditCalculation> => {
    const settings = await getCreditSettings()
    const { tokens, userRole } = data
    const tierConfig = settings.tierPricingConfig
    const tierPricing = tierConfig.tiers[userRole]

    // Calculate actual API cost in USD
    const inputCostUSD =
      (tokens.inputTokens / 1_000_000) * settings.geminiInputPrice
    const outputCostUSD =
      (tokens.estimatedOutputTokens / 1_000_000) * settings.geminiOutputPrice
    const actualCostUSD = inputCostUSD + outputCostUSD

    // Convert to THB
    const actualCostTHB = actualCostUSD * settings.usdToThbRate

    // Apply tier pricing
    let finalCostTHB: number
    let tierMarkup: number

    if (tierConfig.mode === 'markup') {
      tierMarkup = tierPricing.markup
      finalCostTHB = actualCostTHB * (1 + tierMarkup / 100)
    } else {
      // Fixed price per 1K tokens
      tierMarkup = tierPricing.fixed
      finalCostTHB = (tokens.totalTokens / 1000) * tierPricing.fixed
    }

    // Calculate profit margin
    const profitMarginTHB = finalCostTHB - actualCostTHB

    // Convert to credits
    const creditsRequired = Math.max(
      1,
      Math.ceil(finalCostTHB * settings.creditConversionRate),
    )

    return {
      tokens,
      actualCostUSD,
      actualCostTHB,
      tierMarkup,
      finalCostTHB,
      creditsRequired,
      profitMarginTHB,
      pricingMode: tierConfig.mode,
    }
  })

// ============================================
// Preview Credit Cost (combines estimation + calculation)
// ============================================

export const previewCreditCost = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      content: string
      mode: CreditProcessMode
      easyExplainEnabled: boolean
    }) => data,
  )
  .handler(async ({ data }): Promise<CreditCalculation & { userRole: UserRole; userCredits: number; isAdmin: boolean }> => {
    const supabase = getSupabaseFromCookies()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userRole: UserRole = 'user'
    let userCredits = 0

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, ai_credits')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Normalize role to lowercase for comparison
        const role = (profile.role as string)?.toLowerCase?.().trim() || 'user'
        userRole = role as UserRole
        userCredits = profile.ai_credits || 0
      }
    }

    const isAdmin = userRole === 'admin'

    // Estimate tokens
    const tokens = await estimateTokens({ data })

    // Calculate credits
    const calculation = await calculateCredits({
      data: { tokens, userRole },
    })

    return {
      ...calculation,
      userRole,
      userCredits,
      isAdmin,
    }
  })

// ============================================
// Credit Management
// ============================================

export const checkUserCredits = createServerFn({ method: 'POST' })
  .inputValidator((data: { required: number }) => data)
  .handler(async ({ data }): Promise<{ hasEnough: boolean; currentBalance: number; required: number }> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { hasEnough: false, currentBalance: 0, required: data.required }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { hasEnough: false, currentBalance: 0, required: data.required }
    }

    // Admin has unlimited credits
    if (profile.role === 'admin') {
      return { hasEnough: true, currentBalance: profile.ai_credits || 0, required: data.required }
    }

    const currentBalance = profile.ai_credits || 0
    return {
      hasEnough: currentBalance >= data.required,
      currentBalance,
      required: data.required,
    }
  })

export const deductCredits = createServerFn({ method: 'POST' })
  .inputValidator((data: { amount: number; action?: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; newBalance: number }> => {
    const supabase = getSupabaseFromCookies()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_credits, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw new Error('Profile not found')
    }

    // Admin doesn't lose credits
    if (profile.role === 'admin') {
      return { success: true, newBalance: profile.ai_credits || 0 }
    }

    const currentBalance = profile.ai_credits || 0
    if (currentBalance < data.amount) {
      throw new Error('Insufficient credits')
    }

    const newBalance = currentBalance - data.amount

    const { error } = await supabase
      .from('profiles')
      .update({ ai_credits: newBalance })
      .eq('id', user.id)

    if (error) {
      throw new Error('Failed to deduct credits')
    }

    return { success: true, newBalance }
  })

export const addCredits = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; amount: number; reason?: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; newBalance: number }> => {
    const supabase = getSupabaseFromCookies()

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Get target user's current balance
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', data.userId)
      .single()

    if (!targetProfile) {
      throw new Error('User not found')
    }

    const newBalance = (targetProfile.ai_credits || 0) + data.amount

    const { error } = await supabase
      .from('profiles')
      .update({ ai_credits: newBalance })
      .eq('id', data.userId)

    if (error) {
      throw new Error('Failed to add credits')
    }

    return { success: true, newBalance }
  })

// ============================================
// Admin: Get Profit Preview for All Tiers
// ============================================

export const getProfitPreviewAllTiers = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      inputTokens: number
      outputTokens: number
    }) => data,
  )
  .handler(
    async ({
      data,
    }): Promise<
      Array<{
        tier: UserRole
        actualCostTHB: number
        chargeTHB: number
        profitTHB: number
        credits: number
      }>
    > => {
      const supabase = getSupabaseFromCookies()

      // Verify admin
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Authentication required')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        throw new Error('Admin access required')
      }

      const settings = await getCreditSettings()
      const tierConfig = settings.tierPricingConfig

      // Calculate actual cost
      const inputCostUSD =
        (data.inputTokens / 1_000_000) * settings.geminiInputPrice
      const outputCostUSD =
        (data.outputTokens / 1_000_000) * settings.geminiOutputPrice
      const actualCostUSD = inputCostUSD + outputCostUSD
      const actualCostTHB = actualCostUSD * settings.usdToThbRate

      const tiers: UserRole[] = ['user', 'plus', 'pro', 'ultra', 'admin']
      const totalTokens = data.inputTokens + data.outputTokens

      return tiers.map((tier) => {
        const tierPricing = tierConfig.tiers[tier]
        let chargeTHB: number

        if (tierConfig.mode === 'markup') {
          chargeTHB = actualCostTHB * (1 + tierPricing.markup / 100)
        } else {
          chargeTHB = (totalTokens / 1000) * tierPricing.fixed
        }

        const profitTHB = chargeTHB - actualCostTHB
        const credits = Math.max(
          1,
          Math.ceil(chargeTHB * settings.creditConversionRate),
        )

        return {
          tier,
          actualCostTHB,
          chargeTHB,
          profitTHB,
          credits,
        }
      })
    },
  )
