import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Calculator,
  ChevronDown,
  Coins,
  Loader2,
  RotateCcw,
  Save,
  Server,
  Settings,
  Sparkles,
  ToggleRight,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  GEMINI_FREE_TIER,
  GEMINI_PRICING,
  getAllCreditSettings,
  getGeminiPricingSettings,
  getSystemSettings,
  saveAllCreditSettings,
  saveGeminiPricingSettings,
  updateSystemSettings,
  type GeminiPricingSettings,
  type SystemSettings,
} from '../../server/admin-settings'
import { getProfitPreviewAllTiers } from '../../server/credit-calculator'
import type {
  CreditSettings,
  TierPricingConfig,
  TokenEstimationRatios,
  UserRole,
} from '../../types/database'
import {
  DEFAULT_CREDIT_SETTINGS,
  DEFAULT_TIER_PRICING_CONFIG,
  DEFAULT_TOKEN_ESTIMATION_RATIOS,
} from '../../types/database'

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

  // AI Pricing Settings state
  const [pricingSettings, setPricingSettings] =
    useState<GeminiPricingSettings | null>(null)
  const [savingPricing, setSavingPricing] = useState(false)
  const [calcInputPrice, setCalcInputPrice] = useState<string>(
    GEMINI_PRICING['gemini-2.0-flash'].input.toString(),
  )
  const [calcOutputPrice, setCalcOutputPrice] = useState<string>(
    GEMINI_PRICING['gemini-2.0-flash'].output.toString(),
  )
  const [calcFreeTierQuota, setCalcFreeTierQuota] = useState<string>(
    GEMINI_FREE_TIER.requestsPerDay.toString(),
  )

  // AI Credit Configuration state
  const [creditSettings, setCreditSettings] = useState<CreditSettings>(
    DEFAULT_CREDIT_SETTINGS,
  )
  const [savingCredits, setSavingCredits] = useState(false)
  const [profitPreview, setProfitPreview] = useState<
    Array<{
      tier: UserRole
      actualCostTHB: number
      chargeTHB: number
      profitTHB: number
      credits: number
    }>
  >([])
  const [previewInputTokens, setPreviewInputTokens] = useState(1000)
  const [previewOutputTokens, setPreviewOutputTokens] = useState(400)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [settingsData, pricingData, creditData] = await Promise.all([
          getSystemSettings(),
          getGeminiPricingSettings(),
          getAllCreditSettings(),
        ])
        setSettings(settingsData)
        setPricingSettings(pricingData)
        setCalcInputPrice(pricingData.inputPrice.toString())
        setCalcOutputPrice(pricingData.outputPrice.toString())
        setCalcFreeTierQuota(pricingData.freeTierQuota.toString())
        setCreditSettings(creditData)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch profit preview when tokens change
  useEffect(() => {
    const fetchProfitPreview = async () => {
      try {
        const preview = await getProfitPreviewAllTiers({
          data: {
            inputTokens: previewInputTokens,
            outputTokens: previewOutputTokens,
          },
        })
        setProfitPreview(preview)
      } catch (error) {
        console.error('Failed to fetch profit preview:', error)
      }
    }

    const timer = setTimeout(fetchProfitPreview, 300)
    return () => clearTimeout(timer)
  }, [previewInputTokens, previewOutputTokens, creditSettings])

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await updateSystemSettings({ data: settings })
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePricing = async () => {
    setSavingPricing(true)
    try {
      const newPricing = {
        inputPrice: parseFloat(calcInputPrice) || 0,
        outputPrice: parseFloat(calcOutputPrice) || 0,
        freeTierQuota: parseFloat(calcFreeTierQuota) || 0,
      }
      await saveGeminiPricingSettings({ data: newPricing })
      setPricingSettings(newPricing)
      toast.success('Pricing settings saved')
    } catch (error) {
      console.error('Failed to save pricing settings:', error)
      toast.error('Failed to save pricing settings')
    } finally {
      setSavingPricing(false)
    }
  }

  const resetPricingToDefaults = () => {
    setCalcInputPrice(GEMINI_PRICING['gemini-2.0-flash'].input.toString())
    setCalcOutputPrice(GEMINI_PRICING['gemini-2.0-flash'].output.toString())
    setCalcFreeTierQuota(GEMINI_FREE_TIER.requestsPerDay.toString())
    toast.success('Reset to default values (not saved yet)')
  }

  const handleSaveCreditSettings = async () => {
    setSavingCredits(true)
    try {
      await saveAllCreditSettings({ data: creditSettings })
      toast.success('Credit settings saved successfully')
    } catch (error) {
      console.error('Failed to save credit settings:', error)
      toast.error('Failed to save credit settings')
    } finally {
      setSavingCredits(false)
    }
  }

  const resetCreditSettingsToDefaults = () => {
    setCreditSettings(DEFAULT_CREDIT_SETTINGS)
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

  const updateTierPricing = (
    tier: UserRole,
    field: 'markup' | 'fixed',
    value: number,
  ) => {
    setCreditSettings({
      ...creditSettings,
      tierPricingConfig: {
        ...creditSettings.tierPricingConfig,
        tiers: {
          ...creditSettings.tierPricingConfig.tiers,
          [tier]: {
            ...creditSettings.tierPricingConfig.tiers[tier],
            [field]: value,
          },
        },
      },
    })
  }

  const updatePricingMode = (mode: 'markup' | 'fixed') => {
    setCreditSettings({
      ...creditSettings,
      tierPricingConfig: {
        ...creditSettings.tierPricingConfig,
        mode,
      },
    })
  }

  const tierLabels: Record<UserRole, { name: string; color: string }> = {
    user: { name: 'Free', color: 'text-gray-400' },
    plus: { name: 'Plus', color: 'text-blue-400' },
    pro: { name: 'Pro', color: 'text-purple-400' },
    ultra: { name: 'Ultra', color: 'text-amber-400' },
    admin: { name: 'Admin', color: 'text-red-400' },
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

  return (
    <AdminLayout title="Settings" activeItem="settings">
      <div className="space-y-6 max-w-4xl">
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
            <h2 className="text-lg font-semibold text-foreground">
              General Settings
            </h2>
          </div>

            <div className="space-y-4">
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
                  onChange={(e) =>
                    updateSetting('siteDescription', e.target.value)
                  }
                  placeholder="AI-powered Learning Platform"
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Disable access to the site for non-admin users
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

        {/* Limits Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-blue-500">
              <Server className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Limits</h2>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Max Activities per User
                </label>
                <Input
                  type="number"
                  value={settings?.maxActivitiesPerUser || 100}
                  onChange={(e) =>
                    updateSetting('maxActivitiesPerUser', parseInt(e.target.value))
                  }
                  min={1}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Max Questions per Activity
                </label>
                <Input
                  type="number"
                  value={settings?.maxQuestionsPerActivity || 50}
                  onChange={(e) =>
                    updateSetting(
                      'maxQuestionsPerActivity',
                      parseInt(e.target.value),
                    )
                  }
                  min={1}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Max File Upload (MB)
                </label>
                <Input
                  type="number"
                  value={settings?.maxFileUploadSizeMB || 5}
                  onChange={(e) =>
                    updateSetting('maxFileUploadSizeMB', parseInt(e.target.value))
                  }
                  min={1}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>
        </motion.div>

        {/* AI Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-purple-500">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              AI Settings
            </h2>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  AI Credits per New User
                </label>
                <Input
                  type="number"
                  value={settings?.aiCreditsPerUser || 100}
                  onChange={(e) =>
                    updateSetting('aiCreditsPerUser', parseInt(e.target.value))
                  }
                  min={0}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  AI Credits per Generation
                </label>
                <Input
                  type="number"
                  value={settings?.aiCreditsPerGeneration || 10}
                  onChange={(e) =>
                    updateSetting(
                      'aiCreditsPerGeneration',
                      parseInt(e.target.value),
                    )
                  }
                  min={1}
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>
        </motion.div>

        {/* AI Pricing Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  AI Pricing
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gemini API cost calculation settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetPricingToDefaults}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Reset to defaults
              </button>
              <Button
                onClick={handleSavePricing}
                disabled={savingPricing}
                size="sm"
                className="rounded-lg"
              >
                {savingPricing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Input Price ($/1M tokens)
              </label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={calcInputPrice}
                onChange={(e) => setCalcInputPrice(e.target.value)}
                className="bg-card/50 border-border/50 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: ${GEMINI_PRICING['gemini-2.0-flash'].input}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Output Price ($/1M tokens)
              </label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={calcOutputPrice}
                onChange={(e) => setCalcOutputPrice(e.target.value)}
                className="bg-card/50 border-border/50 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: ${GEMINI_PRICING['gemini-2.0-flash'].output}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Free Tier Quota (req/day)
              </label>
              <Input
                type="number"
                min={0}
                value={calcFreeTierQuota}
                onChange={(e) => setCalcFreeTierQuota(e.target.value)}
                className="bg-card/50 border-border/50 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: {GEMINI_FREE_TIER.requestsPerDay.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
            <p>
              These settings are used for cost estimation calculations in the{' '}
              <a
                href="/admin/usages"
                className="text-primary hover:underline"
              >
                Usages
              </a>{' '}
              page. They don't affect actual API billing.
            </p>
          </div>
        </motion.div>

        {/* AI Credit Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.37 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  AI Credit Configuration
                </h2>
                <p className="text-xs text-muted-foreground">
                  Token estimation & tier pricing for credit calculation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetCreditSettingsToDefaults}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <Button
                onClick={handleSaveCreditSettings}
                disabled={savingCredits}
                size="sm"
                className="rounded-lg"
              >
                {savingCredits ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>

          {/* Token Estimation Ratios */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Token Estimation Ratios
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Output tokens = Input tokens x Ratio (used for credit estimation before AI processing)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Summarize
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    max={2}
                    value={creditSettings.tokenEstimationRatios.summarize}
                    onChange={(e) =>
                      updateTokenRatio('summarize', parseFloat(e.target.value) || 0)
                    }
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(creditSettings.tokenEstimationRatios.summarize * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Lesson
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    max={2}
                    value={creditSettings.tokenEstimationRatios.lesson}
                    onChange={(e) =>
                      updateTokenRatio('lesson', parseFloat(e.target.value) || 0)
                    }
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(creditSettings.tokenEstimationRatios.lesson * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Translate
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    max={2}
                    value={creditSettings.tokenEstimationRatios.translate}
                    onChange={(e) =>
                      updateTokenRatio('translate', parseFloat(e.target.value) || 0)
                    }
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {Math.round(creditSettings.tokenEstimationRatios.translate * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Easy Explain (+)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    value={creditSettings.tokenEstimationRatios.easyExplainModifier}
                    onChange={(e) =>
                      updateTokenRatio(
                        'easyExplainModifier',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    +{Math.round(creditSettings.tokenEstimationRatios.easyExplainModifier * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Mode */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Pricing Mode
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingMode"
                  checked={creditSettings.tierPricingConfig.mode === 'markup'}
                  onChange={() => updatePricingMode('markup')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm">Markup Percentage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingMode"
                  checked={creditSettings.tierPricingConfig.mode === 'fixed'}
                  onChange={() => updatePricingMode('fixed')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm">Fixed Price per 1K Tokens</span>
              </label>
            </div>
          </div>

          {/* Tier Pricing Table */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Tier Pricing
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Tier
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Markup %
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                      Fixed (฿/1K tokens)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]).map(
                    (tier) => (
                      <tr key={tier} className="border-b border-border/30">
                        <td className="py-2 px-3">
                          <span className={cn('font-medium', tierLabels[tier].color)}>
                            {tierLabels[tier].name}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min={0}
                            value={creditSettings.tierPricingConfig.tiers[tier].markup}
                            onChange={(e) =>
                              updateTierPricing(
                                tier,
                                'markup',
                                parseInt(e.target.value) || 0,
                              )
                            }
                            disabled={creditSettings.tierPricingConfig.mode === 'fixed'}
                            className={cn(
                              'w-24 h-8 bg-card/50 border-border/50 rounded-lg text-sm',
                              creditSettings.tierPricingConfig.mode === 'fixed' &&
                                'opacity-50',
                            )}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={creditSettings.tierPricingConfig.tiers[tier].fixed}
                            onChange={(e) =>
                              updateTierPricing(
                                tier,
                                'fixed',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            disabled={creditSettings.tierPricingConfig.mode === 'markup'}
                            className={cn(
                              'w-24 h-8 bg-card/50 border-border/50 rounded-lg text-sm',
                              creditSettings.tierPricingConfig.mode === 'markup' &&
                                'opacity-50',
                            )}
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Conversion Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  USD to THB Rate
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={creditSettings.usdToThbRate}
                  onChange={(e) =>
                    setCreditSettings({
                      ...creditSettings,
                      usdToThbRate: parseFloat(e.target.value) || 35,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Credits per THB
                </label>
                <Input
                  type="number"
                  min={1}
                  value={creditSettings.creditConversionRate}
                  onChange={(e) =>
                    setCreditSettings({
                      ...creditSettings,
                      creditConversionRate: parseInt(e.target.value) || 100,
                    })
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1 THB = {creditSettings.creditConversionRate} credits
                </p>
              </div>
            </div>
          </div>

          {/* Profit Calculator Preview */}
          <div className="p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-medium text-foreground">
                Profit Calculator (Preview)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Input Tokens
                </label>
                <Input
                  type="number"
                  min={0}
                  value={previewInputTokens}
                  onChange={(e) =>
                    setPreviewInputTokens(parseInt(e.target.value) || 0)
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Output Tokens
                </label>
                <Input
                  type="number"
                  min={0}
                  value={previewOutputTokens}
                  onChange={(e) =>
                    setPreviewOutputTokens(parseInt(e.target.value) || 0)
                  }
                  className="bg-card/50 border-border/50 rounded-xl"
                />
              </div>
            </div>

            {profitPreview.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">
                        Tier
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-xs">
                        Cost
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-xs">
                        Charge
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-xs">
                        Profit
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-xs">
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitPreview.map((row) => (
                      <tr key={row.tier} className="border-b border-border/30">
                        <td className="py-2 px-2">
                          <span
                            className={cn('font-medium', tierLabels[row.tier].color)}
                          >
                            {tierLabels[row.tier].name}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          ฿{row.actualCostTHB.toFixed(4)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          ฿{row.chargeTHB.toFixed(4)}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-2 text-right font-medium',
                            row.profitTHB >= 0 ? 'text-emerald-500' : 'text-red-500',
                          )}
                        >
                          {row.profitTHB >= 0 ? '+' : ''}฿{row.profitTHB.toFixed(4)}
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-amber-500">
                          {row.credits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500">
              <ToggleRight className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Features</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">
                  Enable AI Generation
                </p>
                <p className="text-sm text-muted-foreground">
                  Allow AI-powered content generation
                </p>
              </div>
              <Toggle
                checked={settings?.enableAIGeneration ?? true}
                onChange={(checked) =>
                  updateSetting('enableAIGeneration', checked)
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6">
            {saving ? (
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
