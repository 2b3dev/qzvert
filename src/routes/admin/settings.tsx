import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Coins,
  FileUp,
  HardDrive,
  Info,
  Loader2,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  ToggleRight,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  getAllCreditSettings,
  getSystemSettings,
  saveAllCreditSettings,
  updateSystemSettings,
  type SystemSettings,
} from '../../server/admin-settings'
import { getProfitPreviewAllTiers } from '../../server/credit-calculator'
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
    <div className="border border-border/30 rounded-xl overflow-hidden">
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
        const [settingsData, creditData] = await Promise.all([
          getSystemSettings(),
          getAllCreditSettings(),
        ])
        setSettings(settingsData)
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

  const handleSaveAll = async () => {
    if (!settings) return

    setSaving(true)
    setSavingCredits(true)
    try {
      await Promise.all([
        updateSystemSettings({ data: settings }),
        saveAllCreditSettings({ data: creditSettings }),
      ])
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
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

  const tierLabels: Record<UserRole, { name: string; color: string; bg: string }> = {
    user: { name: 'Free', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    plus: { name: 'Plus', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    pro: { name: 'Pro', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    ultra: { name: 'Ultra', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    admin: { name: 'Admin', color: 'text-red-400', bg: 'bg-red-500/20' },
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

  // Calculate estimated credits per request for display
  const avgTokens = previewInputTokens + previewOutputTokens
  const freeUserPreview = profitPreview.find((p) => p.tier === 'user')
  const estimatedCreditsPerRequest = freeUserPreview?.credits || 1

  return (
    <AdminLayout title="Settings" activeItem="settings">
      <div className="space-y-6 max-w-4xl">
        {/* Header with Save All button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your platform settings
            </p>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving || savingCredits}
            className="rounded-xl px-6"
          >
            {saving || savingCredits ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All
          </Button>
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
                  Configure credit system and tier pricing
                </p>
              </div>
            </div>
            <button
              onClick={resetCreditSettingsToDefaults}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Quick Settings - Most Important */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Free Credits for New Users */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">
                  New User Credits
                </span>
              </div>
              <Input
                type="number"
                min={0}
                value={settings?.aiCreditsPerUser || 100}
                onChange={(e) =>
                  updateSetting('aiCreditsPerUser', parseInt(e.target.value) || 0)
                }
                className="bg-card/50 border-border/50 rounded-xl text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground mt-2">
                ~{Math.floor((settings?.aiCreditsPerUser || 100) / estimatedCreditsPerRequest)} free requests
              </p>
            </div>

            {/* Credits per THB */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">
                  Credits per ฿1
                </span>
              </div>
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
                className="bg-card/50 border-border/50 rounded-xl text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground mt-2">
                1 credit = ฿{(1 / creditSettings.creditConversionRate).toFixed(4)}
              </p>
            </div>

            {/* USD to THB */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-foreground">
                  USD → THB Rate
                </span>
              </div>
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
                className="bg-card/50 border-border/50 rounded-xl text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground mt-2">
                $1 = ฿{creditSettings.usdToThbRate}
              </p>
            </div>
          </div>

          {/* Tier Pricing - Simplified */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Tier Pricing
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={creditSettings.tierPricingConfig.mode === 'markup'}
                    onChange={() => updatePricingMode('markup')}
                    className="w-3 h-3"
                  />
                  <span>Markup %</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={creditSettings.tierPricingConfig.mode === 'fixed'}
                    onChange={() => updatePricingMode('fixed')}
                    className="w-3 h-3"
                  />
                  <span>Fixed ฿/1K</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(['user', 'plus', 'pro', 'ultra', 'admin'] as UserRole[]).map((tier) => {
                const preview = profitPreview.find((p) => p.tier === tier)
                return (
                  <div
                    key={tier}
                    className={cn(
                      'p-3 rounded-xl border',
                      tierLabels[tier].bg,
                      'border-border/30',
                    )}
                  >
                    <div className={cn('text-sm font-medium mb-2', tierLabels[tier].color)}>
                      {tierLabels[tier].name}
                    </div>
                    {creditSettings.tierPricingConfig.mode === 'markup' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={creditSettings.tierPricingConfig.tiers[tier].markup}
                          onChange={(e) =>
                            updateTierPricing(tier, 'markup', parseInt(e.target.value) || 0)
                          }
                          className="h-8 bg-card/50 border-border/50 rounded-lg text-sm"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">฿</span>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={creditSettings.tierPricingConfig.tiers[tier].fixed}
                          onChange={(e) =>
                            updateTierPricing(tier, 'fixed', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 bg-card/50 border-border/50 rounded-lg text-sm"
                        />
                      </div>
                    )}
                    {preview && (
                      <div className="mt-2 text-xs">
                        <span className="text-amber-500 font-medium">{preview.credits}</span>
                        <span className="text-muted-foreground"> credits</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Profit Preview */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">Profit Preview</span>
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Tokens:</span>
                <Input
                  type="number"
                  min={0}
                  value={previewInputTokens}
                  onChange={(e) => setPreviewInputTokens(parseInt(e.target.value) || 0)}
                  className="w-20 h-7 bg-card/50 border-border/50 rounded-lg text-xs"
                  placeholder="Input"
                />
                <span className="text-muted-foreground">+</span>
                <Input
                  type="number"
                  min={0}
                  value={previewOutputTokens}
                  onChange={(e) => setPreviewOutputTokens(parseInt(e.target.value) || 0)}
                  className="w-20 h-7 bg-card/50 border-border/50 rounded-lg text-xs"
                  placeholder="Output"
                />
              </div>
            </div>

            {profitPreview.length > 0 && (
              <div className="grid grid-cols-5 gap-2 text-xs">
                {profitPreview.map((row) => (
                  <div
                    key={row.tier}
                    className="p-2 rounded-lg bg-card/50 text-center"
                  >
                    <div className={cn('font-medium mb-1', tierLabels[row.tier].color)}>
                      {tierLabels[row.tier].name}
                    </div>
                    <div className="text-muted-foreground">
                      Cost: ฿{row.actualCostTHB.toFixed(4)}
                    </div>
                    <div className={cn(
                      'font-medium',
                      row.profitTHB >= 0 ? 'text-emerald-500' : 'text-red-500',
                    )}>
                      {row.profitTHB >= 0 ? '+' : ''}฿{row.profitTHB.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Settings - Collapsible */}
          <div className="mt-6 space-y-3">
            <CollapsibleSection
              title="API Pricing"
              description="Gemini API token prices"
              icon={Zap}
              iconBg="bg-purple-500"
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Input Price ($/1M tokens)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={creditSettings.geminiInputPrice}
                    onChange={(e) =>
                      setCreditSettings({
                        ...creditSettings,
                        geminiInputPrice: parseFloat(e.target.value) || 0.1,
                      })
                    }
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Output Price ($/1M tokens)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={creditSettings.geminiOutputPrice}
                    onChange={(e) =>
                      setCreditSettings({
                        ...creditSettings,
                        geminiOutputPrice: parseFloat(e.target.value) || 0.4,
                      })
                    }
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Gemini 2.0 Flash: $0.10/1M input, $0.40/1M output.
                  These values are used for cost estimation.
                </span>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Token Estimation Ratios"
              description="Output/Input ratio by mode"
              icon={Sparkles}
              iconBg="bg-pink-500"
              defaultOpen={false}
            >
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
                    <span className="text-xs text-muted-foreground w-10">
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
                    <span className="text-xs text-muted-foreground w-10">
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
                    <span className="text-xs text-muted-foreground w-10">
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
                        updateTokenRatio('easyExplainModifier', parseFloat(e.target.value) || 0)
                      }
                      className="bg-card/50 border-border/50 rounded-xl"
                    />
                    <span className="text-xs text-muted-foreground w-10">
                      +{Math.round(creditSettings.tokenEstimationRatios.easyExplainModifier * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Usage Limits"
              description="Max activities, questions, file size"
              icon={HardDrive}
              iconBg="bg-blue-500"
              defaultOpen={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Max Activities per User
                  </label>
                  <Input
                    type="number"
                    value={settings?.maxActivitiesPerUser || 100}
                    onChange={(e) =>
                      updateSetting('maxActivitiesPerUser', parseInt(e.target.value) || 100)
                    }
                    min={1}
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Max Questions per Activity
                  </label>
                  <Input
                    type="number"
                    value={settings?.maxQuestionsPerActivity || 50}
                    onChange={(e) =>
                      updateSetting('maxQuestionsPerActivity', parseInt(e.target.value) || 50)
                    }
                    min={1}
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <FileUp className="w-3 h-3" />
                    Max File Upload (MB)
                  </label>
                  <Input
                    type="number"
                    value={settings?.maxFileUploadSizeMB || 5}
                    onChange={(e) =>
                      updateSetting('maxFileUploadSizeMB', parseInt(e.target.value) || 5)
                    }
                    min={1}
                    className="bg-card/50 border-border/50 rounded-xl"
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
                <p className="font-medium text-foreground">Enable AI Generation</p>
                <p className="text-sm text-muted-foreground">
                  Allow AI-powered content generation
                </p>
              </div>
              <Toggle
                checked={settings?.enableAIGeneration ?? true}
                onChange={(checked) => updateSetting('enableAIGeneration', checked)}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
