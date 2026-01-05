import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Coins,
  ExternalLink,
  Loader2,
  RotateCcw,
  Save,
  Settings,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { NumberInput } from '../../components/ui/number-input'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  getAllCreditSettings,
  getSystemSettings,
  saveAllCreditSettings,
  updateSystemSettings,
  type SystemSettings,
} from '../../server/admin-settings'
import type {
  CreditSettings,
  GeminiModelId,
  UserRole,
} from '../../types/database'
import { DEFAULT_CREDIT_SETTINGS, GEMINI_ADDITIONAL_COSTS, GEMINI_MODELS, GEMINI_PRICING } from '../../types/database'

export const Route = createFileRoute('/admin/settings')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminSettings,
})

// Toggle component
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  // AI Credit Configuration state
  const [creditSettings, setCreditSettings] = useState<CreditSettings>(
    DEFAULT_CREDIT_SETTINGS,
  )
  const [savingCredits, setSavingCredits] = useState(false)

  // Tier pricing in user-friendly format (price per credit in THB)
  // Price per credit (calculated from packagePrice / monthlyCredits)
  const [tierPricePerCredit, setTierPricePerCredit] = useState<Record<UserRole, number>>({
    user: 0,       // Free tier - no price per credit
    plus: 0.66,    // ฿199 / 300 credits = ฿0.66/credit
    pro: 0.50,     // ฿599 / 1200 credits = ฿0.50/credit
    ultra: 0.40,   // ฿999 / 2500 credits = ฿0.40/credit
    admin: 0,      // Free for admin
  })

  // Monthly credits per tier (editable)
  // Higher tiers = more credits = better value
  const [tierMonthlyCredits, setTierMonthlyCredits] = useState<Record<UserRole, number>>({
    user: 10,      // Free tier - 10 credits/month
    plus: 300,     // Plus ฿199/month
    pro: 1200,     // Pro ฿599/month
    ultra: 2500,   // Ultra ฿999/month
    admin: 0,      // Unlimited (shown as ∞)
  })

  // Package price per tier (editable) - THB per month
  const [tierPackagePrice, setTierPackagePrice] = useState<Record<UserRole, number>>({
    user: 0,       // Free
    plus: 199,     // Plus ฿199/month
    pro: 599,      // Pro ฿599/month
    ultra: 999,    // Ultra ฿999/month
    admin: 0,      // Free
  })

  // Toggle for showing cost in credits or baht
  const [showCostInBaht, setShowCostInBaht] = useState(true)

  // Auto-calculate pricePerCredit when packagePrice or monthlyCredits change
  useEffect(() => {
    const newPrices: Record<UserRole, number> = {} as Record<UserRole, number>
    for (const tier of ['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]) {
      const pkg = tierPackagePrice[tier] || 0
      const credits = tierMonthlyCredits[tier] || 1
      newPrices[tier] = credits > 0 ? Number((pkg / credits).toFixed(2)) : 0
    }
    setTierPricePerCredit(newPrices)
  }, [tierPackagePrice, tierMonthlyCredits])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [settingsData, creditData] = await Promise.all([
          getSystemSettings(),
          getAllCreditSettings(),
        ])
        setSettings(settingsData)
        setCreditSettings(creditData)

        // Load tier pricing - prefer system settings, fallback to credit settings (tierSubscriptions)
        let loadedPackagePrices: Record<UserRole, number>
        let loadedMonthlyCredits: Record<UserRole, number>
        let loadedPricePerCredit: Record<UserRole, number> | null = null

        // Check if we have tierSubscriptions in credit settings (new format)
        if (creditData.tierSubscriptions) {
          loadedPackagePrices = {} as Record<UserRole, number>
          loadedMonthlyCredits = {} as Record<UserRole, number>
          loadedPricePerCredit = {} as Record<UserRole, number>

          for (const tier of ['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]) {
            const sub = creditData.tierSubscriptions[tier]
            if (sub) {
              loadedPackagePrices[tier] = sub.packagePrice
              loadedMonthlyCredits[tier] = sub.monthlyCredits
              loadedPricePerCredit[tier] = sub.pricePerCredit
            }
          }
        }

        // Override with system settings if available (takes precedence)
        if (settingsData.tierMonthlyCredits) {
          loadedMonthlyCredits = settingsData.tierMonthlyCredits as Record<UserRole, number>
        } else if (!loadedMonthlyCredits!) {
          loadedMonthlyCredits = tierMonthlyCredits
        }

        if (settingsData.tierPackagePrice) {
          loadedPackagePrices = settingsData.tierPackagePrice as Record<UserRole, number>
        } else if (!loadedPackagePrices!) {
          loadedPackagePrices = tierPackagePrice
        }

        setTierMonthlyCredits(loadedMonthlyCredits)
        setTierPackagePrice(loadedPackagePrices)

        // Calculate price per credit from loaded values (packagePrice / monthlyCredits)
        const newPrices: Record<UserRole, number> = {} as Record<UserRole, number>
        for (const tier of ['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]) {
          if (loadedPricePerCredit && loadedPricePerCredit[tier] !== undefined) {
            // Use saved price per credit if available
            newPrices[tier] = loadedPricePerCredit[tier]
          } else {
            // Calculate from package price / monthly credits
            const pkg = loadedPackagePrices[tier] || 0
            const credits = loadedMonthlyCredits[tier] || 1
            newPrices[tier] = credits > 0 ? Number((pkg / credits).toFixed(2)) : 0
          }
        }
        setTierPricePerCredit(newPrices)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate all credit metrics from API pricing
  // Admin sets: tokensPerCredit (how many tokens = 1 credit)
  const calculateCreditMetrics = () => {
    // Weighted average price per token (assume 60% input, 40% output for typical usage)
    const inputRatio = 0.6
    const outputRatio = 0.4
    const weightedPricePerTokenUSD = (
      (creditSettings.geminiInputPrice * inputRatio) +
      (creditSettings.geminiOutputPrice * outputRatio)
    ) / 1_000_000

    // Cost in THB per token
    const thbPerToken = weightedPricePerTokenUSD * creditSettings.usdToThbRate

    // How many tokens can ฿1 buy at cost?
    const tokensPerBaht = 1 / thbPerToken

    // Admin-defined: 1 credit = X tokens (default 500 ≈ 1 typical request)
    const tokensPerCredit = creditSettings.tokensPerCredit || 500

    // Calculate how much ฿ that costs
    const thbPerCredit = tokensPerCredit * thbPerToken

    // How many credits can you get for ฿1?
    const creditsPerBaht = Math.round(1 / thbPerCredit)

    return {
      creditsPerBaht,
      tokensPerBaht: Math.round(tokensPerBaht),
      tokensPerCredit,
      thbPerCredit,
      usdPerCredit: thbPerCredit / creditSettings.usdToThbRate,
    }
  }

  // Get calculated conversion rate
  const calculatedRate = calculateCreditMetrics()

  // Use calculated rate for cost calculations
  const calculateCostPerCredit = () => {
    const thbPerCredit = calculatedRate.thbPerCredit
    const usdPerCredit = calculatedRate.usdPerCredit
    const tokensPerCredit = calculatedRate.tokensPerCredit

    return {
      thbPerCredit,
      usdPerCredit,
      tokensPerCredit,
      actualCostThbPerCredit: thbPerCredit,
      actualCostUsdPerCredit: usdPerCredit,
    }
  }

  const handleSaveAll = async () => {
    if (!settings) return

    setSaving(true)
    setSavingCredits(true)
    try {
      // Convert price per credit back to tier config
      const updatedTierConfig = { ...creditSettings.tierPricingConfig }
      updatedTierConfig.mode = 'fixed' // Use fixed mode for simplicity

      // Build tier subscriptions from current UI state
      const tierSubscriptions: Record<UserRole, { packagePrice: number; monthlyCredits: number; pricePerCredit: number }> = {} as any
      for (const tier of ['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]) {
        // Convert price per credit to price per 1K tokens
        // If 1 credit = ฿X, then price per 1K tokens = X * 100 (approx)
        updatedTierConfig.tiers[tier] = {
          ...updatedTierConfig.tiers[tier],
          fixed: tierPricePerCredit[tier] * 100,
          markup: 0, // Not used in fixed mode
        }

        // Build tier subscription data
        tierSubscriptions[tier] = {
          packagePrice: tierPackagePrice[tier],
          monthlyCredits: tierMonthlyCredits[tier],
          pricePerCredit: tierPricePerCredit[tier],
        }
      }

      const updatedCreditSettings = {
        ...creditSettings,
        tierPricingConfig: updatedTierConfig,
        tierSubscriptions,
      }

      // Include tierMonthlyCredits and tierPackagePrice in settings
      const settingsWithCredits = {
        ...settings,
        tierMonthlyCredits,
        tierPackagePrice,
      }

      await Promise.all([
        updateSystemSettings({ data: settingsWithCredits }),
        saveAllCreditSettings({ data: updatedCreditSettings }),
      ])

      setCreditSettings(updatedCreditSettings)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
      setSavingCredits(false)
    }
  }

  const resetToDefaults = () => {
    setCreditSettings(DEFAULT_CREDIT_SETTINGS)
    // Use new pricing: Plus ฿199, Pro ฿599, Ultra ฿999
    setTierPricePerCredit({
      user: 0,       // Free tier
      plus: 0.66,    // ฿199 / 300 credits = ฿0.66/credit
      pro: 0.50,     // ฿599 / 1200 credits = ฿0.50/credit
      ultra: 0.40,   // ฿999 / 2500 credits = ฿0.40/credit
      admin: 0,
    })
    setTierMonthlyCredits({
      user: 10,      // Free tier - 10 credits/month
      plus: 300,     // Plus ฿199/month
      pro: 1200,     // Pro ฿599/month
      ultra: 2500,   // Ultra ฿999/month
      admin: 0,      // Unlimited
    })
    setTierPackagePrice({
      user: 0,       // Free
      plus: 199,     // Plus ฿199/month
      pro: 599,      // Pro ฿599/month
      ultra: 999,    // Ultra ฿999/month
      admin: 0,      // Free
    })
    toast.success('Reset to default values (not saved yet)')
  }


  const tierLabels: Record<UserRole, {
    name: string
    color: string
    bg: string
  }> = {
    user: {
      name: 'Free',
      color: 'text-gray-400',
      bg: 'bg-gray-500/20',
    },
    plus: {
      name: 'Plus',
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
    },
    pro: {
      name: 'Pro',
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
    },
    ultra: {
      name: 'Ultra',
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
    },
    admin: {
      name: 'Admin',
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
  }

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <AdminLayout title="Settings" activeItem="settings">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  const costInfo = calculateCostPerCredit()

  return (
    <AdminLayout title="Settings" activeItem="settings">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your platform settings
          </p>
        </div>

        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-violet-500">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">General</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Site Name
                </label>
                <Input
                  value={settings?.siteName || ''}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                  placeholder="QzVert"
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Site Description
                </label>
                <Input
                  value={settings?.siteDescription || ''}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  placeholder="AI-powered Learning Platform"
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">
                  Disable access for non-admin users
                </p>
              </div>
              <Toggle
                checked={settings?.maintenanceMode || false}
                onChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
            </div>

            {settings?.maintenanceMode && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Maintenance Message
                </label>
                <Input
                  value={settings?.maintenanceMessage || ''}
                  onChange={(e) =>
                    updateSetting('maintenanceMessage', e.target.value)
                  }
                  placeholder="We are currently performing maintenance..."
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Credits & Pricing - Main Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  AI Credits & Pricing
                </h2>
                <p className="text-xs text-muted-foreground">
                  ตั้งราคาและดูต้นทุน-กำไรแต่ละ tier
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enable AI</span>
                <Toggle
                  checked={settings?.enableAIGeneration ?? true}
                  onChange={(checked) => updateSetting('enableAIGeneration', checked)}
                />
              </div>
              <button
                onClick={resetToDefaults}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* API Pricing - Model Selection & Core Settings */}
          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">API Pricing</span>
                <a
                  href="https://ai.google.dev/gemini-api/docs/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 p-1 rounded hover:bg-purple-500/20 transition-colors"
                  title="View Gemini Pricing (ส่ง link นี้มาให้ Claude อัพเดตราคา)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/70 hover:text-purple-400" />
                </a>
              </div>
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-card/50 border-border/50 hover:bg-purple-500/10 hover:border-purple-500/30"
                  >
                    <span className="text-sm font-medium">
                      {GEMINI_MODELS.find(m => m.id === creditSettings.geminiModel)?.name || 'Select Model'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {GEMINI_MODELS.map((model) => {
                    const pricing = GEMINI_PRICING[model.id]
                    return (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => {
                          setCreditSettings({
                            ...creditSettings,
                            geminiModel: model.id,
                            geminiInputPrice: pricing.input,
                            geminiOutputPrice: pricing.output,
                          })
                        }}
                        className="flex items-start gap-3 py-3 cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.name}</span>
                            {model.recommended && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">แนะนำ</span>
                            )}
                            {creditSettings.geminiModel === model.id && (
                              <Check className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {model.description}
                          </p>
                          <p className="text-xs text-purple-400 mt-1">
                            Input: ${pricing.input}/1M • Output: ${pricing.output}/1M
                            {pricing.batchInput && (
                              <span className="text-muted-foreground"> (Batch: ${pricing.batchInput}/${pricing.batchOutput})</span>
                            )}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Current Model Pricing (Read-only) - Detailed */}
            {(() => {
              const currentPricing = GEMINI_PRICING[creditSettings.geminiModel] || GEMINI_PRICING['gemini-2.0-flash']
              const usdToThb = creditSettings.usdToThbRate
              const formatThb = (usd: number) => (usd * usdToThb).toFixed(2)
              const formatThbPer1K = (usdPer1M: number) => ((usdPer1M * usdToThb) / 1000).toFixed(4)

              return (
                <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-border/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-foreground">
                      ราคา API: {currentPricing.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Context: {(currentPricing.contextWindow / 1_000_000).toFixed(0)}M tokens
                    </div>
                  </div>

                  {/* 1. Standard Pricing */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-medium text-purple-400 uppercase tracking-wide">Standard API</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2 rounded bg-purple-500/10">
                        <div className="text-muted-foreground text-[10px]">Input</div>
                        <div className="font-mono text-purple-400">${currentPricing.input}/1M</div>
                        <div className="font-mono text-purple-400/60 text-[10px]">฿{formatThb(currentPricing.input)}/1M</div>
                        <div className="font-mono text-purple-400/40 text-[9px]">฿{formatThbPer1K(currentPricing.input)}/1K</div>
                      </div>
                      <div className="p-2 rounded bg-purple-500/10">
                        <div className="text-muted-foreground text-[10px]">Output</div>
                        <div className="font-mono text-purple-400">${currentPricing.output}/1M</div>
                        <div className="font-mono text-purple-400/60 text-[10px]">฿{formatThb(currentPricing.output)}/1M</div>
                        <div className="font-mono text-purple-400/40 text-[9px]">฿{formatThbPer1K(currentPricing.output)}/1K</div>
                      </div>
                      {currentPricing.inputExtended && (
                        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                          <div className="text-muted-foreground text-[10px]">Input &gt;200K</div>
                          <div className="font-mono text-purple-400">${currentPricing.inputExtended}/1M</div>
                          <div className="font-mono text-purple-400/60 text-[10px]">฿{formatThb(currentPricing.inputExtended)}/1M</div>
                        </div>
                      )}
                      {currentPricing.outputExtended && (
                        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                          <div className="text-muted-foreground text-[10px]">Output &gt;200K</div>
                          <div className="font-mono text-purple-400">${currentPricing.outputExtended}/1M</div>
                          <div className="font-mono text-purple-400/60 text-[10px]">฿{formatThb(currentPricing.outputExtended)}/1M</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Batch API Pricing (50% discount) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-medium text-green-400 uppercase tracking-wide">Batch API</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">50% OFF</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2 rounded bg-green-500/10">
                        <div className="text-muted-foreground text-[10px]">Input</div>
                        <div className="font-mono text-green-400">${currentPricing.batchInput}/1M</div>
                        <div className="font-mono text-green-400/60 text-[10px]">฿{formatThb(currentPricing.batchInput)}/1M</div>
                      </div>
                      <div className="p-2 rounded bg-green-500/10">
                        <div className="text-muted-foreground text-[10px]">Output</div>
                        <div className="font-mono text-green-400">${currentPricing.batchOutput}/1M</div>
                        <div className="font-mono text-green-400/60 text-[10px]">฿{formatThb(currentPricing.batchOutput)}/1M</div>
                      </div>
                      {currentPricing.batchInputExtended && (
                        <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                          <div className="text-muted-foreground text-[10px]">Input &gt;200K</div>
                          <div className="font-mono text-green-400">${currentPricing.batchInputExtended}/1M</div>
                        </div>
                      )}
                      {currentPricing.batchOutputExtended && (
                        <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                          <div className="text-muted-foreground text-[10px]">Output &gt;200K</div>
                          <div className="font-mono text-green-400">${currentPricing.batchOutputExtended}/1M</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Audio Input Pricing */}
                  {currentPricing.audioInput && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-medium text-amber-400 uppercase tracking-wide">Audio Input</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2 rounded bg-amber-500/10">
                          <div className="text-muted-foreground text-[10px]">Standard</div>
                          <div className="font-mono text-amber-400">${currentPricing.audioInput}/1M</div>
                          <div className="font-mono text-amber-400/60 text-[10px]">฿{formatThb(currentPricing.audioInput)}/1M</div>
                        </div>
                        {currentPricing.batchAudioInput && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                            <div className="text-muted-foreground text-[10px]">Batch</div>
                            <div className="font-mono text-amber-400">${currentPricing.batchAudioInput}/1M</div>
                            <div className="font-mono text-amber-400/60 text-[10px]">฿{formatThb(currentPricing.batchAudioInput)}/1M</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. Context Caching */}
                  {currentPricing.contextCacheInput && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-medium text-blue-400 uppercase tracking-wide">Context Caching</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2 rounded bg-blue-500/10">
                          <div className="text-muted-foreground text-[10px]">Cache Input</div>
                          <div className="font-mono text-blue-400">${currentPricing.contextCacheInput}/1M</div>
                          <div className="font-mono text-blue-400/60 text-[10px]">฿{formatThb(currentPricing.contextCacheInput)}/1M</div>
                        </div>
                        {currentPricing.contextCacheStorage !== undefined && currentPricing.contextCacheStorage > 0 && (
                          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                            <div className="text-muted-foreground text-[10px]">Storage/hr</div>
                            <div className="font-mono text-blue-400">${currentPricing.contextCacheStorage}/1M</div>
                            <div className="font-mono text-blue-400/60 text-[10px]">฿{formatThb(currentPricing.contextCacheStorage)}/1M/hr</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Additional Services (Imagen, Veo, Embeddings, Grounding) */}
                  {(() => {
                    const { imagen4, imagen3, veo, embedding, searchGrounding } = GEMINI_ADDITIONAL_COSTS
                    return (
                      <div className="space-y-3 pt-3 border-t border-border/30">
                        <div className="text-[10px] font-medium text-foreground/80 uppercase tracking-wide">Additional Services</div>

                        {/* Image Generation */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-medium text-pink-400">Image Generation (Imagen)</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded bg-pink-500/10">
                              <div className="text-muted-foreground text-[10px]">Imagen 4 Fast</div>
                              <div className="font-mono text-pink-400">${imagen4.fast}/img</div>
                              <div className="font-mono text-pink-400/60 text-[10px]">฿{formatThb(imagen4.fast)}/img</div>
                            </div>
                            <div className="p-2 rounded bg-pink-500/10">
                              <div className="text-muted-foreground text-[10px]">Imagen 4 Standard</div>
                              <div className="font-mono text-pink-400">${imagen4.standard}/img</div>
                              <div className="font-mono text-pink-400/60 text-[10px]">฿{formatThb(imagen4.standard)}/img</div>
                            </div>
                            <div className="p-2 rounded bg-pink-500/10">
                              <div className="text-muted-foreground text-[10px]">Imagen 4 Ultra</div>
                              <div className="font-mono text-pink-400">${imagen4.ultra}/img</div>
                              <div className="font-mono text-pink-400/60 text-[10px]">฿{formatThb(imagen4.ultra)}/img</div>
                            </div>
                            <div className="p-2 rounded bg-pink-500/10 border border-pink-500/20">
                              <div className="text-muted-foreground text-[10px]">Imagen 3</div>
                              <div className="font-mono text-pink-400">${imagen3.standard}/img</div>
                              <div className="font-mono text-pink-400/60 text-[10px]">฿{formatThb(imagen3.standard)}/img</div>
                            </div>
                          </div>
                        </div>

                        {/* Video Generation */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-medium text-rose-400">Video Generation (Veo)</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-rose-500/10">
                              <div className="text-muted-foreground text-[10px]">720p</div>
                              <div className="font-mono text-rose-400">${veo.perSecond}/sec</div>
                              <div className="font-mono text-rose-400/60 text-[10px]">฿{formatThb(veo.perSecond)}/sec</div>
                            </div>
                            <div className="p-2 rounded bg-rose-500/10">
                              <div className="text-muted-foreground text-[10px]">1080p HD</div>
                              <div className="font-mono text-rose-400">${veo.perSecondHD}/sec</div>
                              <div className="font-mono text-rose-400/60 text-[10px]">฿{formatThb(veo.perSecondHD)}/sec</div>
                            </div>
                          </div>
                        </div>

                        {/* Embeddings & Grounding */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Embeddings */}
                          <div className="space-y-2">
                            <div className="text-[10px] font-medium text-cyan-400">Embeddings</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 rounded bg-cyan-500/10">
                                <div className="text-muted-foreground text-[10px]">Standard</div>
                                <div className="font-mono text-cyan-400">${embedding.standard}/1M</div>
                                <div className="font-mono text-cyan-400/60 text-[10px]">฿{formatThb(embedding.standard)}/1M</div>
                              </div>
                              <div className="p-2 rounded bg-cyan-500/10">
                                <div className="text-muted-foreground text-[10px]">Batch</div>
                                <div className="font-mono text-cyan-400">${embedding.batch}/1M</div>
                                <div className="font-mono text-cyan-400/60 text-[10px]">฿{formatThb(embedding.batch)}/1M</div>
                              </div>
                            </div>
                          </div>

                          {/* Search Grounding */}
                          <div className="space-y-2">
                            <div className="text-[10px] font-medium text-orange-400">Search Grounding</div>
                            <div className="p-2 rounded bg-orange-500/10 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Free/day:</span>
                                <span className="font-mono text-orange-400">{searchGrounding.freeRequestsPerDay} (Free) / {searchGrounding.paidRequestsPerDay} (Paid)</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-muted-foreground">After free:</span>
                                <span className="font-mono text-orange-400">${searchGrounding.pricePerThousandQueries}/1K queries</span>
                              </div>
                              <div className="text-orange-400/60 text-[10px] mt-1">
                                ฿{formatThb(searchGrounding.pricePerThousandQueries)}/1K queries
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Cost Calculation Examples */}
                  <div className="pt-3 border-t border-border/30 space-y-2">
                    <div className="text-[10px] font-medium text-foreground/80">ตัวอย่างการคำนวณ (ที่ {creditSettings.usdToThbRate} ฿/USD)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                      {/* Typical Request */}
                      {(() => {
                        const inputTokens = 1500
                        const outputTokens = 500
                        const inputCost = (inputTokens / 1_000_000) * currentPricing.input
                        const outputCost = (outputTokens / 1_000_000) * currentPricing.output
                        const totalUsd = inputCost + outputCost
                        const totalThb = totalUsd * usdToThb
                        return (
                          <div className="p-2 rounded bg-card/50 border border-border/30">
                            <div className="text-muted-foreground">Typical Request (1.5K in + 500 out)</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-foreground">${totalUsd.toFixed(6)}</span>
                              <span className="text-muted-foreground/50">=</span>
                              <span className="font-mono text-amber-400">฿{totalThb.toFixed(4)}</span>
                            </div>
                          </div>
                        )
                      })()}
                      {/* Quiz Generation */}
                      {(() => {
                        const inputTokens = 2000
                        const outputTokens = 3000
                        const inputCost = (inputTokens / 1_000_000) * currentPricing.input
                        const outputCost = (outputTokens / 1_000_000) * currentPricing.output
                        const totalUsd = inputCost + outputCost
                        const totalThb = totalUsd * usdToThb
                        return (
                          <div className="p-2 rounded bg-card/50 border border-border/30">
                            <div className="text-muted-foreground">Quiz Gen (2K in + 3K out)</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-foreground">${totalUsd.toFixed(6)}</span>
                              <span className="text-muted-foreground/50">=</span>
                              <span className="font-mono text-amber-400">฿{totalThb.toFixed(4)}</span>
                            </div>
                          </div>
                        )
                      })()}
                      {/* Batch Comparison */}
                      {(() => {
                        const inputTokens = 10000
                        const outputTokens = 5000
                        const standardInputCost = (inputTokens / 1_000_000) * currentPricing.input
                        const standardOutputCost = (outputTokens / 1_000_000) * currentPricing.output
                        const standardTotal = (standardInputCost + standardOutputCost) * usdToThb
                        const batchInputCost = (inputTokens / 1_000_000) * currentPricing.batchInput
                        const batchOutputCost = (outputTokens / 1_000_000) * currentPricing.batchOutput
                        const batchTotal = (batchInputCost + batchOutputCost) * usdToThb
                        const savings = standardTotal - batchTotal
                        return (
                          <div className="p-2 rounded bg-card/50 border border-border/30">
                            <div className="text-muted-foreground">Batch vs Standard (10K in + 5K out)</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-foreground line-through opacity-50">฿{standardTotal.toFixed(4)}</span>
                              <span className="text-muted-foreground/50">→</span>
                              <span className="font-mono text-green-400">฿{batchTotal.toFixed(4)}</span>
                              <span className="text-green-500 text-[9px]">(-฿{savings.toFixed(4)})</span>
                            </div>
                          </div>
                        )
                      })()}
                      {/* 1 Credit Cost */}
                      {(() => {
                        const tokensPerCredit = creditSettings.tokensPerCredit || 2000
                        // Weighted average (60% input, 40% output)
                        const weightedPrice = (currentPricing.input * 0.6 + currentPricing.output * 0.4)
                        const creditCostUsd = (tokensPerCredit / 1_000_000) * weightedPrice
                        const creditCostThb = creditCostUsd * usdToThb
                        return (
                          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                            <div className="text-purple-400">1 Credit ({tokensPerCredit.toLocaleString()} tokens)</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-foreground">${creditCostUsd.toFixed(6)}</span>
                              <span className="text-muted-foreground/50">=</span>
                              <span className="font-mono text-purple-400 font-bold">฿{creditCostThb.toFixed(4)}</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 3 Editable Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  USD → THB Rate
                </label>
                <NumberInput
                  step={0.1}
                  min={0}
                  allowDecimal
                  decimalPlaces={1}
                  value={creditSettings.usdToThbRate}
                  onChange={(value) =>
                    setCreditSettings({
                      ...creditSettings,
                      usdToThbRate: value || 35,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Tokens per Credit
                </label>
                <NumberInput
                  step={100}
                  min={1}
                  value={creditSettings.tokensPerCredit || 2000}
                  onChange={(value) =>
                    setCreditSettings({
                      ...creditSettings,
                      tokensPerCredit: value || 2000,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  New User Credits
                </label>
                <NumberInput
                  min={0}
                  value={settings?.aiCreditsPerUser || 100}
                  onChange={(value) => updateSetting('aiCreditsPerUser', value)}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>

            {/* Calculated values - compact inline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs">
              <span className="text-muted-foreground">1 Credit =</span>
              <span className="font-mono font-bold text-foreground">฿{calculatedRate.thbPerCredit.toFixed(4)}</span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-muted-foreground">฿1 =</span>
              <span className="font-mono font-bold text-foreground">{calculatedRate.creditsPerBaht.toLocaleString()}</span>
              <span className="text-muted-foreground">credits</span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-muted-foreground">฿1 =</span>
              <span className="font-mono font-bold text-foreground">{calculatedRate.tokensPerBaht.toLocaleString()}</span>
              <span className="text-muted-foreground">tokens</span>
            </div>
            {/* Cost Analysis Section */}
            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">ต้นทุนโดยประมาณ</span>
                <button
                  type="button"
                  onClick={() => setShowCostInBaht(!showCostInBaht)}
                  className="text-xs px-2 py-1 rounded-md bg-card/50 border border-border/50 hover:bg-card/80 transition-colors"
                >
                  {showCostInBaht ? '฿ บาท' : '🎫 credits'}
                </button>
              </div>
              {(() => {
                const tokensPerCredit = creditSettings.tokensPerCredit || 500
                const newUserCredits = settings?.aiCreditsPerUser || 100
                // Estimated tokens per action (based on typical usage)
                const actions = [
                  { name: 'Quiz 10 ข้อ', tokens: 3000 },
                  { name: 'Summarize', tokens: 700 },
                  { name: 'Lesson', tokens: 2000 },
                  { name: 'Translate', tokens: 1000 },
                ]
                const userCounts = [
                  { count: 10000, label: '10K' },
                  { count: 100000, label: '100K' },
                  { count: 1000000, label: '1M' },
                ]
                const costPerNewUser = newUserCredits * calculatedRate.thbPerCredit

                return (
                  <div className="space-y-3">
                    {/* Action costs */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      {actions.map(({ name, tokens }) => {
                        const credits = Math.max(1, Math.ceil(tokens / tokensPerCredit))
                        const cost = credits * calculatedRate.thbPerCredit
                        return (
                          <span key={name} className="flex items-center gap-1">
                            <span className="text-purple-400">{name}</span>
                            <span className="text-muted-foreground">=</span>
                            {showCostInBaht ? (
                              <span className="font-mono text-purple-400/80">฿{cost.toFixed(2)}</span>
                            ) : (
                              <span className="font-mono text-purple-400/80">{credits} cr</span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                    {/* New user cost projections */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs border-t border-border/30 pt-3">
                      <span className="text-muted-foreground">New user ×</span>
                      {userCounts.map(({ count, label }) => (
                        <span key={count}>
                          <span className="text-amber-400">{label}</span>
                          <span className="text-muted-foreground"> = </span>
                          {showCostInBaht ? (
                            <span className="font-mono text-amber-400/80">฿{(costPerNewUser * count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          ) : (
                            <span className="font-mono text-amber-400/80">{(newUserCredits * count / 1000).toLocaleString()}K cr</span>
                          )}
                          <span className="text-muted-foreground/60">/mo</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Tier Pricing Table */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-4">
              ราคาและกำไรแต่ละ Tier
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Tier</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">แพ็กเกจ/เดือน</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">
                      <div className="flex flex-col">
                        <span>ต้นทุน API</span>
                        <span className="text-xs text-muted-foreground/60">(คำนวณ)</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Credits</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">
                      <div className="flex flex-col">
                        <span>กำไร/Package</span>
                        <span className="text-xs text-muted-foreground/60">(Margin)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]).map((tier) => {
                    const tierInfo = tierLabels[tier]
                    const monthlyCredits = tierMonthlyCredits[tier]

                    // Calculate API cost for this tier's credits
                    const apiCostForTier = monthlyCredits * costInfo.thbPerCredit

                    return (
                      <tr key={tier} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', tierInfo.bg.replace('/20', ''))} />
                            <span className={cn('font-medium', tierInfo.color)}>
                              {tierInfo.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tier === 'user' ? (
                            <span className="text-muted-foreground">Free</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">฿</span>
                              <NumberInput
                                min={0}
                                value={tierPackagePrice[tier]}
                                onChange={(value) =>
                                  setTierPackagePrice({
                                    ...tierPackagePrice,
                                    [tier]: value,
                                  })
                                }
                                className="w-20 h-8 bg-card/50 border-border/50 rounded-lg text-sm text-center"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-purple-400 font-mono text-xs">
                            ฿{apiCostForTier.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <NumberInput
                            min={0}
                            value={tierMonthlyCredits[tier]}
                            onChange={(value) =>
                              setTierMonthlyCredits({
                                ...tierMonthlyCredits,
                                [tier]: value,
                              })
                            }
                            className="w-16 h-8 bg-card/50 border-border/50 rounded-lg text-sm text-center mx-auto text-amber-500 font-medium"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tier === 'user' || tier === 'admin' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (() => {
                            // กำไร/Package = แพ็กเกจ - ต้นทุน API
                            const packagePrice = tierPackagePrice[tier]
                            const profitPerPackage = packagePrice - apiCostForTier
                            const packageMargin = packagePrice > 0 ? ((profitPerPackage / packagePrice) * 100) : 0
                            const isProfitable = profitPerPackage >= 0

                            return (
                              <div className="flex items-center justify-center gap-2">
                                <span className={cn(
                                  'font-medium font-mono',
                                  isProfitable ? 'text-emerald-500' : 'text-red-500'
                                )}>
                                  {isProfitable ? '+' : ''}฿{profitPerPackage.toFixed(2)}
                                </span>
                                <span className={cn(
                                  'text-xs font-medium px-2 py-0.5 rounded-full',
                                  isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                )}>
                                  {packageMargin.toFixed(0)}%
                                </span>
                              </div>
                            )
                          })()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Warning if any paid tier has negative margin (exclude user/admin) */}
            {(['plus', 'pro', 'ultra'] as UserRole[]).some(tier => {
              const apiCost = tierMonthlyCredits[tier] * costInfo.thbPerCredit
              return tierPackagePrice[tier] < apiCost
            }) && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">
                  บาง tier มีราคาต่ำกว่าต้นทุน! ควรปรับราคาให้สูงกว่าต้นทุนเพื่อไม่ให้ขาดทุน
                </p>
              </div>
            )}
          </div>


        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSaveAll}
            disabled={saving || savingCredits}
            className="rounded-xl px-8 py-3"
            size="lg"
          >
            {saving || savingCredits ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
