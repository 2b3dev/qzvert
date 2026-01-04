import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Coins,
  Loader2,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
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
  TokenEstimationRatios,
  UserRole,
} from '../../types/database'
import { DEFAULT_CREDIT_SETTINGS } from '../../types/database'

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

// Collapsible Section
function CollapsibleSection({
  title,
  description,
  icon: Icon,
  iconBg,
  children,
  defaultOpen = true,
}: {
  title: string
  description?: string
  icon: React.ElementType
  iconBg: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
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
  const [tierPricePerCredit, setTierPricePerCredit] = useState<Record<UserRole, number>>({
    user: 0.10,    // ฿0.10 per credit for free tier
    plus: 0.08,    // ฿0.08 per credit
    pro: 0.06,     // ฿0.06 per credit
    ultra: 0.04,   // ฿0.04 per credit
    admin: 0,      // Free for admin
  })

  // Monthly credits per tier (editable)
  const [tierMonthlyCredits, setTierMonthlyCredits] = useState<Record<UserRole, number>>({
    user: 3,       // Free tier gets 3 credits/month
    plus: 30,      // Hero tier
    pro: 100,      // Legend tier
    ultra: 500,    // Enterprise tier
    admin: 0,      // Unlimited (shown as ∞)
  })

  // Package price per tier (editable) - THB per month
  const [tierPackagePrice, setTierPackagePrice] = useState<Record<UserRole, number>>({
    user: 0,       // Free
    plus: 290,     // Hero
    pro: 790,      // Legend
    ultra: 2990,   // Enterprise
    admin: 0,      // Free
  })

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

        // Convert from markup/fixed to price per credit
        const conversionRate = creditData.creditConversionRate || 100
        const newPrices: Record<UserRole, number> = {} as Record<UserRole, number>

        for (const tier of ['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]) {
          if (creditData.tierPricingConfig.mode === 'fixed') {
            // Fixed mode: price per 1K tokens → price per credit
            // 1K tokens ≈ X credits, so price per credit = fixed / (1000 * tokens_per_credit_ratio)
            newPrices[tier] = creditData.tierPricingConfig.tiers[tier].fixed / 100
          } else {
            // Markup mode: calculate from actual cost
            // This is approximate, will be calculated properly
            newPrices[tier] = tier === 'admin' ? 0 :
              tier === 'user' ? 0.10 :
              tier === 'plus' ? 0.08 :
              tier === 'pro' ? 0.06 :
              0.04
          }
        }
        setTierPricePerCredit(newPrices)

        // Load tier monthly credits if saved
        if (settingsData.tierMonthlyCredits) {
          setTierMonthlyCredits(settingsData.tierMonthlyCredits as Record<UserRole, number>)
        }

        // Load tier package prices if saved
        if (settingsData.tierPackagePrice) {
          setTierPackagePrice(settingsData.tierPackagePrice as Record<UserRole, number>)
        }
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

      for (const tier of ['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]) {
        // Convert price per credit to price per 1K tokens
        // If 1 credit = ฿X, then price per 1K tokens = X * 100 (approx)
        updatedTierConfig.tiers[tier] = {
          ...updatedTierConfig.tiers[tier],
          fixed: tierPricePerCredit[tier] * 100,
          markup: 0, // Not used in fixed mode
        }
      }

      const updatedCreditSettings = {
        ...creditSettings,
        tierPricingConfig: updatedTierConfig,
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
    setTierPricePerCredit({
      user: 0.10,
      plus: 0.08,
      pro: 0.06,
      ultra: 0.04,
      admin: 0,
    })
    setTierMonthlyCredits({
      user: 3,
      plus: 30,
      pro: 100,
      ultra: 500,
      admin: 0,
    })
    setTierPackagePrice({
      user: 0,
      plus: 290,
      pro: 790,
      ultra: 2990,
      admin: 0,
    })
    toast.success('Reset to default values (not saved yet)')
  }

  const updateTokenRatio = (
    key: keyof TokenEstimationRatios,
    value: number,
  ) => {
    setCreditSettings({
      ...creditSettings,
      tokenEstimationRatios: {
        ...creditSettings.tokenEstimationRatios,
        [key]: value,
      },
    })
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

          {/* API Pricing - moved to top */}
          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">API Pricing (Gemini 2.0 Flash)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Input ($/1M tokens)
                </label>
                <NumberInput
                  step={0.01}
                  min={0}
                  allowDecimal
                  decimalPlaces={2}
                  value={creditSettings.geminiInputPrice}
                  onChange={(value) =>
                    setCreditSettings({
                      ...creditSettings,
                      geminiInputPrice: value || 0.1,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Output ($/1M tokens)
                </label>
                <NumberInput
                  step={0.01}
                  min={0}
                  allowDecimal
                  decimalPlaces={2}
                  value={creditSettings.geminiOutputPrice}
                  onChange={(value) =>
                    setCreditSettings({
                      ...creditSettings,
                      geminiOutputPrice: value || 0.4,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
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
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Tokens per Credit
                </label>
                <NumberInput
                  step={50}
                  min={1}
                  value={creditSettings.tokensPerCredit || 500}
                  onChange={(value) =>
                    setCreditSettings({
                      ...creditSettings,
                      tokensPerCredit: value || 500,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>
            {/* Calculated values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">1 Credit =</div>
                <div className="font-mono font-bold text-foreground">
                  {calculatedRate.tokensPerCredit.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">tokens</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">1 Credit =</div>
                <div className="font-mono font-bold text-foreground">
                  ฿{calculatedRate.thbPerCredit.toFixed(4)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">฿1 =</div>
                <div className="font-mono font-bold text-foreground">
                  {calculatedRate.creditsPerBaht.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">credits</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">฿1 =</div>
                <div className="font-mono font-bold text-foreground">
                  {calculatedRate.tokensPerBaht.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">tokens</span>
                </div>
              </div>
            </div>
          </div>

          {/* Token Estimation Ratios - Collapsible */}
          <CollapsibleSection
            title="Token Estimation Ratios"
            description="Output/Input ratio for each mode"
            icon={Sparkles}
            iconBg="bg-pink-500"
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Summarize (%)
                </label>
                <NumberInput
                  step={5}
                  min={0}
                  max={200}
                  value={creditSettings.tokenEstimationRatios.summarize}
                  onChange={(value) => updateTokenRatio('summarize', value)}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Lesson (%)
                </label>
                <NumberInput
                  step={5}
                  min={0}
                  max={200}
                  value={creditSettings.tokenEstimationRatios.lesson}
                  onChange={(value) => updateTokenRatio('lesson', value)}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Translate (%)
                </label>
                <NumberInput
                  step={5}
                  min={0}
                  max={200}
                  value={creditSettings.tokenEstimationRatios.translate}
                  onChange={(value) => updateTokenRatio('translate', value)}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Easy Explain (+%)
                </label>
                <NumberInput
                  step={5}
                  min={0}
                  max={100}
                  value={creditSettings.tokenEstimationRatios.easyExplainModifier}
                  onChange={(value) => updateTokenRatio('easyExplainModifier', value)}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* New User Credits - Collapsible */}
          <CollapsibleSection
            title="Free Credits for New Users"
            description="จำนวน credits ที่ user ใหม่ได้รับ"
            icon={Users}
            iconBg="bg-emerald-500"
            defaultOpen={false}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Credits ที่จะถูกเพิ่มให้ user ใหม่อัตโนมัติเมื่อสมัคร
              </p>
              <div className="flex items-center gap-2">
                <NumberInput
                  min={0}
                  value={settings?.aiCreditsPerUser || 100}
                  onChange={(value) => updateSetting('aiCreditsPerUser', value)}
                  className="w-24 bg-card/50 border-border/50 rounded-xl text-right font-bold"
                />
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            </div>
          </CollapsibleSection>

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
                      <div className="flex items-center justify-center gap-1">
                        ราคา/Credit
                        <span className="text-xs text-muted-foreground/60">(฿)</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">ต้นทุน/Credit</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">กำไร/Credit</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {(['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]).map((tier) => {
                    const tierInfo = tierLabels[tier]
                    const pricePerCredit = tierPricePerCredit[tier]
                    const monthlyCredits = tierMonthlyCredits[tier]

                    // Cost per credit = actual THB value of 1 credit (from API pricing)
                    const costPerCredit = tier === 'admin' ? 0 : costInfo.thbPerCredit
                    const profitPerCredit = pricePerCredit - costPerCredit
                    const marginPercent = pricePerCredit > 0 ? ((profitPerCredit / pricePerCredit) * 100) : 0
                    const isProfit = profitPerCredit >= 0

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
                          {tier === 'user' || tier === 'admin' ? (
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
                          {tier === 'admin' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span className="text-purple-400 font-mono text-xs">
                              ฿{apiCostForTier.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tier === 'admin' ? (
                            <span className="text-amber-500 font-medium">∞</span>
                          ) : (
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
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tier === 'admin' || tier === 'user' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <NumberInput
                              step={0.01}
                              min={0}
                              allowDecimal
                              decimalPlaces={2}
                              value={pricePerCredit}
                              onChange={(value) =>
                                setTierPricePerCredit({
                                  ...tierPricePerCredit,
                                  [tier]: value,
                                })
                              }
                              className="w-20 h-8 bg-card/50 border-border/50 rounded-lg text-sm text-center mx-auto"
                            />
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-muted-foreground">
                          {tier === 'admin' || tier === 'user' ? '-' : `฿${costPerCredit.toFixed(4)}`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tier === 'admin' || tier === 'user' ? (
                            '-'
                          ) : (
                            <span className={cn(
                              'font-medium',
                              isProfit ? 'text-emerald-500' : 'text-red-500'
                            )}>
                              {isProfit ? '+' : ''}฿{profitPerCredit.toFixed(4)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {tier === 'admin' || tier === 'user' ? (
                            '-'
                          ) : (
                            <span className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            )}>
                              {marginPercent.toFixed(0)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Warning if any tier has negative margin */}
            {(['user', 'plus', 'pro', 'ultra'] as UserRole[]).some(tier => {
              return tierPricePerCredit[tier] < costInfo.thbPerCredit
            }) && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">
                  บาง tier มีราคาต่ำกว่าต้นทุน! ควรปรับราคาให้สูงกว่าต้นทุนเพื่อไม่ให้ขาดทุน
                </p>
              </div>
            )}
          </div>

          {/* Profit Preview (Worst Case) */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">กำไรต่อ User (Worst Case - ใช้ credits หมด)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['user', 'plus', 'pro', 'ultra'] as UserRole[]).map((tier) => {
                const tierInfo = tierLabels[tier]
                const packagePrice = tierPackagePrice[tier]
                const monthlyCredits = tierMonthlyCredits[tier]
                // Worst case: user uses all credits
                const maxApiCost = monthlyCredits * costInfo.thbPerCredit
                const profit = packagePrice - maxApiCost
                const marginPercent = packagePrice > 0 ? (profit / packagePrice) * 100 : 0

                return (
                  <div key={tier} className={cn('p-3 rounded-lg', tierInfo.bg)}>
                    <div className={cn('text-xs font-medium mb-1', tierInfo.color)}>
                      {tierInfo.name}
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {tier === 'user' ? 'Free' : `฿${packagePrice.toLocaleString()}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ต้นทุน max: ฿{maxApiCost.toFixed(2)}
                    </div>
                    <div className={cn(
                      'text-xs font-medium',
                      profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {tier === 'user' ? (
                        <span className="text-amber-500">ขาดทุน: ฿{maxApiCost.toFixed(2)}</span>
                      ) : (
                        <>กำไร: {profit >= 0 ? '+' : ''}฿{profit.toFixed(2)} ({marginPercent.toFixed(0)}%)</>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Free Tier Cost Summary */}
            {(() => {
              const freeCredits = tierMonthlyCredits.user
              const costPerFreeUser = freeCredits * costInfo.thbPerCredit
              const userCounts = [100, 1000, 10000, 100000]

              return (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-400 mb-2">
                    Free Tier Cost Analysis (ขาดทุน ฿{costPerFreeUser.toFixed(4)}/user/เดือน)
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {userCounts.map((count) => (
                      <div key={count} className="text-amber-300/80">
                        <span className="text-amber-400">{count.toLocaleString()}</span> users = ฿{(costPerFreeUser * count).toFixed(2)}/เดือน
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
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
