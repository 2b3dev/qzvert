import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Loader2,
  Save,
  Server,
  Settings,
  Sparkles,
  ToggleRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  getSystemSettings,
  updateSystemSettings,
  type SystemSettings,
} from '../../server/admin-settings'

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const settingsData = await getSystemSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
          className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-violet-500/30 transition-all duration-300"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-linear-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
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
          </div>
        </motion.div>

        {/* Limits Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
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
          </div>
        </motion.div>

        {/* AI Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-purple-500/30 transition-all duration-300"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20">
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
          </div>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-emerald-500/30 transition-all duration-300"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
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
